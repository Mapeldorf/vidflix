import { Router, Request, Response } from 'express';
import { db } from '../db/init';
import type { Movie, SaveMovieDto } from '@vidflix/shared-types';

export const moviesRouter = Router();

moviesRouter.get('/', (req: Request, res: Response) => {
  try {
    const movies = db
      .prepare('SELECT * FROM movies WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user!.userId) as Movie[];
    res.json(movies);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error obteniendo películas';
    res.status(500).json({ error: message });
  }
});

moviesRouter.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params['id'], 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    const movie = db
      .prepare('SELECT * FROM movies WHERE id = ? AND user_id = ?')
      .get(id, req.user!.userId) as Movie | undefined;
    if (!movie) {
      res.status(404).json({ error: 'Película no encontrada' });
      return;
    }
    res.json(movie);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error obteniendo película';
    res.status(500).json({ error: message });
  }
});

moviesRouter.post('/', (req: Request, res: Response) => {
  const body = req.body as SaveMovieDto;
  const {
    tmdb_id,
    title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    vote_average,
    runtime,
    genres,
    magnet_link,
  } = body;

  if (!tmdb_id || !title || !magnet_link) {
    res
      .status(400)
      .json({ error: 'tmdb_id, title y magnet_link son requeridos' });
    return;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO movies (user_id, tmdb_id, title, overview, poster_path, backdrop_path, release_date, vote_average, runtime, genres, magnet_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.user!.userId,
      tmdb_id,
      title,
      overview ?? '',
      poster_path ?? '',
      backdrop_path ?? '',
      release_date ?? '',
      vote_average ?? 0,
      runtime ?? 0,
      genres ?? '[]',
      magnet_link
    );
    const newMovie = db
      .prepare('SELECT * FROM movies WHERE id = ?')
      .get(result.lastInsertRowid) as Movie;
    res.status(201).json(newMovie);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('UNIQUE constraint failed')
    ) {
      res
        .status(409)
        .json({ error: 'Esta película ya está guardada en la biblioteca' });
      return;
    }
    const message =
      err instanceof Error ? err.message : 'Error guardando película';
    res.status(500).json({ error: message });
  }
});

moviesRouter.put('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params['id'], 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  const { magnet_link } = req.body as { magnet_link: string };
  if (!magnet_link) {
    res.status(400).json({ error: 'magnet_link es requerido' });
    return;
  }
  try {
    const result = db
      .prepare('UPDATE movies SET magnet_link = ? WHERE id = ? AND user_id = ?')
      .run(magnet_link, id, req.user!.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Película no encontrada' });
      return;
    }
    const updated = db
      .prepare('SELECT * FROM movies WHERE id = ?')
      .get(id) as Movie;
    res.json(updated);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error actualizando película';
    res.status(500).json({ error: message });
  }
});

moviesRouter.put('/:id/progress', (req: Request, res: Response) => {
  const id = parseInt(req.params['id'], 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  const { progress_seconds } = req.body as { progress_seconds: number };
  if (typeof progress_seconds !== 'number' || progress_seconds < 0) {
    res.status(400).json({ error: 'progress_seconds debe ser un número >= 0' });
    return;
  }
  try {
    const result = db
      .prepare('UPDATE movies SET progress_seconds = ? WHERE id = ? AND user_id = ?')
      .run(Math.floor(progress_seconds), id, req.user!.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Película no encontrada' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error guardando progreso';
    res.status(500).json({ error: message });
  }
});

moviesRouter.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params['id'], 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    const result = db
      .prepare('DELETE FROM movies WHERE id = ? AND user_id = ?')
      .run(id, req.user!.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Película no encontrada' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error eliminando película';
    res.status(500).json({ error: message });
  }
});
