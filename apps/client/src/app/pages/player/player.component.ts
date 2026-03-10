import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import type { Movie } from '@vidflix/shared-types';

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
          controls
          class="w-full aspect-video"
          [src]="streamUrl()"
          [class.hidden]="!videoListo()"
          (loadedmetadata)="videoListo.set(true)"
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
  `,
})
export class PlayerComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  pelicula = signal<Movie | null>(null);
  loading = signal(true);
  error = signal('');
  videoListo = signal(false);
  streamUrl = signal('');

  parseGenres(genresJson: string): string[] {
    try {
      return JSON.parse(genresJson);
    } catch {
      return [];
    }
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.streamUrl.set(`/api/stream/${id}`);

    this.api.obtenerPelicula(id).subscribe({
      next: (m) => {
        this.pelicula.set(m);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error cargando la película');
        this.loading.set(false);
      },
    });
  }

  onVideoError() {
    this.error.set(
      'Error al reproducir el vídeo. El torrent puede estar tardando en conectar.'
    );
  }

  volver() {
    this.router.navigate(['/biblioteca']);
  }
}
