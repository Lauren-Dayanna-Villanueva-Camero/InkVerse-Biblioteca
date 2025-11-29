import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { Libro, Categoria } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

declare const $: any;
declare const bootstrap: any;

@Component({
  selector: 'app-admin-libros',
  templateUrl: './admin-libros.component.html',
  styleUrls: ['./admin-libros.component.css']
})
export class AdminLibrosComponent implements OnInit, AfterViewInit {
  @ViewChild('librosTable') librosTable!: ElementRef;

  libros: Libro[] = [];
  categorias: Categoria[] = [];
  loading = false;
  mostrarFormularioLibro = false;
  modoEdicion = false;
  libroSeleccionado: Libro | null = null;
  libroParaVer: Libro | null = null;

  libroForm: FormGroup;
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  subiendoImagen = false;

  constructor(
    public authService: AuthService,
    private adminService: AdminService,
    private alertService: AlertService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.libroForm = this.fb.group({
      titulo: ['', Validators.required],
      autor: ['', Validators.required],
      descripcion: ['', Validators.required],
      imagenUrl: [''],
      cantidadTotal: [1, [Validators.required, Validators.min(1)]],
      cantidadDisponible: [1, [Validators.required, Validators.min(0)]],
      categoriaId: [null]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.cargarCategorias();
    this.cargarLibros();
  }

  ngAfterViewInit(): void {
    // DataTable se inicializará después de cargar los datos
  }

  cargarCategorias(): void {
    this.adminService.listarCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  cargarLibros(): void {
    this.loading = true;
    this.adminService.listarLibros().subscribe({
      next: (libros) => {
        this.libros = libros;
        this.loading = false;
        setTimeout(() => this.inicializarDataTable(), 100);
      },
      error: (err) => {
        console.error('Error al cargar libros:', err);
        this.loading = false;
      }
    });
  }

  inicializarDataTable(): void {
    if ($.fn.DataTable.isDataTable(this.librosTable.nativeElement)) {
      $(this.librosTable.nativeElement).DataTable().destroy();
    }

    $(this.librosTable.nativeElement).DataTable({
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
      },
      pageLength: 10,
      order: [[0, 'asc']],
      columnDefs: [
        { orderable: false, targets: [6, 7] } // Botones de acción no ordenables
      ]
    });
  }

  abrirCrearLibro(): void {
    this.modoEdicion = false;
    this.libroSeleccionado = null;
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.libroForm.reset({
      cantidadTotal: 1,
      cantidadDisponible: 1,
      imagenUrl: ''
    });
    this.mostrarFormularioLibro = true;
    const modal = new bootstrap.Modal(document.getElementById('libroModal'));
    modal.show();
  }

  abrirEditarLibro(libro: Libro): void {
    this.modoEdicion = true;
    this.libroSeleccionado = libro;
    this.imagenSeleccionada = null;
    this.imagenPreview = libro.imagenUrl ? `http://localhost:8080${libro.imagenUrl}` : null;
    this.libroForm.patchValue({
      titulo: libro.titulo,
      autor: libro.autor,
      descripcion: libro.descripcion,
      imagenUrl: libro.imagenUrl || '',
      cantidadTotal: libro.cantidadTotal,
      cantidadDisponible: libro.cantidadDisponible,
      categoriaId: libro.categoria?.id || null
    });
    this.mostrarFormularioLibro = true;
    const modal = new bootstrap.Modal(document.getElementById('libroModal'));
    modal.show();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        this.alertService.warning('Archivo inválido', 'Por favor selecciona un archivo de imagen');
        return;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.warning('Archivo muy grande', 'La imagen no puede ser mayor a 5MB');
        return;
      }

      this.imagenSeleccionada = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  subirImagen(): void {
    if (!this.imagenSeleccionada) {
      return;
    }

    this.subiendoImagen = true;
    this.adminService.subirImagen(this.imagenSeleccionada).subscribe({
      next: (response) => {
        this.libroForm.patchValue({ imagenUrl: response.url });
        this.imagenPreview = `http://localhost:8080${response.url}`;
        this.subiendoImagen = false;
        this.alertService.success('Imagen subida', 'La imagen se ha subido exitosamente');
      },
      error: (err) => {
        this.subiendoImagen = false;
        this.alertService.error('Error al subir imagen', err?.error?.error || 'Error al subir la imagen');
      }
    });
  }

  guardarLibro(): void {
    if (this.libroForm.invalid) {
      this.libroForm.markAllAsTouched();
      return;
    }

    // Si hay una imagen seleccionada pero no se ha subido, subirla primero
    if (this.imagenSeleccionada) {
      const formValue = this.libroForm.value;
      if (!formValue.imagenUrl || formValue.imagenUrl === '') {
        // Subir imagen primero
        this.subiendoImagen = true;
        this.adminService.subirImagen(this.imagenSeleccionada).subscribe({
          next: (response) => {
            this.libroForm.patchValue({ imagenUrl: response.url });
            this.subiendoImagen = false;
            // Continuar guardando el libro
            this.guardarLibroFinal();
          },
          error: (err) => {
            this.subiendoImagen = false;
            this.alertService.error('Error al subir imagen', err?.error?.error || 'Error al subir la imagen');
          }
        });
        return;
      }
    }

    this.guardarLibroFinal();
  }

  private guardarLibroFinal(): void {
    const formValue = this.libroForm.value;

    // Buscar la categoría si se proporciona un ID
    let categoria = null;
    if (formValue.categoriaId && formValue.categoriaId !== 'null' && formValue.categoriaId !== null) {
      const categoriaId = typeof formValue.categoriaId === 'string'
        ? parseInt(formValue.categoriaId)
        : formValue.categoriaId;
      categoria = this.categorias.find(c => c.id === categoriaId) || null;
    }

    const libro: Libro = {
      id: this.libroSeleccionado?.id || 0,
      titulo: formValue.titulo,
      autor: formValue.autor,
      descripcion: formValue.descripcion,
      imagenUrl: formValue.imagenUrl || '',
      cantidadTotal: formValue.cantidadTotal,
      cantidadDisponible: formValue.cantidadDisponible,
      categoria: categoria || undefined
    };

    console.log('📤 Enviando libro:', {
      ...libro,
      categoria: categoria ? { id: categoria.id, nombre: categoria.nombre } : null
    });

    const operacion = this.modoEdicion
      ? this.adminService.actualizarLibro(libro.id, libro)
      : this.adminService.crearLibro(libro);

    operacion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarLibros();
        this.alertService.success(
          this.modoEdicion ? 'Libro actualizado' : 'Libro creado',
          this.modoEdicion ? 'El libro ha sido actualizado exitosamente' : 'El libro ha sido creado exitosamente'
        );
      },
      error: (err) => {
        this.alertService.error('Error al guardar', err?.error?.message || 'Error al guardar el libro');
      }
    });
  }

  eliminarLibro(libro: Libro): void {
    this.alertService.confirm(
      'Eliminar libro',
      `¿Estás seguro de eliminar el libro "${libro.titulo}"?`,
      'Sí, eliminar',
      'Cancelar'
    ).then((confirmed) => {
      if (confirmed) {
        this.adminService.eliminarLibro(libro.id).subscribe({
          next: () => {
            this.cargarLibros();
            this.alertService.success('Libro eliminado', 'El libro ha sido eliminado exitosamente');
          },
          error: (err) => {
            console.error('Error al eliminar libro:', err);

            // Verificar si es un error 403 de permisos
            if (err.status === 403) {
              const errorCode = err?.error?.error;
              const errorMessage = err?.error?.message || '';

              // Si es un error de permisos (no de préstamos activos)
              if (errorCode === 'SIN_PERMISOS' || (!errorMessage.includes('ejemplar') && !errorMessage.includes('préstamo'))) {
                this.alertService.error('Sin permisos', 'No tienes permisos para realizar esta acción. Debes ser ADMIN.');
                return;
              }
            }

            // Verificar si el error es por préstamos activos
            const errorMessage = err?.error?.message || '';
            const errorCode = err?.error?.error || '';

            if (errorCode === 'LIBRO_CON_PRESTAMOS_ACTIVOS' ||
                errorMessage.includes('LIBRO_CON_PRESTAMOS_ACTIVOS') ||
                errorMessage.includes('ejemplar(es) en préstamo')) {
              // Extraer el mensaje después de los dos puntos si existe
              let mensaje = errorMessage;
              if (errorMessage.includes(':')) {
                mensaje = errorMessage.split(':')[1].trim();
              } else if (!errorMessage.includes('ejemplar')) {
                mensaje = 'El libro no puede ser eliminado porque aún se encuentran ejemplares en préstamo con algunos usuarios.';
              }
              this.alertService.warning('No se puede eliminar', mensaje);
            } else {
              this.alertService.error('Error al eliminar', errorMessage || 'Error al eliminar el libro');
            }
          }
        });
      }
    });
  }

  cerrarModal(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('libroModal'));
    if (modal) {
      modal.hide();
    }
    this.mostrarFormularioLibro = false;
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.libroForm.reset();
  }

  getImagenUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MaWJybzwvdGV4dD48L3N2Zz4=';
    }
    // Si es una URL completa, devolverla tal cual
    if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
      return imagenUrl;
    }
    // Si es una ruta relativa (como /uploads/...), construir la URL completa
    if (imagenUrl.startsWith('/')) {
      // Evitar duplicar el puerto
      if (imagenUrl.includes('localhost:8080')) {
        return imagenUrl;
      }
      return `http://localhost:8080${imagenUrl}`;
    }
    return imagenUrl;
  }

  onImageError(event: any): void {
    // Usar una imagen SVG inline para evitar loops infinitos
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MaWJybzwvdGV4dD48L3N2Zz4=';
    event.target.onerror = null; // Prevenir loops infinitos
  }

  verLibro(libro: Libro): void {
    this.libroParaVer = libro;
    const modal = new bootstrap.Modal(document.getElementById('verLibroModal'));
    modal.show();
  }

  cerrarModalVer(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('verLibroModal'));
    if (modal) {
      modal.hide();
    }
    this.libroParaVer = null;
  }

  editarDesdeModalVer(): void {
    if (!this.libroParaVer) {
      return;
    }

    // Cerrar el modal de ver primero
    const modalVer = bootstrap.Modal.getInstance(document.getElementById('verLibroModal'));
    if (modalVer) {
      modalVer.hide();
    }

    // Esperar a que el modal se cierre completamente antes de abrir el de editar
    setTimeout(() => {
      this.abrirEditarLibro(this.libroParaVer!);
      this.libroParaVer = null;
    }, 300);
  }
}

