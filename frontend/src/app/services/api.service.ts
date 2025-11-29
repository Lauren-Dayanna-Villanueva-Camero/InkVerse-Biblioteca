import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = 'http://localhost:8080/api';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Libro {
  id: number;
  titulo: string;
  autor: string;
  descripcion: string;
  imagenUrl: string;
  cantidadTotal: number;
  cantidadDisponible: number;
  categoria?: Categoria;
}

export interface Usuario {
  id: number;
  username: string;
  password?: string; // Solo para crear/actualizar, no viene del backend
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'USUARIO';
  bloqueado: boolean;
}

export interface Prestamo {
  id: number;
  usuario: Usuario;
  libro: Libro;
  fechaPrestamo: string; // ISO date string
  fechaLimite: string; // ISO date string
  fechaDevolucion?: string; // ISO date string
  estado: 'PRESTADO' | 'MULTA' | 'DEVUELTO';
  diasRetraso?: number;
  valorMulta?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  listarLibros(): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${API_BASE}/libros`);
  }

  obtenerLibro(id: number): Observable<Libro> {
    return this.http.get<Libro>(`${API_BASE}/libros/${id}`);
  }

  prestarLibro(id: number): Observable<any> {
    return this.http.post(`${API_BASE}/libros/${id}/prestar`, {});
  }

  misPrestamos(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(`${API_BASE}/libros/mis-prestamos`);
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${API_BASE}/libros/categorias`);
  }
}


