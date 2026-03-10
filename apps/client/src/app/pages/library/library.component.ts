import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import type { Movie } from '@vidflix/shared-types';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-white">Mi Biblioteca</h1>
        <span class="text-gray-400 text-sm"
          >{{ peliculas().length }} películas</span
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
        class="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-4"
      >
        {{ error() }}
      </div>
      } @if (!loading() && peliculas().length === 0) {
      <div class="text-center py-20 text-gray-500">
        <p class="text-6xl mb-4">📚</p>
        <p class="text-xl font-medium mb-2">La biblioteca está vacía</p>
        <p class="text-sm mb-6">
          Busca películas y agrégalas desde su página de detalle
        </p>
        <button
          (click)="irABuscar()"
          class="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Buscar películas
        </button>
      </div>
      } @if (peliculas().length > 0) {
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
      >
        @for (pelicula of peliculas(); track pelicula.id) {
        <div class="bg-gray-800 rounded-xl overflow-hidden group relative">
          <div
            class="cursor-pointer"
            role="button"
            tabindex="0"
            (click)="reproducir(pelicula.id)"
            (keydown.enter)="reproducir(pelicula.id)"
            (keydown.space)="reproducir(pelicula.id)"
          >
            @if (pelicula.poster_path) {
            <img
              [src]="imgUrl(pelicula.poster_path)"
              [alt]="pelicula.title"
              class="w-full aspect-[2/3] object-cover group-hover:opacity-70 transition-opacity"
              loading="lazy"
            />
            } @else {
            <div
              class="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center"
            >
              <span class="text-4xl">🎬</span>
            </div>
            }

            <!-- Play overlay -->
            <div
              class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            >
              <div
                class="bg-red-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
              >
                <span class="text-white text-2xl ml-1">▶</span>
              </div>
            </div>
          </div>

          <div class="p-3">
            <h3 class="font-semibold text-white text-sm line-clamp-2 mb-1">
              {{ pelicula.title }}
            </h3>
            <p class="text-gray-400 text-xs">
              {{ pelicula.release_date | slice : 0 : 4 }}
            </p>

            <div class="flex gap-2 mt-2">
              <button
                (click)="reproducir(pelicula.id)"
                class="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
              >
                ▶ Reproducir
              </button>
              <button
                (click)="confirmarEliminar(pelicula)"
                class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2 py-1.5 rounded-lg transition-colors"
                title="Eliminar"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
        }
      </div>
      }
    </div>

    <!-- Modal confirmar eliminar -->
    @if (peliculaAEliminar()) {
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      role="button"
      tabindex="0"
      (click)="cancelarEliminar()"
      (keydown.escape)="cancelarEliminar()"
    >
      <div
        class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Eliminar película"
        tabindex="-1"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
      >
        <h3 class="text-lg font-bold text-white mb-2">¿Eliminar película?</h3>
        <p class="text-gray-400 text-sm mb-6">
          "{{ peliculaAEliminar()!.title }}" será eliminada de tu biblioteca.
        </p>
        <div class="flex gap-3">
          <button
            (click)="eliminar()"
            [disabled]="eliminando()"
            class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {{ eliminando() ? 'Eliminando...' : 'Eliminar' }}
          </button>
          <button
            (click)="cancelarEliminar()"
            class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class LibraryComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  peliculas = signal<Movie[]>([]);
  loading = signal(true);
  error = signal('');
  peliculaAEliminar = signal<Movie | null>(null);
  eliminando = signal(false);

  readonly imgUrl = (path: string) => `${TMDB_IMG}${path}`;

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
