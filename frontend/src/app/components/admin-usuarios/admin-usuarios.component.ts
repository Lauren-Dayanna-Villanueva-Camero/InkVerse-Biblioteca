import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { Usuario } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

declare const $: any;
declare const bootstrap: any;

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.css']
})
export class AdminUsuariosComponent implements OnInit, AfterViewInit {
  @ViewChild('usuariosTable') usuariosTable!: ElementRef;

  usuarios: Usuario[] = [];
  loading = false;
  mostrarFormularioUsuario = false;
  modoEdicion = false;
  usuarioSeleccionado: Usuario | null = null;
  usuarioParaVer: Usuario | null = null;

  usuarioForm: FormGroup;

  constructor(
    public authService: AuthService,
    private adminService: AdminService,
    private alertService: AlertService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.usuarioForm = this.fb.group({
      username: ['', Validators.required],
      password: [''],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['USUARIO', Validators.required],
      bloqueado: [false]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.alertService.error('Sin permisos', 'No tienes permisos para acceder a esta sección. Debes ser ADMIN.').then(() => {
        this.router.navigate(['/']);
      });
      return;
    }
    this.cargarUsuarios();
  }

  ngAfterViewInit(): void {
    // DataTable se inicializará después de cargar los datos
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.adminService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.loading = false;
        setTimeout(() => this.inicializarDataTable(), 100);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.loading = false;
        if (err.status === 403) {
          this.alertService.error('Sin permisos', 'No tienes permisos para acceder a esta sección. Debes ser ADMIN. Por favor, cierra sesión y vuelve a iniciar sesión como administrador.');
        } else {
          this.alertService.error('Error al cargar usuarios', err?.error?.message || 'Error desconocido');
        }
      }
    });
  }

  inicializarDataTable(): void {
    if (this.usuariosTable && this.usuariosTable.nativeElement) {
      if ($.fn.DataTable.isDataTable(this.usuariosTable.nativeElement)) {
        $(this.usuariosTable.nativeElement).DataTable().destroy();
      }

      $(this.usuariosTable.nativeElement).DataTable({
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        pageLength: 10,
        order: [[0, 'asc']],
        columnDefs: [
          { orderable: false, targets: [7] } // Botones de acción no ordenables
        ]
      });
    }
  }

  abrirCrearUsuario(): void {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.usuarioForm.reset({
      rol: 'USUARIO',
      bloqueado: false,
      password: ''
    });
    // Hacer password requerido en creación
    this.usuarioForm.get('password')?.setValidators([Validators.required]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.mostrarFormularioUsuario = true;
    const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    modal.show();
  }

  abrirEditarUsuario(usuario: Usuario): void {
    this.modoEdicion = true;
    this.usuarioSeleccionado = usuario;
    this.usuarioForm.patchValue({
      username: usuario.username,
      password: '', // No mostrar contraseña
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      bloqueado: usuario.bloqueado
    });
    // Password opcional en edición
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.mostrarFormularioUsuario = true;
    const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    modal.show();
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const formValue = this.usuarioForm.value;
    const usuario: Usuario = {
      id: this.usuarioSeleccionado?.id || 0,
      username: formValue.username,
      nombre: formValue.nombre,
      apellido: formValue.apellido,
      email: formValue.email,
      rol: formValue.rol,
      bloqueado: formValue.bloqueado
    };

    // Solo incluir password si se proporcionó una nueva
    if (formValue.password && formValue.password.trim() !== '') {
      usuario.password = formValue.password;
    }

    const operacion = this.modoEdicion
      ? this.adminService.actualizarUsuario(usuario.id, usuario)
      : this.adminService.crearUsuario(usuario);

    operacion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarUsuarios();
        this.alertService.success(
          this.modoEdicion ? 'Usuario actualizado' : 'Usuario creado',
          this.modoEdicion ? 'El usuario ha sido actualizado exitosamente' : 'El usuario ha sido creado exitosamente'
        );
      },
      error: (err) => {
        this.alertService.error('Error al guardar', err?.error?.message || err?.error?.error || 'Error al guardar el usuario');
      }
    });
  }

  eliminarUsuario(usuario: Usuario): void {
    this.alertService.confirm(
      'Eliminar usuario',
      `¿Estás seguro de eliminar el usuario "${usuario.username}"?`,
      'Sí, eliminar',
      'Cancelar'
    ).then((confirmed) => {
      if (confirmed) {
        this.adminService.eliminarUsuario(usuario.id).subscribe({
          next: () => {
            this.cargarUsuarios();
            this.alertService.success('Usuario eliminado', 'El usuario ha sido eliminado exitosamente');
          },
          error: (err) => {
            this.alertService.error('Error al eliminar', err?.error?.message || err?.error?.error || 'Error al eliminar el usuario');
          }
        });
      }
    });
  }

  verUsuario(usuario: Usuario): void {
    this.usuarioParaVer = usuario;
    const modal = new bootstrap.Modal(document.getElementById('verUsuarioModal'));
    modal.show();
  }

  cerrarModalVer(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('verUsuarioModal'));
    if (modal) {
      modal.hide();
    }
    this.usuarioParaVer = null;
  }

  editarDesdeModalVer(): void {
    if (!this.usuarioParaVer) {
      return;
    }

    const modalVer = bootstrap.Modal.getInstance(document.getElementById('verUsuarioModal'));
    if (modalVer) {
      modalVer.hide();
    }

    setTimeout(() => {
      this.abrirEditarUsuario(this.usuarioParaVer!);
      this.usuarioParaVer = null;
    }, 300);
  }

  cerrarModal(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('usuarioModal'));
    if (modal) {
      modal.hide();
    }
    this.mostrarFormularioUsuario = false;
    this.usuarioSeleccionado = null;
    this.usuarioForm.reset();
  }

  toggleBloqueado(usuario: Usuario): void {
    const nuevoEstado = !usuario.bloqueado;
    const usuarioActualizado: Usuario = {
      ...usuario,
      bloqueado: nuevoEstado
    };

    this.adminService.actualizarUsuario(usuario.id, usuarioActualizado).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.alertService.success(
          nuevoEstado ? 'Usuario bloqueado' : 'Usuario desbloqueado',
          `El usuario ha sido ${nuevoEstado ? 'bloqueado' : 'desbloqueado'} exitosamente`
        );
      },
      error: (err) => {
        this.alertService.error('Error al actualizar', err?.error?.message || 'Error al actualizar el estado del usuario');
      }
    });
  }
}

