package com.biblioteca.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "libros")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Libro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private String autor;

    @Column(length = 1000)
    private String descripcion;

    private String imagenUrl;

    @Column(nullable = false)
    private int cantidadTotal;

    @Column(nullable = false)
    private int cantidadDisponible;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;
}


