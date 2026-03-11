import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import type { Movie } from '@vidflix/shared-types';
import { ApiService } from '../../core/api.service';
import {
  FiltrosBiblioteca,
  LibraryFiltersComponent,
} from './library-filters/library-filters.component';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';
const TMDB_IMG_SM = 'https://image.tmdb.org/t/p/w185';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, LibraryFiltersComponent],
  templateUrl: './library.component.html',
})
export class LibraryComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly filtersRef = viewChild(LibraryFiltersComponent);

  peliculas = signal<Movie[]>([]);
  loading = signal(true);
  error = signal('');
  peliculaAEliminar = signal<Movie | null>(null);
  eliminando = signal(false);
  vista = signal<'grid' | 'lista'>('grid');

  private filtros = signal<FiltrosBiblioteca>({
    tituloBusqueda: '',
    generosSeleccionados: new Set(),
    filtroEstado: 'todas',
    orden: 'recientes',
  });

  todosGeneros = computed(() => {
    const generos = new Set<string>();
    for (const p of this.peliculas()) {
      try {
        const lista: string[] = JSON.parse(p.genres);
        for (const g of lista) generos.add(g);
      } catch {
        // genres malformed — skip
      }
    }
    return [...generos].sort((a, b) => a.localeCompare(b));
  });

  peliculasFiltradas = computed(() => {
    const { tituloBusqueda, generosSeleccionados, filtroEstado, orden } = this.filtros();
    const titulo = tituloBusqueda.trim().toLowerCase();

    const filtradas = this.peliculas().filter((p) => {
      if (titulo && !p.title.toLowerCase().includes(titulo)) return false;
      if (filtroEstado === 'en-progreso') {
        const pct = this.progressPct(p);
        if (pct < 1 || pct >= 90) return false;
      }
      if (filtroEstado === 'ya-vistas' && this.progressPct(p) < 90) return false;
      if (filtroEstado === 'no-vistas' && (p.progress_seconds ?? 0) > 10) return false;
      if (generosSeleccionados.size > 0) {
        let lista: string[] = [];
        try {
          lista = JSON.parse(p.genres);
        } catch {
          /* skip */
        }
        for (const g of generosSeleccionados) {
          if (!lista.includes(g)) return false;
        }
      }
      return true;
    });

    return [...filtradas].sort((a, b) => {
      if (orden === 'valoracion') return (b.vote_average ?? 0) - (a.vote_average ?? 0);
      if (orden === 'titulo') return a.title.localeCompare(b.title);
      return (b.release_date ?? '').localeCompare(a.release_date ?? '');
    });
  });

  hayFiltros = computed(() => {
    const { tituloBusqueda, generosSeleccionados, filtroEstado } = this.filtros();
    return tituloBusqueda.trim().length > 0 || generosSeleccionados.size > 0 || filtroEstado !== 'todas';
  });

  readonly imgUrl = (path: string) => `${TMDB_IMG}${path}`;
  readonly imgUrlSm = (path: string) => `${TMDB_IMG_SM}${path}`;

  onFiltrosChange(filtros: FiltrosBiblioteca): void {
    this.filtros.set(filtros);
  }

  limpiarFiltros(): void {
    this.filtersRef()?.limpiarFiltros();
  }

  progressTime(pelicula: Movie): string {
    const seen = this.formatRuntime(Math.floor((pelicula.progress_seconds ?? 0) / 60));
    const total = pelicula.runtime ? this.formatRuntime(pelicula.runtime) : null;
    return total ? `${seen} / ${total}` : seen;
  }

  formatRuntime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}`.trim() : `${m}min`;
  }

  generosList(pelicula: Movie): string[] {
    try {
      return JSON.parse(pelicula.genres) as string[];
    } catch {
      return [];
    }
  }

  generosTexto(pelicula: Movie): string {
    try {
      return (JSON.parse(pelicula.genres) as string[]).slice(0, 2).join(', ');
    } catch {
      return '';
    }
  }

  estrellas(voteAverage: number): Array<'full' | 'half' | 'empty'> {
    return Array.from({ length: 10 }, (_, i) => {
      if (voteAverage >= i + 1) return 'full';
      if (voteAverage >= i + 0.5) return 'half';
      return 'empty';
    });
  }

  progressPct(pelicula: Movie): number {
    if (!pelicula.progress_seconds || pelicula.progress_seconds <= 10) return 0;
    if (!pelicula.runtime) return 0;
    return Math.min(
      Math.round((pelicula.progress_seconds / (pelicula.runtime * 60)) * 100),
      100
    );
  }

  ngOnInit() {
    this.cargarBiblioteca();
  }

  cargarBiblioteca() {
    this.loading.set(true);
    this.api.obtenerBiblioteca().subscribe({
      next: (movies) => {
        this.peliculas.set(movies);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error cargando la biblioteca');
        this.loading.set(false);
      },
    });
  }

  reproducir(id: number) {
    this.router.navigate(['/reproducir', id]);
  }

  confirmarEliminar(pelicula: Movie) {
    this.peliculaAEliminar.set(pelicula);
  }

  cancelarEliminar() {
    this.peliculaAEliminar.set(null);
  }

  eliminar() {
    const p = this.peliculaAEliminar();
    if (!p) return;
    this.eliminando.set(true);
    this.api.eliminarPelicula(p.id).subscribe({
      next: () => {
        this.peliculas.update((list) => list.filter((m) => m.id !== p.id));
        this.peliculaAEliminar.set(null);
        this.eliminando.set(false);
      },
      error: () => {
        this.eliminando.set(false);
      },
    });
  }

  irABuscar() {
    this.router.navigate(['/buscar']);
  }
}
