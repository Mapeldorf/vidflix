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
  templateUrl: './player.component.html',
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
