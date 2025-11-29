import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // Configuración por defecto con la paleta azul
  private defaultConfig = {
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6c757d',
    buttonsStyling: true,
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary'
    }
  };

  // Alerta de éxito
  success(title: string, message?: string, timer: number = 2000): Promise<any> {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'success',
      title: title,
      text: message,
      timer: timer,
      showConfirmButton: timer === 0,
      confirmButtonText: 'Aceptar'
    });
  }

  // Alerta de error
  error(title: string, message?: string): Promise<any> {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: 'Aceptar'
    });
  }

  // Alerta de advertencia
  warning(title: string, message?: string): Promise<any> {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonText: 'Aceptar'
    });
  }

  // Alerta de información
  info(title: string, message?: string): Promise<any> {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'info',
      title: title,
      text: message,
      confirmButtonText: 'Aceptar'
    });
  }

  // Confirmación
  confirm(
    title: string,
    message?: string,
    confirmText: string = 'Sí, confirmar',
    cancelText: string = 'Cancelar'
  ): Promise<boolean> {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'question',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true
    }).then((result) => {
      return result.isConfirmed;
    });
  }

  // Alerta simple (reemplazo directo de alert())
  alert(title: string, message?: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info'): Promise<any> {
    return Swal.fire({
      ...this.defaultConfig,
      icon: icon,
      title: title,
      text: message,
      confirmButtonText: 'Aceptar'
    });
  }

  // Loading
  loading(title: string = 'Cargando...'): void {
    Swal.fire({
      title: title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Cerrar cualquier alerta abierta
  close(): void {
    Swal.close();
  }
}



