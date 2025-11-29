package com.biblioteca.controller;

import com.biblioteca.dto.LoginRequest;
import com.biblioteca.dto.LoginResponse;
import com.biblioteca.dto.RegistroRequest;
import com.biblioteca.model.Usuario;
import com.biblioteca.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Registro y login de usuarios")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(
        summary = "Registrar un nuevo usuario",
        description = "Registra un nuevo usuario en el sistema con rol USUARIO por defecto. La contraseña se encripta automáticamente. Endpoint público."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuario registrado exitosamente",
            content = @Content(schema = @Schema(implementation = Usuario.class))),
        @ApiResponse(responseCode = "400", description = "Username o email ya existe")
    })
    public ResponseEntity<Usuario> registrar(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Datos del usuario a registrar",
            required = true,
            content = @Content(schema = @Schema(implementation = RegistroRequest.class))
        )
        @RequestBody RegistroRequest request) {
        Usuario usuario = authService.registrarUsuario(request);
        usuario.setPassword(null); // no exponer contraseña
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/login")
    @Operation(
        summary = "Iniciar sesión",
        description = "Autentica un usuario y genera un token JWT. El token debe incluirse en el header 'Authorization: Bearer {token}' para acceder a endpoints protegidos. Endpoint público."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login exitoso, se devuelve el token JWT",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))),
        @ApiResponse(responseCode = "401", description = "Credenciales inválidas"),
        @ApiResponse(responseCode = "403", description = "Usuario bloqueado")
    })
    public ResponseEntity<?> login(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Credenciales de acceso (username y password)",
            required = true,
            content = @Content(schema = @Schema(implementation = LoginRequest.class))
        )
        @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            // Verificar si es un usuario bloqueado
            if (e instanceof DisabledException) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "USUARIO_BLOQUEADO");
                error.put("message", "El usuario ha sido bloqueado. Por favor, comuníquese con el administrador.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            // Credenciales inválidas u otro error de autenticación
            Map<String, String> error = new HashMap<>();
            error.put("error", "CREDENCIALES_INVALIDAS");
            error.put("message", "Credenciales inválidas.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @PostMapping("/create-admin")
    @Operation(
        summary = "Crear el primer administrador",
        description = "Crea el primer usuario administrador del sistema. Solo funciona si no existe ningún usuario con rol ADMIN. Endpoint público."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Administrador creado exitosamente",
            content = @Content(schema = @Schema(implementation = Usuario.class))),
        @ApiResponse(responseCode = "400", description = "Ya existe un administrador o username/email ya existe")
    })
    public ResponseEntity<Usuario> crearAdmin(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Datos del administrador a crear",
            required = true,
            content = @Content(schema = @Schema(implementation = RegistroRequest.class))
        )
        @RequestBody RegistroRequest request) {
        Usuario usuario = authService.crearPrimerAdmin(request);
        usuario.setPassword(null); // no exponer contraseña
        return ResponseEntity.ok(usuario);
    }
}


