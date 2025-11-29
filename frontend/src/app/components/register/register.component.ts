import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  loading = false;
  error: string | null = null;
  success: string | null = null;
  form: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;
    this.success = null;
    this.authService.register(this.form.value as any).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Registro exitoso. Redirigiendo al login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: err => {
        this.error = err?.error?.message || 'Error al registrar usuario.';
        this.loading = false;
      }
    });
  }
}

