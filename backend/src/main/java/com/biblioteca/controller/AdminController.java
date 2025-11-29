package com.biblioteca.controller;

import com.biblioteca.model.Categoria;
import com.biblioteca.model.Libro;
import com.biblioteca.model.Prestamo;
import com.biblioteca.model.Usuario;
import com.biblioteca.model.Rol;
import com.biblioteca.model.EstadoPrestamo;
import com.biblioteca.repository.CategoriaRepository;
import com.biblioteca.repository.LibroRepository;
import com.biblioteca.repository.UsuarioRepository;
import com.biblioteca.repository.PrestamoRepository;
import com.biblioteca.service.BibliotecaService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administrador", description = "Operaciones de administración")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final BibliotecaService bibliotecaService;
    private final CategoriaRepository categoriaRepository;
    private final LibroRepository libroRepository;
    private final UsuarioRepository usuarioRepository;
    private final PrestamoRepository prestamoRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(BibliotecaService bibliotecaService,
                           CategoriaRepository categoriaRepository,
                           LibroRepository libroRepository,
                           UsuarioRepository usuarioRepository,
                           PrestamoRepository prestamoRepository,
                           PasswordEncoder passwordEncoder) {
        this.bibliotecaService = bibliotecaService;
        this.categoriaRepository = categoriaRepository;
        this.libroRepository = libroRepository;
        this.usuarioRepository = usuarioRepository;
        this.prestamoRepository = prestamoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/categorias")
    @Operation(
        summary = "Crear categoría de libro",
        description = "Crea una nueva categoría para clasificar libros. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Categoría creada exitosamente",
            content = @Content(schema = @Schema(implementation = Categoria.class))),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<Categoria> crearCategoria(
        @Parameter(description = "Datos de la categoría a crear", required = true)
        @RequestBody Categoria categoria) {
        return ResponseEntity.ok(categoriaRepository.save(categoria));
    }

    @GetMapping("/categorias")
    @Operation(
        summary = "Listar todas las categorías",
        description = "Obtiene la lista completa de categorías disponibles. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de categorías obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(categoriaRepository.findAll());
    }

    @GetMapping("/categorias/{id}")
    @Operation(
        summary = "Obtener categoría por ID",
        description = "Obtiene los detalles de una categoría específica por su ID. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Categoría encontrada",
            content = @Content(schema = @Schema(implementation = Categoria.class))),
        @ApiResponse(responseCode = "404", description = "Categoría no encontrada"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Categoria> obtenerCategoria(
        @Parameter(description = "ID de la categoría", required = true, example = "1")
        @PathVariable Long id) {
        return ResponseEntity.ok(categoriaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada")));
    }

    @PutMapping("/categorias/{id}")
    @Operation(
        summary = "Actualizar categoría",
        description = "Actualiza el nombre de una categoría existente. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Categoría actualizada exitosamente",
            content = @Content(schema = @Schema(implementation = Categoria.class))),
        @ApiResponse(responseCode = "404", description = "Categoría no encontrada"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Categoria> actualizarCategoria(
        @Parameter(description = "ID de la categoría a actualizar", required = true, example = "1")
        @PathVariable Long id,
        @Parameter(description = "Datos actualizados de la categoría", required = true)
        @RequestBody Categoria categoria) {
        Categoria existente = categoriaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));

        existente.setNombre(categoria.getNombre());
        return ResponseEntity.ok(categoriaRepository.save(existente));
    }

    @DeleteMapping("/categorias/{id}")
    @Operation(
        summary = "Eliminar categoría",
        description = "Elimina una categoría. No se puede eliminar si tiene libros asociados. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Categoría eliminada exitosamente"),
        @ApiResponse(responseCode = "404", description = "Categoría no encontrada"),
        @ApiResponse(responseCode = "400", description = "No se puede eliminar porque tiene libros asociados"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Void> eliminarCategoria(
        @Parameter(description = "ID de la categoría a eliminar", required = true, example = "1")
        @PathVariable Long id) {
        if (!categoriaRepository.existsById(id)) {
            throw new IllegalArgumentException("Categoría no encontrada");
        }
        long librosConCategoria = libroRepository.countByCategoriaId(id);
        if (librosConCategoria > 0) {
            throw new IllegalStateException("No se puede eliminar la categoría porque tiene " + librosConCategoria + " libro(s) asociado(s)");
        }
        categoriaRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/libros")
    @Operation(
        summary = "Registrar nuevo libro",
        description = "Crea un nuevo libro en el catálogo. Si no se especifica cantidad disponible, se establece igual a la cantidad total. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Libro creado exitosamente",
            content = @Content(schema = @Schema(implementation = Libro.class))),
        @ApiResponse(responseCode = "400", description = "Datos inválidos o categoría no encontrada"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Libro> crearLibro(
        @Parameter(description = "Datos del libro a crear", required = true)
        @RequestBody Libro libro) {
        if (libro.getCantidadDisponible() == 0) {
            libro.setCantidadDisponible(libro.getCantidadTotal());
        }
        if (libro.getCategoria() != null && libro.getCategoria().getId() != null) {
            Categoria categoria = categoriaRepository.findById(libro.getCategoria().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + libro.getCategoria().getId()));
            libro.setCategoria(categoria);
        } else {
            libro.setCategoria(null);
        }
        return ResponseEntity.ok(libroRepository.save(libro));
    }

    @GetMapping("/libros")
    @Operation(
        summary = "Listar todos los libros (admin)",
        description = "Obtiene la lista completa de todos los libros del catálogo. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de libros obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<List<Libro>> listarLibros() {
        return ResponseEntity.ok(libroRepository.findAll());
    }

    @GetMapping("/libros/{id}")
    @Operation(
        summary = "Obtener libro por ID",
        description = "Obtiene los detalles completos de un libro específico por su ID. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Libro encontrado",
            content = @Content(schema = @Schema(implementation = Libro.class))),
        @ApiResponse(responseCode = "404", description = "Libro no encontrado"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Libro> obtenerLibro(
        @Parameter(description = "ID del libro", required = true, example = "1")
        @PathVariable Long id) {
        return ResponseEntity.ok(libroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Libro no encontrado")));
    }

    @PutMapping("/libros/{id}")
    @Operation(
        summary = "Actualizar libro",
        description = "Actualiza la información de un libro existente. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Libro actualizado exitosamente",
            content = @Content(schema = @Schema(implementation = Libro.class))),
        @ApiResponse(responseCode = "404", description = "Libro no encontrado"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos o categoría no encontrada"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Libro> actualizarLibro(
        @Parameter(description = "ID del libro a actualizar", required = true, example = "1")
        @PathVariable Long id,
        @Parameter(description = "Datos actualizados del libro", required = true)
        @RequestBody Libro libro) {
        Libro existente = libroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Libro no encontrado"));

        existente.setTitulo(libro.getTitulo());
        existente.setAutor(libro.getAutor());
        existente.setDescripcion(libro.getDescripcion());
        existente.setImagenUrl(libro.getImagenUrl());
        existente.setCantidadTotal(libro.getCantidadTotal());
        existente.setCantidadDisponible(libro.getCantidadDisponible());

        if (libro.getCategoria() != null && libro.getCategoria().getId() != null) {
            Categoria categoria = categoriaRepository.findById(libro.getCategoria().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + libro.getCategoria().getId()));
            existente.setCategoria(categoria);
        } else {
            existente.setCategoria(null);
        }

        return ResponseEntity.ok(libroRepository.save(existente));
    }

    @DeleteMapping("/libros/{id}")
    @Operation(
        summary = "Eliminar libro",
        description = "Elimina un libro del catálogo. No se puede eliminar si tiene préstamos activos (PRESTADO o MULTA). Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Libro eliminado exitosamente"),
        @ApiResponse(responseCode = "404", description = "Libro no encontrado"),
        @ApiResponse(responseCode = "400", description = "No se puede eliminar porque tiene préstamos activos"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Void> eliminarLibro(
        @Parameter(description = "ID del libro a eliminar", required = true, example = "1")
        @PathVariable Long id) {
        if (!libroRepository.existsById(id)) {
            throw new IllegalArgumentException("Libro no encontrado");
        }

        // Verificar si hay préstamos activos (PRESTADO o MULTA)
        long prestamosActivos = prestamoRepository.countPrestamosActivosByLibroId(id);
        if (prestamosActivos > 0) {
            throw new IllegalStateException("LIBRO_CON_PRESTAMOS_ACTIVOS: El libro no puede ser eliminado porque aún se encuentran " + prestamosActivos + " ejemplar(es) en préstamo con algunos usuarios.");
        }

        libroRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/prestamos")
    @Operation(
        summary = "Ver todos los préstamos",
        description = "Obtiene la lista completa de todos los préstamos del sistema, incluyendo devueltos, activos y con multa. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de préstamos obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<List<Prestamo>> listarPrestamos() {

        List<Prestamo> prestamos = prestamoRepository.findAllWithRelations();
        System.out.println("Total de prestamos encontrados: " + prestamos.size());

        prestamos.forEach(p -> {
            if (p.getUsuario() != null) {
                if (p.getUsuario().getPassword() != null) {
                    p.getUsuario().setPassword(null);
                }
                System.out.println("  - Préstamo ID: " + p.getId() +
                    ", Usuario: " + p.getUsuario().getUsername() +
                    ", Libro: " + (p.getLibro() != null ? p.getLibro().getTitulo() : "null") +
                    ", Estado: " + p.getEstado());
            }
        });

        return ResponseEntity.ok(prestamos);
    }

    @GetMapping("/prestamos/multas")
    @Operation(
        summary = "Ver préstamos con multa",
        description = "Obtiene la lista de préstamos que tienen multa pendiente (estado MULTA). Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de préstamos con multa obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<List<Prestamo>> listarPrestamosConMulta() {
        return ResponseEntity.ok(bibliotecaService.prestamosConMulta());
    }

    @GetMapping("/prestamos/activos")
    @Operation(
        summary = "Ver préstamos activos",
        description = "Obtiene la lista de préstamos activos (estado PRESTADO o MULTA, excluyendo DEVUELTO). Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de préstamos activos obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<List<Prestamo>> listarPrestamosActivos() {
        List<Prestamo> activos = prestamoRepository.findAll().stream()
                .filter(p -> p.getEstado() != EstadoPrestamo.DEVUELTO)
                .toList();
        return ResponseEntity.ok(activos);
    }

    @PutMapping("/prestamos/{id}/devolver")
    @Operation(
        summary = "Recibir libro prestado",
        description = "Marca un préstamo como devuelto. Calcula automáticamente multa si hay retraso. Incrementa la cantidad disponible del libro. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Libro recibido exitosamente",
            content = @Content(schema = @Schema(implementation = Prestamo.class))),
        @ApiResponse(responseCode = "404", description = "Préstamo no encontrado"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Prestamo> recibirLibro(
        @Parameter(description = "ID del préstamo", required = true, example = "1")
        @PathVariable Long id) {
        Prestamo prestamo = bibliotecaService.devolverLibro(id);
        return ResponseEntity.ok(prestamo);
    }

    @GetMapping("/prestamos/diagnostico")
    @Operation(
        summary = "Diagnóstico de autenticación",
        description = "Endpoint de diagnóstico para verificar el estado de autenticación y roles del usuario actual. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Información de autenticación"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<String> diagnostico() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            return ResponseEntity.ok("Autenticado: " + auth.getName() +
                ", Roles: " + auth.getAuthorities());
        }
        return ResponseEntity.ok("No autenticado");
    }

    @PutMapping("/prestamos/actualizar-multas")
    @Operation(
        summary = "Actualizar multas de préstamos vencidos",
        description = "Calcula y actualiza automáticamente las multas de todos los préstamos que han vencido. La multa es de 5000 por día de retraso. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Multas actualizadas exitosamente",
            content = @Content(schema = @Schema(implementation = String.class))),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<String> actualizarMultas() {
        LocalDate hoy = LocalDate.now();
        int actualizados = 0;
        int multaPorDia = 5000;

        List<Prestamo> prestamosPendientes = prestamoRepository.findAll().stream()
                .filter(p -> p.getEstado() == EstadoPrestamo.PRESTADO)
                .filter(p -> hoy.isAfter(p.getFechaLimite()))
                .toList();

        for (Prestamo prestamo : prestamosPendientes) {
            long diasRetraso = ChronoUnit.DAYS.between(prestamo.getFechaLimite(), hoy);
            int diasRetrasoInt = (int) diasRetraso;
            int multaTotal = diasRetrasoInt * multaPorDia;

            prestamo.setDiasRetraso(diasRetrasoInt);
            prestamo.setValorMulta(multaTotal);
            prestamo.setEstado(EstadoPrestamo.MULTA);
            prestamoRepository.save(prestamo);
            actualizados++;
        }

        return ResponseEntity.ok("Se actualizaron " + actualizados + " préstamo(s) con multa");
    }

    @PutMapping("/prestamos/{id}/pagar-multa")
    @Operation(
        summary = "Marcar multa como pagada",
        description = "Marca una multa como pagada y devuelve el libro. El valor de la multa se conserva en el historial. Incrementa la cantidad disponible del libro. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Multa pagada exitosamente",
            content = @Content(schema = @Schema(implementation = Prestamo.class))),
        @ApiResponse(responseCode = "404", description = "Préstamo no encontrado"),
        @ApiResponse(responseCode = "400", description = "El préstamo no tiene multa pendiente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Prestamo> pagarMulta(
        @Parameter(description = "ID del préstamo con multa", required = true, example = "1")
        @PathVariable Long id) {
        Prestamo prestamo = prestamoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado"));

        if (prestamo.getEstado() != EstadoPrestamo.MULTA) {
            throw new IllegalStateException("Este préstamo no tiene multa pendiente");
        }

        int valorMultaPagada = prestamo.getValorMulta() != null ? prestamo.getValorMulta() : 0;

        prestamo.setFechaDevolucion(LocalDate.now());
        prestamo.setEstado(EstadoPrestamo.DEVUELTO);

        Libro libro = prestamo.getLibro();
        libro.setCantidadDisponible(libro.getCantidadDisponible() + 1);
        libroRepository.save(libro);

        Prestamo prestamoGuardado = prestamoRepository.save(prestamo);
        System.out.println("Multa pagada - Prestamo ID: " + prestamoGuardado.getId() +
                          ", Valor multa: " + prestamoGuardado.getValorMulta() +
                          ", Estado: " + prestamoGuardado.getEstado());

        return ResponseEntity.ok(prestamoGuardado);
    }

    // CRUD Usuarios
    @GetMapping("/usuarios")
    @Operation(
        summary = "Listar todos los usuarios",
        description = "Obtiene la lista completa de todos los usuarios del sistema. Las contraseñas no se incluyen en la respuesta. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de usuarios obtenida exitosamente"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/usuarios/{id}")
    @Operation(
        summary = "Obtener usuario por ID",
        description = "Obtiene los detalles de un usuario específico por su ID. La contraseña no se incluye en la respuesta. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuario encontrado",
            content = @Content(schema = @Schema(implementation = Usuario.class))),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Usuario> obtenerUsuario(
        @Parameter(description = "ID del usuario", required = true, example = "1")
        @PathVariable Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setPassword(null);
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/usuarios")
    @Operation(
        summary = "Crear nuevo usuario",
        description = "Crea un nuevo usuario en el sistema. Si no se especifica rol, se asigna USUARIO por defecto. La contraseña se encripta automáticamente. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuario creado exitosamente",
            content = @Content(schema = @Schema(implementation = Usuario.class))),
        @ApiResponse(responseCode = "400", description = "Username o email ya existe"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Usuario> crearUsuario(
        @Parameter(description = "Datos del usuario a crear", required = true)
        @RequestBody Usuario usuario) {
        if (usuarioRepository.existsByUsername(usuario.getUsername())) {
            throw new IllegalArgumentException("El username ya existe");
        }
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        if (usuario.getPassword() != null && !usuario.getPassword().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        }

        if (usuario.getRol() == null) {
            usuario.setRol(Rol.USUARIO);
        }
        Usuario guardado = usuarioRepository.save(usuario);
        guardado.setPassword(null); // No exponer contraseña
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/usuarios/{id}")
    @Operation(
        summary = "Actualizar usuario",
        description = "Actualiza la información de un usuario existente. Si se proporciona contraseña, se encripta. Permite cambiar rol y estado de bloqueo. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuario actualizado exitosamente",
            content = @Content(schema = @Schema(implementation = Usuario.class))),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado"),
        @ApiResponse(responseCode = "400", description = "Username o email ya existe"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Usuario> actualizarUsuario(
        @Parameter(description = "ID del usuario a actualizar", required = true, example = "1")
        @PathVariable Long id,
        @Parameter(description = "Datos actualizados del usuario", required = true)
        @RequestBody Usuario usuario) {
        Usuario existente = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!existente.getUsername().equals(usuario.getUsername()) &&
            usuarioRepository.existsByUsername(usuario.getUsername())) {
            throw new IllegalArgumentException("El username ya existe");
        }

        if (!existente.getEmail().equals(usuario.getEmail()) &&
            usuarioRepository.existsByEmail(usuario.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        existente.setUsername(usuario.getUsername());
        existente.setNombre(usuario.getNombre());
        existente.setApellido(usuario.getApellido());
        existente.setEmail(usuario.getEmail());
        existente.setRol(usuario.getRol());
        existente.setBloqueado(usuario.isBloqueado());

        if (usuario.getPassword() != null && !usuario.getPassword().isEmpty()) {
            existente.setPassword(passwordEncoder.encode(usuario.getPassword()));
        }

        Usuario actualizado = usuarioRepository.save(existente);
        actualizado.setPassword(null); // No exponer contraseña
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/usuarios/{id}")
    @Operation(
        summary = "Eliminar usuario",
        description = "Elimina permanentemente un usuario del sistema. El historial de préstamos se mantiene. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Usuario eliminado exitosamente"),
        @ApiResponse(responseCode = "404", description = "Usuario no encontrado"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador")
    })
    public ResponseEntity<Void> eliminarUsuario(
        @Parameter(description = "ID del usuario a eliminar", required = true, example = "1")
        @PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}


