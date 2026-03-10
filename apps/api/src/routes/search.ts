import { Router, Request, Response } from 'express';
import { searchMovies, getMovieDetails } from '../tmdb';

// GET /api/search?query=...
export const searchRouter = Router();
searchRouter.get('/', async (req: Request, res: Response) => {
  const query = req.query['query'] as string;
  if (!query || query.trim().length === 0) {
    res.status(400).json({ error: 'El parámetro query es requerido' });
    return;
  }
  try {
    const results = await searchMovies(query.trim());
    res.json(results);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error buscando películas';
    res.status(500).json({ error: message });
  }
});

// GET /api/tmdb/:tmdbId
export const tmdbRouter = Router();
tmdbRouter.get('/:tmdbId', async (req: Request, res: Response) => {
  const tmdbId = parseInt(req.params['tmdbId'], 10);
  if (isNaN(tmdbId)) {
    res.status(400).json({ error: 'ID de TMDB inválido' });
    return;
  }
  try {
    const movie = await getMovieDetails(tmdbId);
    res.json(movie);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error obteniendo detalles';
    res.status(500).json({ error: message });
  }
});
