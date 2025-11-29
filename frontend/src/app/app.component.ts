import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentYear: number;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.currentYear = new Date().getFullYear();
  }

  logout(): void {
    // Marcar que se está haciendo logout para evitar alertas
    sessionStorage.setItem('isLoggingOut', 'true');
    this.authService.logout();
    // Redirigir a la página principal sin recargar
    this.router.navigate(['/']).then(() => {
      // Limpiar la bandera después de un breve delay
      setTimeout(() => {
        sessionStorage.removeItem('isLoggingOut');
      }, 1000);
    });
  }
}


