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
  templateUrl: './search.component.html',
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
