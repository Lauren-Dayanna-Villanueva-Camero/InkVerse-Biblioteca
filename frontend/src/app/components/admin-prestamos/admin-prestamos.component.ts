import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { Prestamo } from '../../services/api.service';
import { FormsModule } from '@angular/forms';

declare const $: any;
declare const bootstrap: any;

@Component({
  selector: 'app-admin-prestamos',
  templateUrl: './admin-prestamos.component.html',
  styleUrls: ['./admin-prestamos.component.css']
})
export class AdminPrestamosComponent implements OnInit, AfterViewInit {
  @ViewChild('prestamosTable') prestamosTable!: ElementRef;

  prestamos: Prestamo[] = [];
  loading = false;
  filtroEstado: string = 'TODOS'; // TODOS, PRESTADO, MULTA, DEVUELTO

  constructor(
    public authService: AuthService,
    private adminService: AdminService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // No mostrar alertas si el usuario está cerrando sesión
    if (sessionStorage.getItem('isLoggingOut') === 'true') {
      return;
    }

    if (!this.authService.isAdmin()) {
      this.alertService.error('Sin permisos', 'No tienes permisos para acceder a esta sección. Debes ser ADMIN.').then(() => {
        this.router.navigate(['/']);
      });
      return;
    }
    this.cargarPrestamos();
  }

  ngAfterViewInit(): void {
    // DataTable se inicializará después de cargar los datos
  }

