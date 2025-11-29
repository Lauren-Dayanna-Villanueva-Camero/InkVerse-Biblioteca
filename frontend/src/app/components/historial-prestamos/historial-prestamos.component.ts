import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { ApiService, Prestamo } from '../../services/api.service';

@Component({
  selector: 'app-historial-prestamos',
  templateUrl: './historial-prestamos.component.html',
  styleUrls: ['./historial-prestamos.component.css']
})
export class HistorialPrestamosComponent implements OnInit {
  prestamos: Prestamo[] = [];
  loading = false;
  filtroEstado: string = 'TODOS'; // TODOS, PRESTADO, MULTA, DEVUELTO

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.alertService.warning('Sesión requerida', 'Debes iniciar sesión para ver tu historial de préstamos.').then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }
    this.cargarPrestamos();
  }

  cargarPrestamos(): void {
    this.loading = true;
    this.apiService.misPrestamos().subscribe({
      next: (prestamos) => {
        console.log('✅ Préstamos cargados:', prestamos.length);
        this.prestamos = prestamos;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar préstamos:', err);
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          // No mostrar alerta si el usuario está cerrando sesión
          if (sessionStorage.getItem('isLoggingOut') !== 'true') {
            this.alertService.warning('Sesión expirada', 'Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión nuevamente.').then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        } else {
          this.alertService.error('Error al cargar préstamos', err?.error?.message || 'Error desconocido');
        }
      }
    });
  }

  filtrarPrestamos(): Prestamo[] {
    if (this.filtroEstado === 'TODOS') {
      return this.prestamos;
    }
    return this.prestamos.filter(p => p.estado === this.filtroEstado);
  }

  calcularDiasTranscurridos(fechaPrestamo: string): number {
    const fecha = new Date(fechaPrestamo);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - fecha.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  calcularDiasRestantes(fechaLimite: string): number {
    const fecha = new Date(fechaLimite);
    const hoy = new Date();
    const diffTime = fecha.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  estaVencido(fechaLimite: string): boolean {
    return this.calcularDiasRestantes(fechaLimite) < 0;
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'PRESTADO':
        return 'bg-primary';
      case 'MULTA':
        return 'bg-danger';
      case 'DEVUELTO':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'PRESTADO':
        return 'Prestado';
      case 'MULTA':
        return 'En Multa';
      case 'DEVUELTO':
        return 'Devuelto';
      default:
        return estado;
    }
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatearMoneda(valor: number | undefined): string {
    if (!valor) return '$0';
    return '$' + valor.toLocaleString('es-CO');
  }

  tieneDiasRetraso(prestamo: Prestamo): boolean {
    return prestamo.diasRetraso !== undefined && prestamo.diasRetraso !== null && prestamo.diasRetraso > 0;
  }

  tieneMulta(prestamo: Prestamo): boolean {
    return prestamo.valorMulta !== undefined && prestamo.valorMulta !== null && prestamo.valorMulta > 0;
  }

  getPrestadosCount(): number {
    return this.prestamos.filter(p => p.estado === 'PRESTADO').length;
  }

  getMultasCount(): number {
    return this.prestamos.filter(p => p.estado === 'MULTA').length;
  }

  getDevueltosCount(): number {
    return this.prestamos.filter(p => p.estado === 'DEVUELTO').length;
  }

  getDiasRestantesClass(fechaLimite: string): string {
    const dias = this.calcularDiasRestantes(fechaLimite);
    if (dias < 0) return 'bg-danger';
    if (dias <= 2) return 'bg-warning';
    return 'bg-success';
  }
}
