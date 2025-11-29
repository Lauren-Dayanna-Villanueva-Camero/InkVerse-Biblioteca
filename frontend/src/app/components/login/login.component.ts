import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loading = false;
  error: string | null = null;
  form: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.value;
    this.loading = true;
    this.error = null;
    this.authService.login(username || '', password || '').subscribe({
      next: (response) => {
        this.loading = false;
        // Redirigir según el rol del usuario
        if (response.rol === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/mi-historial']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        // Verificar si el error es por usuario bloqueado
        if (err.status === 403 && err.error && err.error.error === 'USUARIO_BLOQUEADO') {
          this.alertService.error(
            'Usuario Bloqueado',
            'El usuario ha sido bloqueado. Por favor, comuníquese con el administrador.'
          );
        } else {
          this.error = 'Credenciales inválidas.';
        }
      }
    });
  }
}

