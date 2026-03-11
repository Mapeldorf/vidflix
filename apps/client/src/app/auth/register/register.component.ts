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
  templateUrl: './register.component.html',
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
