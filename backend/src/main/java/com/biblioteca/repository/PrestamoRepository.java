package com.biblioteca.repository;

import com.biblioteca.model.EstadoPrestamo;
import com.biblioteca.model.Prestamo;
import com.biblioteca.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface PrestamoRepository extends JpaRepository<Prestamo, Long> {

    List<Prestamo> findByUsuario(Usuario usuario);

    List<Prestamo> findByEstado(EstadoPrestamo estado);

    List<Prestamo> findByEstadoAndFechaLimiteBefore(EstadoPrestamo estado, LocalDate fecha);

    @Query("SELECT p FROM Prestamo p LEFT JOIN FETCH p.usuario LEFT JOIN FETCH p.libro LEFT JOIN FETCH p.libro.categoria")
    List<Prestamo> findAllWithRelations();

    @Query("SELECT p FROM Prestamo p LEFT JOIN FETCH p.usuario LEFT JOIN FETCH p.libro LEFT JOIN FETCH p.libro.categoria WHERE p.usuario = :usuario ORDER BY p.fechaPrestamo DESC")
    List<Prestamo> findByUsuarioWithRelations(Usuario usuario);

    @Query("SELECT COUNT(p) FROM Prestamo p WHERE p.libro.id = :libroId AND (p.estado = 'PRESTADO' OR p.estado = 'MULTA')")
    long countPrestamosActivosByLibroId(Long libroId);
}


