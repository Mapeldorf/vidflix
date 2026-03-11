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
  templateUrl: './movie-detail.component.html',
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