  cargarPrestamos(): void {
    // Debug: Verificar estado de autenticación
    console.log('🔍 Estado de autenticación:', {
      isLoggedIn: this.authService.isLoggedIn(),
      isAdmin: this.authService.isAdmin(),
      rol: this.authService.getRol(),
      username: this.authService.getUsername(),
      token: this.authService.getToken() ? 'Presente' : 'Ausente'
    });

    // No mostrar alertas si el usuario está cerrando sesión
    if (sessionStorage.getItem('isLoggingOut') === 'true') {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.alertService.warning('Sesión requerida', 'Debes iniciar sesión para acceder a esta sección.').then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    if (!this.authService.isAdmin()) {
      const rolActual = this.authService.getRol();
      console.error('❌ Usuario no es ADMIN. Rol actual:', rolActual);
      this.alertService.error('Sin permisos', `No tienes permisos para acceder a esta sección. Debes ser ADMIN.\n\nTu rol actual: ${rolActual || 'No definido'}\n\nPor favor, inicia sesión con un usuario ADMIN.`).then(() => {
        this.router.navigate(['/']);
      });
      return;
    }

    this.loading = true;
    console.log('📡 Solicitando préstamos desde: http://localhost:8080/api/admin/prestamos');

    this.adminService.listarPrestamos().subscribe({
      next: (prestamos) => {
        console.log('✅ Préstamos cargados exitosamente:', prestamos.length, 'préstamos');
        this.prestamos = prestamos;
        this.loading = false;
        setTimeout(() => this.inicializarDataTable(), 100);
      },
      error: (err) => {
        console.error('❌ Error al cargar préstamos:', err);
        console.error('Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          message: err?.error?.message || err.message
        });

        this.loading = false;
        this.prestamos = []; // Limpiar datos en caso de error

        if (err.status === 403) {
          const rolActual = this.authService.getRol();
          const username = this.authService.getUsername();
          console.error('❌ Error 403 - Sin permisos:', {
            rolActual,
            username,
            tokenPresente: !!this.authService.getToken()
          });

          // No mostrar alerta si el usuario está cerrando sesión
          if (sessionStorage.getItem('isLoggingOut') !== 'true') {
            if (rolActual === 'ADMIN') {
              this.alertService.error('Error de autorización',
                `Tu token puede haber expirado o tu cuenta puede estar bloqueada.\n\nUsuario: ${username || 'No definido'}\nRol: ${rolActual || 'No definido'}\n\nSolución: Cierra sesión e inicia sesión nuevamente.`);
            } else {
              this.alertService.error('Sin permisos',
                `Debes ser ADMIN para ver los préstamos.\n\nTu rol actual: ${rolActual || 'No definido'}\nUsuario: ${username || 'No definido'}\n\nPor favor, inicia sesión con un usuario ADMIN.`).then(() => {
                this.router.navigate(['/']);
              });
            }
          }
        } else if (err.status === 401) {
          // No mostrar alerta si el usuario está cerrando sesión
          if (sessionStorage.getItem('isLoggingOut') !== 'true') {
            this.alertService.warning('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.').then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        } else {
          this.alertService.error('Error al cargar préstamos',
            `${err?.error?.message || err.message || 'Error desconocido'}\n\nStatus: ${err.status || 'N/A'}`);
        }
      }
    });
  }

  inicializarDataTable(): void {
    if (this.prestamosTable && this.prestamosTable.nativeElement) {
      if ($.fn.DataTable.isDataTable(this.prestamosTable.nativeElement)) {
        $(this.prestamosTable.nativeElement).DataTable().destroy();
      }

      $(this.prestamosTable.nativeElement).DataTable({
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        pageLength: 10,
        order: [[0, 'desc']], // Ordenar por ID descendente (más recientes primero)
        columnDefs: [
          { orderable: false, targets: [8] } // Botones de acción no ordenables
        ]
      });
    }
  }

  recibirLibro(prestamo: Prestamo): void {
    if (!this.authService.isAdmin()) {
      this.alertService.error('Sin permisos', 'No tienes permisos para realizar esta acción. Debes ser ADMIN.');
      return;
    }

    this.alertService.confirm(
      'Confirmar recepción',
      `¿Confirmas que recibiste el libro "${prestamo.libro.titulo}" de ${prestamo.usuario.nombre} ${prestamo.usuario.apellido}?`,
      'Sí, recibido',
      'Cancelar'
    ).then((confirmed) => {
      if (confirmed) {
        this.adminService.recibirLibro(prestamo.id).subscribe({
          next: () => {
            this.cargarPrestamos();
            this.alertService.success('Libro recibido', 'El libro ha sido recibido exitosamente.');
          },
          error: (err) => {
            console.error('Error al recibir libro:', err);
            if (err.status === 403 || err.status === 401) {
              // No mostrar alerta si el usuario está cerrando sesión
              if (sessionStorage.getItem('isLoggingOut') !== 'true') {
                this.alertService.warning('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.').then(() => {
                  this.authService.logout();
                  this.router.navigate(['/login']);
                });
              } else {
                this.authService.logout();
                this.router.navigate(['/login']);
              }
            } else {
              this.alertService.error('Error', `Error al recibir el libro: ${err?.error?.message || 'Error desconocido'}`);
            }
          }
        });
      }
    });
  }

  actualizarMultas(): void {
    console.log('🔄 Iniciando actualización de multas...');

    if (!this.authService.isLoggedIn()) {
      console.error('❌ Usuario no está logueado');
      this.alertService.warning('Sesión requerida', 'Debes iniciar sesión para realizar esta acción.').then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    if (!this.authService.isAdmin()) {
      const rolActual = this.authService.getRol();
      console.error('❌ Usuario no es ADMIN. Rol actual:', rolActual);
      this.alertService.error('Sin permisos', `No tienes permisos para realizar esta acción. Debes ser ADMIN.\n\nTu rol actual: ${rolActual || 'No definido'}`);
      return;
    }

    const token = this.authService.getToken();
    console.log('🔐 Token presente:', !!token);
    console.log('🔐 Rol en localStorage:', this.authService.getRol());

    this.alertService.confirm(
      'Actualizar multas',
      '¿Deseas actualizar las multas de todos los préstamos vencidos? Esto calculará las multas de $5,000 por día de retraso.',
      'Sí, actualizar',
      'Cancelar'
    ).then((confirmed) => {
      if (!confirmed) {
        console.log('❌ Usuario canceló la actualización de multas');
        return;
      }

      console.log('📡 Enviando petición PUT a /api/admin/prestamos/actualizar-multas');
      this.adminService.actualizarMultas().subscribe({
        next: (response) => {
          console.log('✅ Multas actualizadas exitosamente:', response);
          this.cargarPrestamos();
          this.alertService.success('Multas actualizadas', response || 'Las multas han sido actualizadas exitosamente.');
        },
        error: (err) => {
          console.error('❌ Error al actualizar multas:', err);
          console.error('Detalles del error:', {
            status: err.status,
            statusText: err.statusText,
            url: err.url,
            message: err?.error?.message || err.message,
            headers: err.headers
          });

          if (err.status === 403) {
            const rolActual = this.authService.getRol();
            const username = this.authService.getUsername();
            console.error('❌ Error 403 - Detalles:', {
              rolActual,
              username,
              tokenPresente: !!this.authService.getToken(),
              url: err.url
            });

            // No mostrar alerta si el usuario está cerrando sesión
            if (sessionStorage.getItem('isLoggingOut') !== 'true') {
              if (rolActual === 'ADMIN') {
                this.alertService.error('Error de autorización',
                  `Tu token puede haber expirado o tu cuenta puede estar bloqueada.\n\nUsuario: ${username || 'No definido'}\nRol: ${rolActual || 'No definido'}\n\nSolución: Cierra sesión e inicia sesión nuevamente.`);
              } else {
                this.alertService.error('Sin permisos',
                  `Debes ser ADMIN para actualizar multas.\n\nTu rol actual: ${rolActual || 'No definido'}\nUsuario: ${username || 'No definido'}`);
              }
            }
          } else if (err.status === 401) {
            this.alertService.warning('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.').then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else {
            this.alertService.error('Error al actualizar multas',
              `${err?.error?.message || err.message || 'Error desconocido'}\n\nStatus: ${err.status || 'N/A'}`);
          }
        }
      });
    });
  }

  pagarMulta(prestamo: Prestamo): void {
    if (!this.authService.isAdmin()) {
      this.alertService.error('Sin permisos', 'No tienes permisos para realizar esta acción. Debes ser ADMIN.');
      return;
    }

    this.alertService.confirm(
      'Confirmar pago de multa',
      `¿Confirmas que ${prestamo.usuario.nombre} ${prestamo.usuario.apellido} pagó la multa de ${this.formatearMoneda(prestamo.valorMulta)}?`,
      'Sí, pagado',
      'Cancelar'
    ).then((confirmed) => {
      if (confirmed) {
        this.adminService.pagarMulta(prestamo.id).subscribe({
          next: () => {
            this.cargarPrestamos();
            this.alertService.success('Multa pagada', 'La multa ha sido marcada como pagada exitosamente.');
          },
          error: (err) => {
            console.error('Error al pagar multa:', err);
            if (err.status === 403 || err.status === 401) {
              // No mostrar alerta si el usuario está cerrando sesión
              if (sessionStorage.getItem('isLoggingOut') !== 'true') {
                this.alertService.warning('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.').then(() => {
                  this.authService.logout();
                  this.router.navigate(['/login']);
                });
              } else {
                this.authService.logout();
                this.router.navigate(['/login']);
              }
            } else {
              this.alertService.error('Error', `Error al pagar la multa: ${err?.error?.message || 'Error desconocido'}`);
            }
          }
        });
      }
    });
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

  aplicarFiltro(): void {
    // Reinicializar DataTable con los datos filtrados
    setTimeout(() => this.inicializarDataTable(), 100);
  }

  filtrarPrestamos(): Prestamo[] {
    if (this.filtroEstado === 'TODOS') {
      return this.prestamos;
    }
    return this.prestamos.filter(p => p.estado === this.filtroEstado);
  }

  getTotalPrestamos(): number {
    return this.prestamos.length;
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
    return this.calcularDiasRestantes(fechaLimite) < 0 ? 'bg-danger' : 'bg-success';
  }

  estaVencidoYEnPrestamo(prestamo: Prestamo): boolean {
    return this.estaVencido(prestamo.fechaLimite) && prestamo.estado === 'PRESTADO';
  }

  tieneDiasRetraso(prestamo: Prestamo): boolean {
    return prestamo.diasRetraso !== undefined && prestamo.diasRetraso !== null && prestamo.diasRetraso > 0;
  }

  tieneMulta(prestamo: Prestamo): boolean {
    return prestamo.valorMulta !== undefined && prestamo.valorMulta !== null && prestamo.valorMulta > 0;
  }

  estaDevuelto(prestamo: Prestamo): boolean {
    return prestamo.estado === 'DEVUELTO';
  }

  estaEnMultaConValor(prestamo: Prestamo): boolean {
    return prestamo.estado === 'MULTA' && this.tieneMulta(prestamo);
  }
}

