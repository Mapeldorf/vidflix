import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { searchRouter, tmdbRouter } from './routes/search';
import { moviesRouter } from './routes/movies';
import { streamRouter } from './routes/stream';
import { authRouter } from './routes/auth';
import { requireAuth } from './middleware/auth.middleware';

// Initialize DB (side effect: creates tables if not exist)
import './db/init';

if (!process.env['JWT_SECRET']) {
  console.error('ERROR: JWT_SECRET no está definido en las variables de entorno. Añádelo al fichero .env');
  process.exit(1);
}

const app = express();

// Trust reverse proxy (Fly.io, nginx) for correct IP in rate limiter
app.set('trust proxy', 1);

// Security headers (CSP disabled — Angular SPA served from same origin)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS: same-origin in production; allow dev Angular port in development
const devOrigin = 'http://localhost:4200';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin (no Origin header) or configured dev origin
      if (!origin || origin === devOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// ── Public routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Protected routes (JWT required) ───────────────────────────────────────
app.use('/api/search', requireAuth, searchRouter);
app.use('/api/tmdb', requireAuth, tmdbRouter);
app.use('/api/movies', requireAuth, moviesRouter);
app.use('/api/stream', requireAuth, streamRouter);

// ── Serve Angular frontend ─────────────────────────────────────────────────
const clientDist = path.join(process.cwd(), 'dist/apps/client/browser');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    const isDev = process.env['NODE_ENV'] !== 'production';
    res.status(500).json({
      error: isDev ? err.message : 'Error interno del servidor',
    });
  }
);

const port = process.env['PORT'] || 3000;
const server = app.listen(port, () => {
  console.log(`🎬 VidFlix API escuchando en http://localhost:${port}`);
});
server.on('error', console.error);
