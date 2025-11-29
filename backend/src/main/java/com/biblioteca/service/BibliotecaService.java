package com.biblioteca.service;

import com.biblioteca.model.*;
import com.biblioteca.repository.LibroRepository;
import com.biblioteca.repository.PrestamoRepository;
import com.biblioteca.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BibliotecaService {

    private final LibroRepository libroRepository;
    private final PrestamoRepository prestamoRepository;
    private final UsuarioRepository usuarioRepository;

    public BibliotecaService(LibroRepository libroRepository,
                             PrestamoRepository prestamoRepository,
                             UsuarioRepository usuarioRepository) {
        this.libroRepository = libroRepository;
        this.prestamoRepository = prestamoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Libro> listarLibros() {
        return libroRepository.findAll();
    }

    public Libro obtenerLibro(Long id) {
        return libroRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Libro no encontrado"));
    }

    @Transactional
    public Prestamo prestarLibro(Long libroId, String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        Libro libro = obtenerLibro(libroId);

        if (libro.getCantidadDisponible() <= 0) {
            throw new IllegalStateException("No hay unidades disponibles");
        }

        libro.setCantidadDisponible(libro.getCantidadDisponible() - 1);
        libroRepository.save(libro);

        LocalDate hoy = LocalDate.now();
        Prestamo prestamo = new Prestamo();
        prestamo.setUsuario(usuario);
        prestamo.setLibro(libro);
        prestamo.setFechaPrestamo(hoy);
        prestamo.setFechaLimite(hoy.plusDays(7));
        prestamo.setEstado(EstadoPrestamo.PRESTADO);
        prestamo.setDiasRetraso(0);
        prestamo.setValorMulta(0);

        return prestamoRepository.save(prestamo);
    }

    @Transactional
    public Prestamo devolverLibro(Long prestamoId) {
        Prestamo prestamo = prestamoRepository.findById(prestamoId)
                .orElseThrow(() -> new IllegalArgumentException("Préstamo no encontrado"));

        if (prestamo.getEstado() == EstadoPrestamo.DEVUELTO) {
            return prestamo;
        }

        LocalDate hoy = LocalDate.now();
        prestamo.setFechaDevolucion(hoy);

        if (hoy.isAfter(prestamo.getFechaLimite())) {
            long dias = ChronoUnit.DAYS.between(prestamo.getFechaLimite(), hoy);
            int diasRetraso = (int) dias;
            prestamo.setDiasRetraso(diasRetraso);
            prestamo.setValorMulta(diasRetraso * 5000);
            prestamo.setEstado(EstadoPrestamo.MULTA);
        } else {
            prestamo.setEstado(EstadoPrestamo.DEVUELTO);
        }

        Libro libro = prestamo.getLibro();
        libro.setCantidadDisponible(libro.getCantidadDisponible() + 1);
        libroRepository.save(libro);

        return prestamoRepository.save(prestamo);
    }

    public List<Prestamo> prestamosPorUsuario(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return prestamoRepository.findByUsuarioWithRelations(usuario);
    }

    public List<Prestamo> prestamosConMulta() {
        return prestamoRepository.findByEstado(EstadoPrestamo.MULTA);
    }
}


