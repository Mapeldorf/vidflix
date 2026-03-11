import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Movie } from '@vidflix/shared-types';
import { ApiService } from '../../core/api.service';

const PROGRESS_MIN_SECONDS = 10;

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-6">
      <button
        (click)="volver()"
        class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
      >
        <span class="group-hover:-translate-x-1 transition-transform">←</span>
        Volver a la biblioteca
      </button>

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
      } @if (pelicula(); as m) {
      <div class="mb-4">
        <h1 class="text-2xl font-bold text-white">{{ m.title }}</h1>
        <div class="flex gap-4 text-gray-400 text-sm mt-1">
          <span>{{ m.release_date | slice : 0 : 4 }}</span>
          @if (m.runtime) { <span>⏱ {{ m.runtime }} min</span> }
          <span>⭐ {{ m.vote_average | number : '1.1-1' }}</span>
        </div>
        @if (m.genres) {
        <div class="flex flex-wrap gap-2 mt-2">
          @for (g of parseGenres(m.genres); track g) {
          <span
            class="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full"
            >{{ g }}</span
          >
          }
        </div>
        }
      </div>

      <!-- Video player -->
      <div class="bg-black rounded-xl overflow-hidden shadow-2xl">
        <video
          #videoEl
          controls
          class="w-full aspect-video"
          [src]="streamUrl()"
          [class.hidden]="!videoListo()"
          (loadedmetadata)="onMetadata()"
          (ended)="onEnded()"
          (error)="onVideoError()"
        ></video>

        @if (!videoListo()) {
        <div
          class="aspect-video flex flex-col items-center justify-center bg-gray-900"
        >
          <div
            class="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"
          ></div>
          <p class="text-gray-300 font-medium">Conectando con el torrent...</p>
          <p class="text-gray-500 text-sm mt-1">
            Esto puede tardar unos segundos
          </p>
        </div>
        }
      </div>

      @if (m.overview) {
      <p class="text-gray-400 mt-6 leading-relaxed">{{ m.overview }}</p>
      } }
    </div>

    <!-- Modal de reanudación -->
    @if (mostrarModal()) {
    <div
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <h2 class="text-white font-bold text-lg mb-2">Continuar viendo</h2>
        <p class="text-gray-400 text-sm mb-6">
          Dejaste esta película en
          <span class="text-white font-medium">{{
            formatTime(progresoGuardado())
          }}</span
          >. ¿Desde dónde quieres reproducirla?
        </p>
        <div class="flex flex-col gap-3">
          <button
            (click)="reanudar()"
            class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Continuar desde {{ formatTime(progresoGuardado()) }}
          </button>
          <button
            (click)="empezarDesdeElPrincipio()"
            class="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors"
          >
            Empezar desde el principio
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class PlayerComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  pelicula = signal<Movie | null>(null);
  loading = signal(true);
  error = signal('');
  videoListo = signal(false);
  streamUrl = signal('');
  mostrarModal = signal(false);
  progresoGuardado = signal(0);

  private movieId = 0;
  private progressSaved = false;

  parseGenres(genresJson: string): string[] {
    try {
      return JSON.parse(genresJson);
    } catch {
      return [];
    }
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  ngOnInit() {
    this.movieId = Number(this.route.snapshot.paramMap.get('id'));
    this.streamUrl.set(`/api/stream/${this.movieId}`);

    this.api.obtenerPelicula(this.movieId).subscribe({
      next: (m) => {
        this.pelicula.set(m);
        this.loading.set(false);
        if ((m.progress_seconds ?? 0) > PROGRESS_MIN_SECONDS) {
          this.progresoGuardado.set(m.progress_seconds);
        }
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error cargando la película');
        this.loading.set(false);
      },
    });
  }

  onMetadata() {
    this.videoListo.set(true);
    if (this.progresoGuardado() > 0) {
      // Hay progreso guardado: mostrar modal y no reproducir aún
      this.mostrarModal.set(true);
    } else {
      this.videoEl.nativeElement.play().catch(() => {});
    }
  }

  reanudar() {
    this.mostrarModal.set(false);
    const video = this.videoEl.nativeElement;
    video.currentTime = this.progresoGuardado();
    video.play().catch(() => {});
  }

  empezarDesdeElPrincipio() {
    this.mostrarModal.set(false);
    this.progresoGuardado.set(0);
    this.videoEl.nativeElement.play().catch(() => {});
  }

  onEnded() {
    // Película terminada: borrar progreso guardado
    this.progressSaved = true;
    this.api.guardarProgreso(this.movieId, 0).subscribe();
  }

  onVideoError() {
    this.error.set(
      'Error al reproducir el vídeo. El torrent puede estar tardando en conectar.'
    );
  }

  // Guarda el progreso si el usuario cierra la pestaña o recarga
  @HostListener('window:beforeunload')
  onBeforeUnload() {
    if (this.progressSaved || !this.videoEl?.nativeElement) return;
    const t = Math.floor(this.videoEl.nativeElement.currentTime);
    if (t > 0) {
      fetch(`/api/movies/${this.movieId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_seconds: t }),
        credentials: 'include',
        keepalive: true,
      });
      this.progressSaved = true;
    }
  }

  // Guarda el progreso al navegar dentro de la app (Angular router)
  ngOnDestroy() {
    if (this.progressSaved || !this.videoEl?.nativeElement) return;
    const t = Math.floor(this.videoEl.nativeElement.currentTime);
    if (t > 0) {
      this.progressSaved = true;
      this.api.guardarProgreso(this.movieId, t).subscribe();
    }
  }

  volver() {
    this.router.navigate(['/biblioteca']);
  }
}
