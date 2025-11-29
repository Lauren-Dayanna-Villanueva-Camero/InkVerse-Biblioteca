package com.biblioteca.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabledException(DisabledException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "USUARIO_BLOQUEADO");
        error.put("message", "El usuario ha sido bloqueado. Por favor, comuníquese con el administrador.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthenticationException(AuthenticationException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "CREDENCIALES_INVALIDAS");
        error.put("message", "Credenciales inválidas.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "SIN_PERMISOS");
        error.put("message", "No tienes permisos para realizar esta acción. Debes ser ADMIN.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalStateException(IllegalStateException e) {
        Map<String, String> error = new HashMap<>();
        String message = e.getMessage();
        // Si el mensaje contiene el prefijo específico, mantenerlo para que el frontend lo detecte
        if (message != null && message.contains("LIBRO_CON_PRESTAMOS_ACTIVOS")) {
            error.put("error", "LIBRO_CON_PRESTAMOS_ACTIVOS");
            error.put("message", message);
        } else {
            error.put("error", "ESTADO_INVALIDO");
            error.put("message", message != null ? message : "Operación no permitida en el estado actual");
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "ARGUMENTO_INVALIDO");
        error.put("message", e.getMessage() != null ? e.getMessage() : "Argumento inválido");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        Map<String, String> error = new HashMap<>();
        String message = e.getMessage();

        // Verificar si es una violación de integridad referencial relacionada con préstamos
        if (message != null && (message.contains("prestamos") || message.contains("foreign key") || message.contains("constraint"))) {
            error.put("error", "LIBRO_CON_PRESTAMOS_ACTIVOS");
            error.put("message", "El libro no puede ser eliminado porque aún se encuentran ejemplares en préstamo con algunos usuarios.");
        } else {
            error.put("error", "VIOLACION_INTEGRIDAD");
            error.put("message", "No se puede realizar la operación debido a restricciones de integridad de datos.");
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}

