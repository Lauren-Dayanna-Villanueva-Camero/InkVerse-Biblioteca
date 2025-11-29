import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Libro, Categoria } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

declare const bootstrap: any;

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  libros: Libro[] = [];
  librosFiltrados: Libro[] = [];
  categorias: Categoria[] = [];
  loading = false;
  error: string | null = null;

  selectedBook: Libro | null = null;

  // Filtros
  filtroNombre: string = '';
  filtroCategoria: string = 'TODAS';
  filtroDisponibilidad: string = 'TODOS'; // TODOS, DISPONIBLES, NO_DISPONIBLES

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('BooksComponent inicializado');
    this.cargarLibros();
    this.cargarCategorias();
  }

  cargarLibros(): void {
    this.loading = true;
    this.error = null;
    this.apiService.listarLibros().subscribe({
      next: libros => {
        this.libros = libros;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar los libros.';
        this.loading = false;
      }
    });
  }

  cargarCategorias(): void {
    this.apiService.listarCategorias().subscribe({
      next: categorias => {
        console.log('✅ Categorías cargadas:', categorias.length);
        this.categorias = categorias;
      },
      error: (err) => {
        console.error('❌ Error al cargar categorías:', err);
        console.error('Detalles:', {
          status: err.status,
          url: err.url,
          message: err?.error?.message || err.message
        });
        // No mostrar error al usuario, simplemente dejar el array vacío
        this.categorias = [];
      }
    });
  }

  aplicarFiltros(): void {
    let filtrados = [...this.libros];

    // Filtro por nombre (título o autor)
    if (this.filtroNombre.trim()) {
      const busqueda = this.filtroNombre.toLowerCase().trim();
      filtrados = filtrados.filter(libro =>
        libro.titulo.toLowerCase().includes(busqueda) ||
        libro.autor.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por categoría
    if (this.filtroCategoria !== 'TODAS') {
      const categoriaId = parseInt(this.filtroCategoria);
      filtrados = filtrados.filter(libro =>
        libro.categoria && libro.categoria.id === categoriaId
      );
    }

    // Filtro por disponibilidad
    if (this.filtroDisponibilidad === 'DISPONIBLES') {
      filtrados = filtrados.filter(libro => libro.cantidadDisponible > 0);
    } else if (this.filtroDisponibilidad === 'NO_DISPONIBLES') {
      filtrados = filtrados.filter(libro => libro.cantidadDisponible === 0);
    }

    this.librosFiltrados = filtrados;
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroCategoria = 'TODAS';
    this.filtroDisponibilidad = 'TODOS';
    this.aplicarFiltros();
  }

  abrirDetalle(libro: Libro): void {
    this.selectedBook = libro;
    const modalEl = document.getElementById('bookModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  getImagenUrl(imagenUrl: string | undefined): string {
    if (!imagenUrl) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjE1MCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MaWJybzwvdGV4dD48L3N2Zz4=';
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
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIyMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjE1MCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MaWJybzwvdGV4dD48L3N2Zz4=';
    event.target.onerror = null; // Prevenir loops infinitos
  }

  prestarSeleccionado(): void {
    if (!this.selectedBook) {
      return;
    }
    if (!this.authService.isLoggedIn()) {
      // Cerrar el modal del libro si está abierto
      const modalEl = document.getElementById('bookModal');
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
      }
      // Redirigir al login
      this.alertService.warning('Sesión requerida', 'Debes iniciar sesión para prestar un libro.').then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }
    this.apiService.prestarLibro(this.selectedBook.id).subscribe({
      next: () => {
        this.cargarLibros();
        const modalEl = document.getElementById('bookModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) {
            modal.hide();
          }
        }
        this.alertService.success('Libro prestado', 'El libro ha sido prestado correctamente.');
      },
      error: err => {
        const msg = err?.error?.message || 'Error al prestar el libro.';
        this.alertService.error('Error al prestar', msg);
      }
    });
  }

  getTotalLibros(): number {
    return this.libros.length;
  }

  getLibrosDisponibles(): number {
    return this.libros.filter(l => l.cantidadDisponible > 0).length;
  }
}
