import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Movie } from '@vidflix/shared-types';
import { ApiService } from '../../core/api.service';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';
const TMDB_IMG_SM = 'https://image.tmdb.org/t/p/w185';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-white">Mi Biblioteca</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-400 text-sm">
            @if (hayFiltros()) {
            {{ peliculasFiltradas().length }} de
            {{ peliculas().length }} películas } @else {
            {{ peliculas().length }} películas }
          </span>
          <!-- Toggle grid/lista -->
          <div class="flex rounded-lg overflow-hidden border border-gray-700">
            <button
              type="button"
              (click)="vista.set('grid')"
              title="Vista en cuadrícula"
              class="p-2 transition-colors"
              [class]="vista() === 'grid' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z"/>
              </svg>
            </button>
            <button
              type="button"
              (click)="vista.set('lista')"
              title="Vista en lista"
              class="p-2 transition-colors"
              [class]="vista() === 'lista' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-4 h-4">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      @if (loading()) {
      <div class="flex justify-center py-16">
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"
        ></div>
      </div>
      } @else if (error()) {
      <div
        class="bg-orange-900/30 border border-orange-700 text-orange-300 rounded-lg p-4"
      >
        {{ error() }}
      </div>
      } @else if (peliculas().length === 0) {
      <div class="text-center py-20 text-gray-500">
        <p class="text-6xl mb-4">📚</p>
        <p class="text-xl font-medium mb-2">La biblioteca está vacía</p>
        <p class="text-sm mb-6">
          Busca películas y agrégalas desde su página de detalle
        </p>
        <button
          (click)="irABuscar()"
          class="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Buscar películas
        </button>
      </div>
      } @else {

      <!-- Filtros -->
      <div class="mb-6 space-y-4">
        <!-- Búsqueda + orden -->
        <div class="flex flex-col md:flex-row gap-3">
          <input
            type="search"
            [value]="tituloBusqueda()"
            (input)="tituloBusqueda.set($any($event.target).value)"
            placeholder="Buscar por título..."
            class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                   placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
          />
          <div
            class="flex rounded-xl overflow-hidden border border-gray-700 text-sm flex-shrink-0 self-start"
          >
            @for (op of estadoOpciones; track op.value) {
            <button
              type="button"
              (click)="filtroEstado.set(op.value)"
              class="px-3 py-3 transition-colors whitespace-nowrap"
              [class]="
                filtroEstado() === op.value
                  ? 'bg-orange-600 text-white font-medium'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              "
            >
              {{ op.label }}
            </button>
            }
          </div>
          <div
            class="flex rounded-xl overflow-hidden border border-gray-700 text-sm flex-shrink-0 self-start"
          >
            @for (op of ordenOpciones; track op.value) {
            <button
              type="button"
              (click)="orden.set(op.value)"
              class="px-3 py-3 transition-colors whitespace-nowrap"
              [class]="
                orden() === op.value
                  ? 'bg-orange-600 text-white font-medium'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              "
            >
              {{ op.label }}
            </button>
            }
          </div>
        </div>

        <!-- Chips de género -->
        <div class="flex flex-wrap gap-2">
          @for (genero of todosGeneros(); track genero) {
          <button
            (click)="toggleGenero(genero)"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            [class]="
              generosSeleccionados().has(genero)
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            "
          >
            {{ genero }}
          </button>
          } @if (hayFiltros()) {
          <button
            (click)="limpiarFiltros()"
            class="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
          >
            ✕ Limpiar
          </button>
          }
        </div>
      </div>

      <!-- Resultados -->
      @if (peliculasFiltradas().length === 0) {
      <div class="text-center py-20 text-gray-500">
        <p class="text-5xl mb-4">🔍</p>
        <p class="text-lg font-medium mb-2">Sin resultados</p>
        <p class="text-sm mb-4">
          Ninguna película coincide con los filtros aplicados
        </p>
        <button
          (click)="limpiarFiltros()"
          class="bg-gray-700 hover:bg-gray-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Limpiar filtros
        </button>
      </div>
      } @else if (vista() === 'grid') {

      <!-- Vista grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        @for (pelicula of peliculasFiltradas(); track pelicula.id) {
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
            <div class="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center">
              <span class="text-4xl">🎬</span>
            </div>
            }

            @if (pelicula.vote_average) {
            <div class="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <svg viewBox="0 0 24 24" fill="#facc15" class="w-3 h-3 flex-shrink-0">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
              </svg>
              <span class="text-white text-xs font-medium leading-none">{{ pelicula.vote_average | number:'1.1-1' }}</span>
            </div>
            }

            @if (progressPct(pelicula) > 0) {
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div class="h-full bg-orange-500" [style.width.%]="progressPct(pelicula)"></div>
            </div>
            }

            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div class="bg-black/50 rounded-full w-14 h-14 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" class="w-7 h-7 ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="p-3 flex items-center gap-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-white text-sm truncate leading-snug" [title]="pelicula.title">
                {{ pelicula.title }}
              </h3>
              <p class="text-gray-500 text-xs mt-0.5">{{ pelicula.release_date | slice:0:4 }}</p>
            </div>
            <button (click)="confirmarEliminar(pelicula)" class="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
        }
      </div>

      } @else {

      <!-- Vista lista -->
      <div class="flex flex-col gap-3">
        @for (pelicula of peliculasFiltradas(); track pelicula.id) {
        <div class="bg-gray-800 rounded-xl overflow-hidden flex group">
          <!-- Poster -->
          <div
            class="relative flex-shrink-0 w-28 cursor-pointer"
            role="button"
            tabindex="0"
            (click)="reproducir(pelicula.id)"
            (keydown.enter)="reproducir(pelicula.id)"
            (keydown.space)="reproducir(pelicula.id)"
          >
            @if (pelicula.poster_path) {
            <img
              [src]="imgUrlSm(pelicula.poster_path)"
              [alt]="pelicula.title"
              class="w-full h-full object-cover group-hover:opacity-70 transition-opacity"
              loading="lazy"
            />
            } @else {
            <div class="w-full h-full bg-gray-700 flex items-center justify-center min-h-[120px]">
              <span class="text-2xl">🎬</span>
            </div>
            }
            <!-- Play overlay -->
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div class="bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" class="w-4 h-4 ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <!-- Barra de progreso -->
            @if (progressPct(pelicula) > 0) {
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div class="h-full bg-orange-500" [style.width.%]="progressPct(pelicula)"></div>
            </div>
            }
          </div>

          <!-- Contenido -->
          <div class="flex-1 min-w-0 p-4 flex flex-col gap-1.5">
            <!-- Fila título + acciones -->
            <div class="flex items-start justify-between gap-3">
              <h3
                class="font-semibold text-white text-base leading-snug cursor-pointer hover:text-orange-400 transition-colors"
                (click)="reproducir(pelicula.id)"
              >
                {{ pelicula.title }}
              </h3>
              <button (click)="confirmarEliminar(pelicula)" class="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors mt-0.5" title="Eliminar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>

            <!-- Metadatos -->
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
              @if (pelicula.release_date) {
              <span>{{ pelicula.release_date | date:'d MMM yyyy' }}</span>
              }
              @if (pelicula.vote_average) {
              <span class="flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="#facc15" class="w-3.5 h-3.5 flex-shrink-0">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
                </svg>
                {{ pelicula.vote_average | number:'1.1-1' }}
              </span>
              }
              @if (pelicula.runtime) {
              <span>{{ formatRuntime(pelicula.runtime) }}</span>
              }
              @if (pelicula.magnet_link) {
              <span class="flex items-center gap-1 text-green-400 text-xs font-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
                  <path d="M18 2a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
                  <path d="M6 2a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
                  <path d="M6 13v2a6 6 0 0 0 12 0v-2"/>
                </svg>
                Torrent
              </span>
              }
            </div>

            <!-- Géneros -->
            @if (generosTexto(pelicula)) {
            <div class="flex flex-wrap gap-1.5">
              @for (g of generosList(pelicula); track g) {
              <span class="text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-0.5">{{ g }}</span>
              }
            </div>
            }

            <!-- Sinopsis -->
            @if (pelicula.overview) {
            <p class="text-gray-400 text-sm leading-relaxed line-clamp-3 mt-0.5">
              {{ pelicula.overview }}
            </p>
            }

            <!-- Footer: añadida + progreso -->
            <div class="flex items-end justify-between gap-4 mt-auto pt-1">
              @if (pelicula.created_at) {
              <span class="text-xs text-gray-600">
                Añadida el {{ pelicula.created_at | date:'d MMM yyyy' }}
              </span>
              }
              @if (progressPct(pelicula) > 0) {
              <div class="flex flex-col items-end gap-1 flex-shrink-0">
                @if (progressPct(pelicula) >= 90) {
                <span class="text-xs text-green-400 font-medium">Vista</span>
                } @else {
                <span class="text-xs text-orange-400">
                  {{ progressTime(pelicula) }}
                </span>
                <div class="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-orange-500 rounded-full" [style.width.%]="progressPct(pelicula)"></div>
                </div>
                }
              </div>
              }
            </div>
          </div>
        </div>
        }
      </div>

      } }
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
            class="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 text-white font-semibold py-2.5 rounded-xl transition-colors"
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

  vista = signal<'grid' | 'lista'>('grid');
  tituloBusqueda = signal('');
  generosSeleccionados = signal<Set<string>>(new Set());
  filtroEstado = signal<'todas' | 'en-progreso' | 'ya-vistas' | 'no-vistas'>('todas');
  orden = signal<'recientes' | 'valoracion' | 'titulo'>('recientes');
  readonly estadoOpciones = [
    { value: 'todas' as const, label: 'Todas' },
    { value: 'en-progreso' as const, label: 'En progreso' },
    { value: 'ya-vistas' as const, label: 'Ya vistas' },
    { value: 'no-vistas' as const, label: 'No vistas' },
  ];
  readonly ordenOpciones = [
    { value: 'recientes' as const, label: 'Recientes' },
    { value: 'valoracion' as const, label: 'Valoración' },
    { value: 'titulo' as const, label: 'Alfabético' },
  ];

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
    const titulo = this.tituloBusqueda().trim().toLowerCase();
    const generos = this.generosSeleccionados();
    const estado = this.filtroEstado();
    const ord = this.orden();

    const filtradas = this.peliculas().filter((p) => {
      if (titulo && !p.title.toLowerCase().includes(titulo)) return false;
      if (estado === 'en-progreso') {
        const pct = this.progressPct(p);
        if (pct < 1 || pct >= 90) return false;
      }
      if (estado === 'ya-vistas' && this.progressPct(p) < 90) return false;
      if (estado === 'no-vistas' && (p.progress_seconds ?? 0) > 10) return false;
      if (generos.size > 0) {
        let lista: string[] = [];
        try {
          lista = JSON.parse(p.genres);
        } catch {
          /* skip */
        }
        for (const g of generos) {
          if (!lista.includes(g)) return false;
        }
      }
      return true;
    });

    return [...filtradas].sort((a, b) => {
      if (ord === 'valoracion')
        return (b.vote_average ?? 0) - (a.vote_average ?? 0);
      if (ord === 'titulo') return a.title.localeCompare(b.title);
      return (b.release_date ?? '').localeCompare(a.release_date ?? '');
    });
  });

  hayFiltros = computed(
    () =>
      this.tituloBusqueda().trim().length > 0 ||
      this.generosSeleccionados().size > 0 ||
      this.filtroEstado() !== 'todas'
  );

  readonly imgUrl = (path: string) => `${TMDB_IMG}${path}`;
  readonly imgUrlSm = (path: string) => `${TMDB_IMG_SM}${path}`;

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

  toggleGenero(genero: string) {
    this.generosSeleccionados.update((set) => {
      const next = new Set(set);
      if (next.has(genero)) {
        next.delete(genero);
      } else {
        next.add(genero);
      }
      return next;
    });
  }

  limpiarFiltros() {
    this.tituloBusqueda.set('');
    this.generosSeleccionados.set(new Set());
    this.filtroEstado.set('todas');
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
