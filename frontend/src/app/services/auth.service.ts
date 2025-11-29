import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const API_BASE = 'http://localhost:8080/api';

interface LoginResponse {
  token: string;
  username: string;
  rol: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  nombre: string;
  apellido: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'jwt';
  private readonly USERNAME_KEY = 'username';
  private readonly ROL_KEY = 'rol';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE}/auth/login`, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USERNAME_KEY, res.username);
          localStorage.setItem(this.ROL_KEY, res.rol);
        })
      );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${API_BASE}/auth/register`, data);
  }

  crearAdmin(data: RegisterRequest): Observable<any> {
    return this.http.post(`${API_BASE}/auth/create-admin`, data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.ROL_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  getRol(): string | null {
    return localStorage.getItem(this.ROL_KEY);
  }

  isAdmin(): boolean {
    return this.getRol() === 'ADMIN';
  }
}


