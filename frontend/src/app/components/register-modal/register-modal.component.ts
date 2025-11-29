import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

declare const bootstrap: any;

@Component({
  selector: 'app-register-modal',
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.css']
})
export class RegisterModalComponent {
  loading = false;
  error: string | null = null;
  success: string | null = null;
  form: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
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
        this.success = 'Registro exitoso. Ahora puedes iniciar sesión.';
        const modalEl = document.getElementById('registerModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) {
            setTimeout(() => modal.hide(), 1200);
          }
        }
      },
      error: err => {
        this.error = err?.error?.message || 'Error al registrar usuario.';
        this.loading = false;
      }
    });
  }
}


