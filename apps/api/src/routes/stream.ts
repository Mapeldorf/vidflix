import { Router, Request, Response } from 'express';
import WebTorrent from 'webtorrent';
import { db } from '../db/init';

export const streamRouter = Router();

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos sin uso → destruir
const CLEANUP_INTERVAL_MS = 60 * 1000;  // revisar cada minuto

interface ActiveTorrent {
  client: WebTorrent.Instance;
  videoFile: WebTorrent.TorrentFile;
  lastAccessAt: number;
  activeConnections: number;
}

const activeTorrents = new Map<number, ActiveTorrent>();
const pendingTorrents = new Map<number, Promise<ActiveTorrent>>();

function destroyTorrent(id: number): void {
  const entry = activeTorrents.get(id);
  if (!entry) return;
  console.log(`[stream] Destruyendo torrent inactivo para movie ${id}`);
  entry.client.destroy();
  activeTorrents.delete(id);
}

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of activeTorrents) {
    if (entry.activeConnections === 0 && now - entry.lastAccessAt > IDLE_TIMEOUT_MS) {
      destroyTorrent(id);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
  };
  return types[ext] ?? 'video/mp4';
}

const TORRENT_START_TIMEOUT_MS = 45_000; // 45s — below Fly.io's 60s proxy timeout

function startTorrent(id: number, magnetLink: string): Promise<ActiveTorrent> {
  const existing = activeTorrents.get(id);
  if (existing) return Promise.resolve(existing);

  const pending = pendingTorrents.get(id);
  if (pending) return pending;

  const promise = new Promise<ActiveTorrent>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingTorrents.delete(id);
      activeTorrents.delete(id);
      reject(new Error('Timeout esperando peers del torrent'));
    }, TORRENT_START_TIMEOUT_MS);
    const client =
      new (WebTorrent as unknown as new (opts?: object) => WebTorrent.Instance)({ utp: false });

    const source: string | Buffer = magnetLink.startsWith('torrent:base64,')
      ? Buffer.from(magnetLink.slice('torrent:base64,'.length), 'base64')
      : magnetLink;

    // Silence unhandled errors after promise settles to avoid crashing the process
    client.on('error', (err: Error) => {
      console.error(`[stream] WebTorrent error for movie ${id}:`, err.message);
      if (pendingTorrents.has(id)) {
        clearTimeout(timeout);
        pendingTorrents.delete(id);
        activeTorrents.delete(id);
        reject(err);
      }
    });

    client.add(source as string | Buffer, (torrent: WebTorrent.Torrent) => {
      const videoFile =
        torrent.files.find((f: WebTorrent.TorrentFile) =>
          /\.(mp4|mkv|avi|mov|webm|m4v)$/i.test(f.name)
        ) ?? torrent.files[0];

      if (!videoFile) {
        clearTimeout(timeout);
        client.destroy();
        pendingTorrents.delete(id);
        reject(new Error('No se encontró archivo de video en el torrent'));
        return;
      }

      clearTimeout(timeout);
      console.log(
        `[stream] Torrent listo para movie ${id}: ${videoFile.name} (${videoFile.length} bytes)`
      );
      const active: ActiveTorrent = { client, videoFile, lastAccessAt: Date.now(), activeConnections: 0 };
      activeTorrents.set(id, active);
      pendingTorrents.delete(id);
      resolve(active);
    });
  });

  pendingTorrents.set(id, promise);
  return promise;
}

streamRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'], 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const movie = db
    .prepare('SELECT magnet_link FROM movies WHERE id = ?')
    .get(id) as { magnet_link: string } | undefined;

  if (!movie?.magnet_link) {
    res.status(404).json({ error: 'Película no encontrada' });
    return;
  }

  console.log(`[stream] Solicitud para movie ${id}`);

  try {
    const active = await startTorrent(id, movie.magnet_link);
    const { videoFile } = active;
    active.lastAccessAt = Date.now();
    active.activeConnections++;

    const onDone = () => {
      active.activeConnections--;
      active.lastAccessAt = Date.now();
    };
    res.on('close', onDone);
    res.on('finish', onDone);

    const fileSize = videoFile.length;
    const mimeType = getMimeType(videoFile.name);
    const range = req.headers['range'];

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      });

      const stream = videoFile.createReadStream({ start, end });
      stream.on('error', (err: Error) => {
        console.error(`[stream] Pipe error for movie ${id}:`, err.message);
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': mimeType,
      });

      const stream = videoFile.createReadStream();
      stream.on('error', (err: Error) => {
        console.error(`[stream] Pipe error for movie ${id}:`, err.message);
      });
      stream.pipe(res);
    }
  } catch (err) {
    console.error(`[stream] Error para movie ${id}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error iniciando el torrent' });
    }
  }
});
