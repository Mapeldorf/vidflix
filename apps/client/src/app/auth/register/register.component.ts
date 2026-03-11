import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

function passwordStrengthValidator(
  ctrl: AbstractControl
): ValidationErrors | null {
  const v: string = ctrl.value ?? '';
  if (!v) return null;
  const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/.test(v);
  return ok ? null : { weakPassword: true };
}

function passwordMatchValidator(
  group: AbstractControl
): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  template: `
    <div
      class="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10"
    >
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <span class="text-red-500 text-4xl">🎬</span>
          <h1 class="text-white text-3xl font-bold mt-2">VidFlix</h1>
          <p class="text-gray-400 mt-1">Crea tu cuenta</p>
        </div>

        <!-- Card -->
        <div
          class="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl"
        >
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <!-- Username -->
            <div class="mb-5">
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Nombre de usuario
              </label>
              <input
                formControlName="username"
                type="text"
                autocomplete="username"
                placeholder="tu nombre"
                class="w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                [class.border-red-500]="fieldInvalid('username')"
                [class.border-gray-700]="!fieldInvalid('username')"
              />
              @if (fieldError('username', 'required')) {
              <p class="text-red-400 text-xs mt-1">Campo obligatorio</p>
              } @else if (fieldError('username', 'minlength') ||
              fieldError('username', 'maxlength')) {
              <p class="text-red-400 text-xs mt-1">Entre 3 y 30 caracteres</p>
              } @else if (fieldError('username', 'pattern')) {
              <p class="text-red-400 text-xs mt-1">
                Solo letras, números y guiones bajos
              </p>
              }
            </div>

            <!-- Password -->
            <div class="mb-5">
              <label class="block text-sm font-medium text-gray-300 mb-1.5"
                >Contraseña</label
              >
              <input
                formControlName="password"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                [class.border-red-500]="fieldInvalid('password')"
                [class.border-gray-700]="!fieldInvalid('password')"
              />
              @if (fieldError('password', 'required')) {
              <p class="text-red-400 text-xs mt-1">Campo obligatorio</p>
              } @else if (fieldError('password', 'weakPassword')) {
              <p class="text-red-400 text-xs mt-1">
                Mínimo 8 caracteres con mayúscula, minúscula, número y carácter
                especial
              </p>
              }
              <!-- Strength bar -->
              @if (form.get('password')?.value) {
              <div class="mt-2 flex gap-1">
                @for (i of [0,1,2,3]; track i) {
                <div
                  class="h-1 flex-1 rounded-full transition-colors"
                  [class]="strengthBarColor(i)"
                ></div>
                }
              </div>
              <p class="text-xs mt-1" [class]="strengthLabelColor()">
                {{ strengthLabel() }}
              </p>
              }
            </div>

            <!-- Confirm password -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                formControlName="confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                [class.border-red-500]="confirmInvalid()"
                [class.border-gray-700]="!confirmInvalid()"
              />
              @if (confirmInvalid()) {
              <p class="text-red-400 text-xs mt-1">
                Las contraseñas no coinciden
              </p>
              }
            </div>

            <!-- Error -->
            @if (error()) {
            <div
              class="mb-5 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm"
            >
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
                <svg
                  class="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Creando cuenta...
              </span>
              } @else { Crear cuenta }
            </button>
          </form>

          <!-- Login link -->
          <p class="text-center text-gray-400 text-sm mt-6">
            ¿Ya tienes cuenta?
            <a
              routerLink="/login"
              class="text-red-400 hover:text-red-300 font-medium ml-1"
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
        ],
      ],
      password: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  fieldInvalid(name: string): boolean {
    const ctrl = this.form.get(name)!;
    return ctrl.invalid && ctrl.touched;
  }

  fieldError(name: string, error: string): boolean {
    const ctrl = this.form.get(name)!;
    return ctrl.touched && ctrl.hasError(error);
  }

  confirmInvalid(): boolean {
    const ctrl = this.form.get('confirmPassword')!;
    return (
      (ctrl.touched && ctrl.hasError('required')) ||
      (ctrl.touched && !!this.form.hasError('passwordMismatch'))
    );
  }

  // Password strength (0-4)
  private get strengthScore(): number {
    const v: string = this.form.get('password')?.value ?? '';
    if (!v) return 0;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^a-zA-Z\d]/.test(v)) score++;
    return score;
  }

  strengthBarColor(index: number): string {
    const s = this.strengthScore;
    if (index >= s) return 'bg-gray-700';
    if (s <= 1) return 'bg-red-500';
    if (s === 2) return 'bg-orange-500';
    if (s === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  strengthLabel(): string {
    const labels = ['', 'Muy débil', 'Débil', 'Moderada', 'Fuerte'];
    return labels[this.strengthScore] ?? '';
  }

  strengthLabelColor(): string {
    const s = this.strengthScore;
    if (s <= 1) return 'text-red-400';
    if (s === 2) return 'text-orange-400';
    if (s === 3) return 'text-yellow-400';
    return 'text-green-400';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const { username, password } = this.form.getRawValue();
    this.authService.register({ username, password }).subscribe({
      next: () => this.router.navigate(['/buscar']),
      error: (err) => {
        this.error.set(err.error?.error ?? 'Error al crear la cuenta');
        this.loading.set(false);
      },
    });
  }
}
