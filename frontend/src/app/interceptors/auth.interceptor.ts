import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Acceder directamente a localStorage para evitar problemas de dependencias
    try {
      const token = localStorage.getItem('jwt');
      if (token && req.url.startsWith('http://localhost:8080')) {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('🔐 JWT agregado a la petición:', req.url);
        return next.handle(cloned);
      } else {
        console.warn('⚠️ No hay token JWT para la petición:', req.url);
      }
    } catch (e) {
      console.error('❌ Error al obtener token:', e);
    }
    return next.handle(req);
  }
}


