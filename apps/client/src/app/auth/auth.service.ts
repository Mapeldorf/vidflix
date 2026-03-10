import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, map, of } from 'rxjs';
import type { User, LoginDto, RegisterDto, AuthResponse } from '@vidflix/shared-types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  /** Called by APP_INITIALIZER — always resolves so the app boots even on 401 */
  checkAuth(): Observable<void> {
    return this.http.get<AuthResponse>('/api/auth/me').pipe(
      tap((res) => this.currentUser.set(res.user)),
      map(() => undefined),
      catchError(() => {
        this.currentUser.set(null);
        return of(undefined);
      })
    );
  }

  login(dto: LoginDto): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/login', dto).pipe(
      tap((res) => this.currentUser.set(res.user)),
      map((res) => res.user)
    );
  }

  register(dto: RegisterDto): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/register', dto).pipe(
      tap((res) => this.currentUser.set(res.user)),
      map((res) => res.user)
    );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({
      complete: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
    });
  }
}
