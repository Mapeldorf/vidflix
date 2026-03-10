import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <span class="text-red-500 text-4xl">🎬</span>
          <h1 class="text-white text-3xl font-bold mt-2">VidFlix</h1>
          <p class="text-gray-400 mt-1">Inicia sesión para continuar</p>
        </div>

        <!-- Card -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <!-- Login (username or email) -->
            <div class="mb-5">
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Usuario
              </label>
              <input
                formControlName="login"
                type="text"
                autocomplete="username"
                placeholder="tunombre"
                class="w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                [class.border-red-500]="fieldInvalid('login')"
                [class.border-gray-700]="!fieldInvalid('login')"
              />
              @if (fieldInvalid('login')) {
                <p class="text-red-400 text-xs mt-1">Campo obligatorio</p>
              }
            </div>

            <!-- Password -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                formControlName="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                [class.border-red-500]="fieldInvalid('password')"
                [class.border-gray-700]="!fieldInvalid('password')"
              />
              @if (fieldInvalid('password')) {
                <p class="text-red-400 text-xs mt-1">Campo obligatorio</p>
              }
            </div>

            <!-- Error -->
            @if (error()) {
              <div class="mb-5 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
                {{ error() }}
              </div>
            }

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-semibold py-3 rounded-lg transition-colors"
            >
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Iniciando sesión...
                </span>
              } @else {
                Iniciar sesión
              }
            </button>
          </form>

          <!-- Register link -->
          <p class="text-center text-gray-400 text-sm mt-6">
            ¿No tienes cuenta?
            <a routerLink="/registro" class="text-red-400 hover:text-red-300 font-medium ml-1">
              Regístrate
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  fieldInvalid(name: 'login' | 'password'): boolean {
    const ctrl = this.form.get(name)!;
    return ctrl.invalid && ctrl.touched;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/buscar']),
      error: (err) => {
        this.error.set(err.error?.error ?? 'Error al iniciar sesión');
        this.loading.set(false);
      },
    });
  }
}
