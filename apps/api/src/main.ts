import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { searchRouter, tmdbRouter } from './routes/search';
import { moviesRouter } from './routes/movies';
import { streamRouter } from './routes/stream';

// Initialize DB (side effect: creates table if not exists)
import './db/init';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/search', searchRouter);
app.use('/api/tmdb', tmdbRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/stream', streamRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
);

const port = process.env['PORT'] || 3000;
const server = app.listen(port, () => {
  console.log(`🎬 VidFlix API escuchando en http://localhost:${port}`);
});
server.on('error', console.error);
