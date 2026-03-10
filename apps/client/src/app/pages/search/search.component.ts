import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  of,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import type { TmdbSearchResult } from '@vidflix/shared-types';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8 text-white">Buscar Películas</h1>

      <div class="relative mb-8">
        <input
          [formControl]="searchControl"
          type="text"
          placeholder="Busca una película..."
          class="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-5 py-4 pr-12 text-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
        />
        <span
          class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
          >🔍</span
        >
      </div>

      @if (loading()) {
      <div class="flex justify-center py-16">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"
        ></div>
      </div>
      } @if (error()) {
      <div
        class="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-4 mb-6"
      >
        {{ error() }}
      </div>
      } @if (results().length > 0) {
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
      >
        @for (movie of results(); track movie.id) {
        <div
          class="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-red-900/20 transition-all duration-200 group"
          role="button"
          tabindex="0"
          (click)="verDetalle(movie.id)"
          (keydown.enter)="verDetalle(movie.id)"
          (keydown.space)="verDetalle(movie.id)"
        >
          @if (movie.poster_path) {
          <img
            [src]="imgUrl(movie.poster_path)"
            [alt]="movie.title"
            class="w-full aspect-[2/3] object-cover"
            loading="lazy"
          />
          } @else {
          <div
            class="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center"
          >
            <span class="text-4xl">🎬</span>
          </div>
          }
          <div class="p-3">
            <h3
              class="font-semibold text-white text-sm line-clamp-2 group-hover:text-red-400 transition-colors"
            >
              {{ movie.title }}
            </h3>
            <p class="text-gray-400 text-xs mt-1">
              {{ movie.release_date | slice : 0 : 4 }}
            </p>
            <div class="flex items-center gap-1 mt-1">
              <span class="text-yellow-400 text-xs">⭐</span>
              <span class="text-gray-300 text-xs">{{
                movie.vote_average | number : '1.1-1'
              }}</span>
            </div>
          </div>
        </div>
        }
      </div>
      } @if (!loading() && results().length === 0 && searchControl.value &&
      searchControl.value.length >= 2) {
      <div class="text-center py-16 text-gray-400">
        <p class="text-xl mb-2">Sin resultados</p>
        <p class="text-sm">
          No se encontraron películas para "{{ searchControl.value }}"
        </p>
      </div>
      } @if (!searchControl.value) {
      <div class="text-center py-16 text-gray-500">
        <p class="text-6xl mb-4">🎬</p>
        <p class="text-xl">Busca tu película favorita</p>
      </div>
      }
    </div>
  `,
})
export class SearchComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');
  results = signal<TmdbSearchResult[]>([]);
  loading = signal(false);
  error = signal('');

  readonly imgUrl = (path: string) => `${TMDB_IMG}${path}`;

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.trim().length < 2) {
            this.results.set([]);
            this.loading.set(false);
            return of([]);
          }
          this.loading.set(true);
          this.error.set('');
          return this.api.buscar(query).pipe(
            catchError((err) => {
              this.error.set(err.error?.error || 'Error al buscar películas');
              return of([]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results) => {
        this.results.set(results);
        this.loading.set(false);
      });
  }

  verDetalle(tmdbId: number) {
    this.router.navigate(['/pelicula', tmdbId]);
  }
}
