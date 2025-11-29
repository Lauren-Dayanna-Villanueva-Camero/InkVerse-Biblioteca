package com.biblioteca.controller;

import com.biblioteca.model.Categoria;
import com.biblioteca.model.Libro;
import com.biblioteca.model.Prestamo;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.service.BibliotecaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/libros")
@Tag(name = "Libros", description = "Gestión de libros y préstamos")
public class LibroController {

    private final BibliotecaService bibliotecaService;
    private final CategoriaRepository categoriaRepository;

    public LibroController(BibliotecaService bibliotecaService, CategoriaRepository categoriaRepository) {
        this.bibliotecaService = bibliotecaService;
        this.categoriaRepository = categoriaRepository;
    }

    @GetMapping
    @Operation(
        summary = "Listar todos los libros",
        description = "Obtiene la lista completa de todos los libros disponibles en el catálogo. Endpoint público, no requiere autenticación."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de libros obtenida exitosamente")
    })
    public ResponseEntity<List<Libro>> listarLibros() {
        return ResponseEntity.ok(bibliotecaService.listarLibros());
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Obtener detalle de un libro",
        description = "Obtiene los detalles completos de un libro específico por su ID, incluyendo información de disponibilidad. Endpoint público, no requiere autenticación."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Libro encontrado",
            content = @Content(schema = @Schema(implementation = Libro.class))),
        @ApiResponse(responseCode = "404", description = "Libro no encontrado")
    })
    public ResponseEntity<Libro> obtenerLibro(
        @Parameter(description = "ID del libro", required = true, example = "1")
        @PathVariable Long id) {
        return ResponseEntity.ok(bibliotecaService.obtenerLibro(id));
    }

    @PostMapping("/{id}/prestar")
    @Operation(
        summary = "Prestar un libro",
        description = "Solicita el préstamo de un libro. Requiere autenticación. El libro debe tener ejemplares disponibles. El préstamo se establece por 15 días."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Libro prestado exitosamente",
            content = @Content(schema = @Schema(implementation = Prestamo.class))),
        @ApiResponse(responseCode = "400", description = "Libro no disponible o no encontrado"),
        @ApiResponse(responseCode = "401", description = "No autenticado"),
        @ApiResponse(responseCode = "403", description = "Usuario bloqueado")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Prestamo> prestarLibro(
        @Parameter(description = "ID del libro a prestar", required = true, example = "1")
        @PathVariable Long id,
        Authentication authentication) {
        String username = authentication.getName();
        Prestamo prestamo = bibliotecaService.prestarLibro(id, username);
        return ResponseEntity.ok(prestamo);
    }

    @GetMapping("/mis-prestamos")
    @Operation(
        summary = "Obtener préstamos del usuario actual",
        description = "Obtiene el historial completo de préstamos del usuario autenticado, incluyendo activos, devueltos y con multa. Requiere autenticación."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de préstamos obtenida exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autenticado")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<Prestamo>> misPrestamos(Authentication authentication) {
        String username = authentication.getName();
        List<Prestamo> prestamos = bibliotecaService.prestamosPorUsuario(username);
        prestamos.forEach(p -> {
            if (p.getUsuario() != null && p.getUsuario().getPassword() != null) {
                p.getUsuario().setPassword(null);
            }
        });
        return ResponseEntity.ok(prestamos);
    }

    @GetMapping("/categorias")
    @Operation(
        summary = "Listar todas las categorías",
        description = "Obtiene la lista completa de todas las categorías disponibles para clasificar libros. Endpoint público, no requiere autenticación."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de categorías obtenida exitosamente")
    })
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(categoriaRepository.findAll());
    }
}


