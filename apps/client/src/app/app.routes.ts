import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'buscar', pathMatch: 'full' },
  {
    path: 'buscar',
    loadComponent: () =>
      import('./pages/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'pelicula/:tmdbId',
    loadComponent: () =>
      import('./pages/movie-detail/movie-detail.component').then(
        (m) => m.MovieDetailComponent
      ),
  },
  {
    path: 'biblioteca',
    loadComponent: () =>
      import('./pages/library/library.component').then(
        (m) => m.LibraryComponent
      ),
  },
  {
    path: 'reproducir/:id',
    loadComponent: () =>
      import('./pages/player/player.component').then((m) => m.PlayerComponent),
  },
  { path: '**', redirectTo: 'buscar' },
];
