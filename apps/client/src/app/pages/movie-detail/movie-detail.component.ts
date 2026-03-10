import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { SaveMovieDto, TmdbMovie } from '@vidflix/shared-types';
import { ApiService } from '../../core/api.service';

const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMG_ORIG = 'https://image.tmdb.org/t/p/original';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (loading()) {
    <div class="flex justify-center items-center min-h-screen">
      <div
        class="animate-spin rounded-full h-14 w-14 border-4 border-red-500 border-t-transparent"
      ></div>
    </div>
    } @if (error()) {
    <div class="max-w-2xl mx-auto p-8">
      <div
        class="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-4"
      >
        {{ error() }}
      </div>
    </div>
    } @if (movie(); as m) {
    <!-- Backdrop -->
    <div class="relative h-72 md:h-96 overflow-hidden">
      @if (m.backdrop_path) {
      <img
        [src]="TMDB_IMG_ORIG + m.backdrop_path"
        [alt]="m.title"
        class="w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"
      ></div>
      } @else {
      <div class="w-full h-full bg-gray-800"></div>
      }
    </div>

    <div class="max-w-7xl mx-auto px-4 -mt-32 relative pb-12">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Poster -->
        <div class="flex-shrink-0">
          @if (m.poster_path) {
          <img
            [src]="TMDB_IMG_W500 + m.poster_path"
            [alt]="m.title"
            class="w-48 md:w-64 rounded-xl shadow-2xl shadow-black/60 border border-gray-700"
          />
          } @else {
          <div
            class="w-48 md:w-64 aspect-[2/3] bg-gray-700 rounded-xl flex items-center justify-center"
          >
            <span class="text-5xl">🎬</span>
          </div>
          }
        </div>

        <!-- Info -->
        <div class="flex-1 pt-4 md:pt-32">
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
            {{ m.title }}
          </h1>

          <div class="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            <span>📅 {{ m.release_date | slice : 0 : 4 }}</span>
            @if (m.runtime) {
            <span>⏱ {{ m.runtime }} min</span>
            }
            <span class="flex items-center gap-1"
              >⭐ {{ m.vote_average | number : '1.1-1' }}/10</span
            >
          </div>

          @if (m.genres?.length) {
          <div class="flex flex-wrap gap-2 mb-4">
            @for (g of m.genres; track g.id) {
            <span
              class="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full"
            >
              {{ g.name }}
            </span>
            }
          </div>
          } @if (m.overview) {
          <p class="text-gray-300 leading-relaxed mb-6 max-w-2xl">
            {{ m.overview }}
          </p>
          }

          <div class="flex gap-3">
            <button
              (click)="abrirModal()"
              class="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              <span>➕</span> Guardar en biblioteca
            </button>
            <button
              (click)="volver()"
              class="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Volver
            </button>
          </div>

          @if (guardado()) {
          <p class="mt-4 text-green-400 font-medium">
            ✅ Película guardada en la biblioteca
          </p>
          }
        </div>
      </div>
    </div>
    }

    <!-- Modal guardar -->
    @if (modalAbierto()) {
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      role="button"
      tabindex="0"
      (click)="cerrarModal()"
      (keydown.escape)="cerrarModal()"
    >
      <div
        class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Guardar en biblioteca"
        tabindex="-1"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
      >
        <h2 class="text-xl font-bold text-white mb-5">Guardar en biblioteca</h2>

        <form [formGroup]="form" (ngSubmit)="guardar()">
          <div class="space-y-4">
            <div>
              <span class="block text-gray-400 text-sm mb-1">Título</span>
              <input
                type="text"
                [value]="movie()?.title"
                readonly
                class="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded-lg px-4 py-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <span class="block text-gray-400 text-sm mb-1">Géneros</span>
              <input
                type="text"
                [value]="generosTexto()"
                readonly
                class="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded-lg px-4 py-2.5 cursor-not-allowed"
              />
            </div>

            <!-- Toggle magnet / archivo -->
            <div
              class="flex rounded-lg overflow-hidden border border-gray-700 text-sm"
            >
              <button
                type="button"
                (click)="setModo('magnet')"
                [class]="
                  modo() === 'magnet'
                    ? 'flex-1 py-2 bg-red-600 text-white font-medium'
                    : 'flex-1 py-2 bg-gray-800 text-gray-400 hover:text-white transition-colors'
                "
              >
                🔗 Magnet link
              </button>
              <button
                type="button"
                (click)="setModo('archivo')"
                [class]="
                  modo() === 'archivo'
                    ? 'flex-1 py-2 bg-red-600 text-white font-medium'
                    : 'flex-1 py-2 bg-gray-800 text-gray-400 hover:text-white transition-colors'
                "
              >
                📁 Archivo .torrent
              </button>
            </div>

            @if (modo() === 'magnet') {
            <div>
              <span class="block text-gray-400 text-sm mb-1">
                Magnet Link <span class="text-red-500">*</span>
              </span>
              <textarea
                formControlName="magnetLink"
                rows="3"
                placeholder="magnet:?xt=urn:btih:..."
                class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 resize-none placeholder-gray-600"
                [class.border-red-500]="
                  form.get('magnetLink')?.invalid &&
                  form.get('magnetLink')?.touched
                "
              ></textarea>
              @if (form.get('magnetLink')?.invalid &&
              form.get('magnetLink')?.touched) {
              <p class="text-red-400 text-xs mt-1">
                El magnet link es requerido
              </p>
              }
            </div>
            } @if (modo() === 'archivo') {
            <div>
              <span class="block text-gray-400 text-sm mb-1">
                Archivo .torrent <span class="text-red-500">*</span>
              </span>
              <label
                class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                [class]="
                  archivoNombre()
                    ? 'border-green-600 bg-green-900/20'
                    : 'border-gray-600 bg-gray-800 hover:border-red-500'
                "
              >
                @if (archivoNombre()) {
                <span class="text-green-400 text-sm font-medium"
                  >✅ {{ archivoNombre() }}</span
                >
                } @else {
                <span class="text-gray-400 text-sm"
                  >Haz clic para seleccionar un archivo .torrent</span
                >
                }
                <input
                  type="file"
                  accept=".torrent"
                  class="hidden"
                  (change)="onArchivoSeleccionado($event)"
                />
              </label>
              @if (modoArchivoError()) {
              <p class="text-red-400 text-xs mt-1">{{ modoArchivoError() }}</p>
              }
            </div>
            }
          </div>

          @if (saveError()) {
          <div
            class="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 mt-4 text-sm"
          >
            {{ saveError() }}
          </div>
          }

          <div class="flex gap-3 mt-6">
            <button
              type="submit"
              [disabled]="saving()"
              class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
            <button
              type="button"
              (click)="cerrarModal()"
              class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export class MovieDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly TMDB_IMG_W500 = TMDB_IMG_W500;
  protected readonly TMDB_IMG_ORIG = TMDB_IMG_ORIG;

  movie = signal<TmdbMovie | null>(null);
  loading = signal(true);
  error = signal('');
  modalAbierto = signal(false);
  saving = signal(false);
  saveError = signal('');
  guardado = signal(false);

  form = new FormGroup({
    magnetLink: new FormControl('', [
      Validators.required,
      Validators.minLength(10),
    ]),
  });

  modo = signal<'magnet' | 'archivo'>('magnet');
  archivoNombre = signal('');
  archivoBase64 = signal('');
  modoArchivoError = signal('');

  setModo(m: 'magnet' | 'archivo') {
    this.modo.set(m);
    this.archivoNombre.set('');
    this.archivoBase64.set('');
    this.modoArchivoError.set('');
    if (m === 'magnet') {
      this.form
        .get('magnetLink')!
        .setValidators([Validators.required, Validators.minLength(10)]);
    } else {
      this.form.get('magnetLink')!.clearValidators();
    }
    this.form.get('magnetLink')!.updateValueAndValidity();
  }

  onArchivoSeleccionado(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.archivoBase64.set(base64);
      this.archivoNombre.set(file.name);
      this.modoArchivoError.set('');
    };
    reader.readAsDataURL(file);
  }

  generosTexto() {
    return (
      this.movie()
        ?.genres?.map((g) => g.name)
        .join(', ') || ''
    );
  }

  ngOnInit() {
    const tmdbId = Number(this.route.snapshot.paramMap.get('tmdbId'));
    this.api.detalleTmdb(tmdbId).subscribe({
      next: (m) => {
        this.movie.set(m);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error cargando la película');
        this.loading.set(false);
      },
    });
  }

  abrirModal() {
    this.form.reset();
    this.saveError.set('');
    this.modo.set('magnet');
    this.archivoNombre.set('');
    this.archivoBase64.set('');
    this.modoArchivoError.set('');
    this.form
      .get('magnetLink')!
      .setValidators([Validators.required, Validators.minLength(10)]);
    this.form.get('magnetLink')!.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  guardar() {
    if (this.modo() === 'archivo' && !this.archivoBase64()) {
      this.modoArchivoError.set('Selecciona un archivo .torrent');
      return;
    }
    if (this.modo() === 'magnet' && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const m = this.movie();
    if (!m) return;

    const magnetLink =
      this.modo() === 'archivo'
        ? `torrent:base64,${this.archivoBase64()}`
        : this.form.value.magnetLink!;

    const dto: SaveMovieDto = {
      tmdb_id: m.id,
      title: m.title,
      overview: m.overview,
      poster_path: m.poster_path ?? '',
      backdrop_path: m.backdrop_path ?? '',
      release_date: m.release_date,
      vote_average: m.vote_average,
      runtime: m.runtime ?? 0,
      genres: JSON.stringify(m.genres?.map((g) => g.name) ?? []),
      magnet_link: magnetLink,
    };

    this.saving.set(true);
    this.api.guardarPelicula(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.cerrarModal();
        this.guardado.set(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err.error?.error || 'Error guardando la película');
      },
    });
  }

  volver() {
    this.router.navigate(['/buscar']);
  }
}
