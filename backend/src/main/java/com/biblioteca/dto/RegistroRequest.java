package com.biblioteca.dto;

import lombok.Data;

@Data
public class RegistroRequest {
    private String username;
    private String password;
    private String nombre;
    private String apellido;
    private String email;
}


