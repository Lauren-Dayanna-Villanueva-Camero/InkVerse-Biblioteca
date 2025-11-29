import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { AlertService } from '../../services/alert.service';
import { Categoria } from '../../services/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

declare const $: any;
declare const bootstrap: any;

@Component({
  selector: 'app-admin-categorias',
  templateUrl: './admin-categorias.component.html',
  styleUrls: ['./admin-categorias.component.css']
})
export class AdminCategoriasComponent implements OnInit, AfterViewInit {
  @ViewChild('categoriasTable') categoriasTable!: ElementRef;

  categorias: Categoria[] = [];
  mostrarFormularioCategoria = false;
  modoEdicionCategoria = false;
  categoriaSeleccionada: Categoria | null = null;

  categoriaForm: FormGroup;

  constructor(
    public authService: AuthService,
    private adminService: AdminService,
    private alertService: AlertService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    this.cargarCategorias();
  }

  ngAfterViewInit(): void {
    // DataTable se inicializara después de cargar los datos
  }

  cargarCategorias(): void {
    // Destruir DataTable si existe antes de cargar nuevos datos
    if (this.categoriasTable && this.categoriasTable.nativeElement) {
      if ($.fn.DataTable.isDataTable(this.categoriasTable.nativeElement)) {
        $(this.categoriasTable.nativeElement).DataTable().destroy();
      }
    }

    this.adminService.listarCategorias().subscribe({
      next: (categorias) => {
        console.log('📚 Categorías cargadas:', categorias.length);
        this.categorias = categorias;
        // Reinicializar DataTable después de actualizar los datos
        setTimeout(() => this.inicializarDataTableCategorias(), 100);
      },
      error: (err) => {
        console.error('❌ Error al cargar categorías:', err);
      }
    });
  }

  inicializarDataTableCategorias(): void {
    if (this.categoriasTable && this.categoriasTable.nativeElement) {
      if ($.fn.DataTable.isDataTable(this.categoriasTable.nativeElement)) {
        $(this.categoriasTable.nativeElement).DataTable().destroy();
      }

      $(this.categoriasTable.nativeElement).DataTable({
        language: {
          url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        pageLength: 10,
        order: [[0, 'asc']],
        columnDefs: [
          { orderable: false, targets: [2] } // Botones de acción no ordenables
        ]
      });
    }
  }

  abrirCrearCategoria(): void {
    this.modoEdicionCategoria = false;
    this.categoriaSeleccionada = null;
    this.categoriaForm.reset();
    this.mostrarFormularioCategoria = true;
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    modal.show();
  }

  abrirEditarCategoria(categoria: Categoria): void {
    this.modoEdicionCategoria = true;
    this.categoriaSeleccionada = categoria;
    this.categoriaForm.patchValue({
      nombre: categoria.nombre
    });
    this.mostrarFormularioCategoria = true;
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    modal.show();
  }

  guardarCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    const categoria: Categoria = {
      id: this.categoriaSeleccionada?.id || 0,
      nombre: this.categoriaForm.value.nombre
    };

    const operacion = this.modoEdicionCategoria
      ? this.adminService.actualizarCategoria(categoria.id, categoria)
      : this.adminService.crearCategoria(categoria);

    operacion.subscribe({
      next: (categoriaGuardada) => {
        console.log('✅ Categoría guardada:', categoriaGuardada);
        this.cerrarModalCategoria();
        // Recargar categorías y reinicializar DataTable
        this.cargarCategorias();
        this.alertService.success(
          this.modoEdicionCategoria ? 'Categoría actualizada' : 'Categoría creada',
          this.modoEdicionCategoria ? 'La categoría ha sido actualizada exitosamente' : 'La categoría ha sido creada exitosamente'
        );
      },
      error: (err) => {
        console.error('❌ Error al guardar categoría:', err);
        this.alertService.error('Error al guardar', err?.error?.message || err?.error?.error || 'Error al guardar la categoría');
      }
    });
  }

  eliminarCategoria(categoria: Categoria): void {
    this.alertService.confirm(
      'Eliminar categoría',
      `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`,
      'Sí, eliminar',
      'Cancelar'
    ).then((confirmed) => {
      if (confirmed) {
        this.adminService.eliminarCategoria(categoria.id).subscribe({
          next: () => {
            console.log('✅ Categoría eliminada');
            this.cargarCategorias();
            this.alertService.success('Categoría eliminada', 'La categoría ha sido eliminada exitosamente');
          },
          error: (err) => {
            console.error('❌ Error al eliminar categoría:', err);
            this.alertService.error('Error al eliminar', err?.error?.message || err?.error?.error || 'Error al eliminar la categoría');
          }
        });
      }
    });
  }

  cerrarModalCategoria(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoriaModal'));
    if (modal) {
      modal.hide();
    }
    this.mostrarFormularioCategoria = false;
    this.categoriaSeleccionada = null;
    this.categoriaForm.reset();
  }
}

