import axios from 'axios';
import type { TmdbMovie, TmdbSearchResult } from '@vidflix/shared-types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const TMDB_IMAGE_URL = TMDB_IMAGE_BASE;

function getClient() {
  const apiKey = process.env['TMDB_API_KEY'];
  if (!apiKey) {
    throw new Error('TMDB_API_KEY environment variable is required');
  }
  // JWT tokens (Read Access Token) require Bearer auth; short keys use api_key param
  const isBearer = apiKey.startsWith('eyJ');
  return axios.create({
    baseURL: TMDB_BASE_URL,
    params: isBearer
      ? { language: 'es-ES' }
      : { api_key: apiKey, language: 'es-ES' },
    headers: isBearer ? { Authorization: `Bearer ${apiKey}` } : {},
  });
}

export async function searchMovies(query: string): Promise<TmdbSearchResult[]> {
  const client = getClient();
  const response = await client.get<{ results: TmdbSearchResult[] }>(
    '/search/movie',
    {
      params: { query, include_adult: false },
    }
  );
  return response.data.results;
}

export async function getMovieDetails(tmdbId: number): Promise<TmdbMovie> {
  const client = getClient();
  const response = await client.get<TmdbMovie>(`/movie/${tmdbId}`);
  return response.data;
}
