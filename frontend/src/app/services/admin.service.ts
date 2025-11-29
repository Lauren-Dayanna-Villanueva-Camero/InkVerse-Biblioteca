import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Libro, Categoria, Usuario, Prestamo } from './api.service';

const API_BASE = 'http://localhost:8080/api';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  // CRUD Libros
  listarLibros(): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${API_BASE}/admin/libros`);
  }

  obtenerLibro(id: number): Observable<Libro> {
    return this.http.get<Libro>(`${API_BASE}/admin/libros/${id}`);
  }

  crearLibro(libro: Libro): Observable<Libro> {
    return this.http.post<Libro>(`${API_BASE}/admin/libros`, libro);
  }

  actualizarLibro(id: number, libro: Libro): Observable<Libro> {
    return this.http.put<Libro>(`${API_BASE}/admin/libros/${id}`, libro);
  }

  eliminarLibro(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/admin/libros/${id}`);
  }

  // CRUD Categorías
  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${API_BASE}/admin/categorias`);
  }

  obtenerCategoria(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${API_BASE}/admin/categorias/${id}`);
  }

  crearCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${API_BASE}/admin/categorias`, categoria);
  }

  actualizarCategoria(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${API_BASE}/admin/categorias/${id}`, categoria);
  }

  eliminarCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/admin/categorias/${id}`);
  }

  // CRUD Usuarios
  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API_BASE}/admin/usuarios`);
  }

  obtenerUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${API_BASE}/admin/usuarios/${id}`);
  }

  crearUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${API_BASE}/admin/usuarios`, usuario);
  }

  actualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${API_BASE}/admin/usuarios/${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/admin/usuarios/${id}`);
  }

  // CRUD Préstamos
  listarPrestamos(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(`${API_BASE}/admin/prestamos`);
  }

  listarPrestamosActivos(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(`${API_BASE}/admin/prestamos/activos`);
  }

  listarPrestamosConMulta(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(`${API_BASE}/admin/prestamos/multas`);
  }

  recibirLibro(prestamoId: number): Observable<Prestamo> {
    return this.http.put<Prestamo>(`${API_BASE}/admin/prestamos/${prestamoId}/devolver`, {});
  }

  actualizarMultas(): Observable<string> {
    return this.http.put<string>(`${API_BASE}/admin/prestamos/actualizar-multas`, {}, {
      responseType: 'text' as 'json'
    });
  }

  pagarMulta(prestamoId: number): Observable<Prestamo> {
    return this.http.put<Prestamo>(`${API_BASE}/admin/prestamos/${prestamoId}/pagar-multa`, {});
  }

  // Subir imagen
  subirImagen(file: File): Observable<{url: string, filename: string}> {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${API_BASE}/upload/imagen`;
    console.log('📤 Subiendo imagen a:', url);
    return this.http.post<{url: string, filename: string}>(url, formData);
  }
}

