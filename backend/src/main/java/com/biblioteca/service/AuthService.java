package com.biblioteca.service;

import com.biblioteca.dto.LoginRequest;
import com.biblioteca.dto.LoginResponse;
import com.biblioteca.dto.RegistroRequest;
import com.biblioteca.model.Rol;
import com.biblioteca.model.Usuario;
import com.biblioteca.repository.UsuarioRepository;
import com.biblioteca.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public Usuario registrarUsuario(RegistroRequest request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("El username ya existe");
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }
        Usuario usuario = new Usuario();
        usuario.setUsername(request.getUsername());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setEmail(request.getEmail());
        usuario.setRol(Rol.USUARIO);
        usuario.setBloqueado(false);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario crearPrimerAdmin(RegistroRequest request) {
        // Solo permite crear admin si no existe ningún admin en el sistema
        boolean existeAdmin = usuarioRepository.findAll().stream()
                .anyMatch(u -> u.getRol() == Rol.ADMIN);

        if (existeAdmin) {
            throw new IllegalArgumentException("Ya existe un administrador en el sistema");
        }

        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("El username ya existe");
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(request.getUsername());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setEmail(request.getEmail());
        usuario.setRol(Rol.ADMIN);
        usuario.setBloqueado(false);
        return usuarioRepository.save(usuario);
    }

    public LoginResponse login(LoginRequest request) throws AuthenticationException {
        // Verificar primero si el usuario existe y está bloqueado
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (usuario.isBloqueado()) {
            throw new org.springframework.security.authentication.DisabledException("Usuario bloqueado");
        }

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(), request.getPassword())
        );

        String token = jwtUtil.generateToken(usuario.getUsername(), usuario.getRol().name());
        return new LoginResponse(token, usuario.getUsername(), usuario.getRol().name());
    }
}


