import { Route } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'buscar', pathMatch: 'full' },

  // Auth pages (redirect to /buscar if already logged in)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },

  // Protected pages
  {
    path: 'buscar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'pelicula/:tmdbId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/movie-detail/movie-detail.component').then(
        (m) => m.MovieDetailComponent
      ),
  },
  {
    path: 'biblioteca',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/library/library.component').then((m) => m.LibraryComponent),
  },
  {
    path: 'reproducir/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/player/player.component').then((m) => m.PlayerComponent),
  },

  { path: '**', redirectTo: 'buscar' },
];
