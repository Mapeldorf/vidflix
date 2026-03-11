import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Movie,
  SaveMovieDto,
  TmdbMovie,
  TmdbSearchResult,
} from '@vidflix/shared-types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  buscar(query: string): Observable<TmdbSearchResult[]> {
    return this.http.get<TmdbSearchResult[]>('/api/search', {
      params: { query },
    });
  }

  detalleTmdb(tmdbId: number): Observable<TmdbMovie> {
    return this.http.get<TmdbMovie>(`/api/tmdb/${tmdbId}`);
  }

  obtenerBiblioteca(): Observable<Movie[]> {
    return this.http.get<Movie[]>('/api/movies');
  }

  obtenerPelicula(id: number): Observable<Movie> {
    return this.http.get<Movie>(`/api/movies/${id}`);
  }

  guardarPelicula(dto: SaveMovieDto): Observable<Movie> {
    return this.http.post<Movie>('/api/movies', dto);
  }

  actualizarMagnet(id: number, magnetLink: string): Observable<Movie> {
    return this.http.put<Movie>(`/api/movies/${id}`, {
      magnet_link: magnetLink,
    });
  }

  eliminarPelicula(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/api/movies/${id}`);
  }

  guardarProgreso(id: number, progressSeconds: number): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`/api/movies/${id}/progress`, {
      progress_seconds: progressSeconds,
    });
  }
}
