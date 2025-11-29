package com.biblioteca.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@Tag(name = "Upload", description = "Subida de archivos")
public class FileUploadController {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/imagen")
    @Operation(
        summary = "Subir imagen de libro",
        description = "Sube una imagen para usar como portada de un libro. Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB. Requiere rol ADMIN."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Imagen subida exitosamente",
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "Archivo inválido o muy grande"),
        @ApiResponse(responseCode = "403", description = "Sin permisos de administrador"),
        @ApiResponse(responseCode = "500", description = "Error al guardar la imagen")
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> uploadImagen(
        @Parameter(description = "Archivo de imagen a subir (máximo 5MB)", required = true)
        @RequestParam("file") MultipartFile file) {
        Map<String, String> response = new HashMap<>();

        try {
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("error", "El archivo debe ser una imagen");
                return ResponseEntity.badRequest().body(response);
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                response.put("error", "La imagen no puede ser mayor a 5MB");
                return ResponseEntity.badRequest().body(response);
            }

            File uploadDirectory = new File(uploadDir);
            if (!uploadDirectory.exists()) {
                uploadDirectory.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;

            Path filePath = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/" + filename;
            response.put("url", imageUrl);
            response.put("filename", filename);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("error", "Error al guardar la imagen: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

