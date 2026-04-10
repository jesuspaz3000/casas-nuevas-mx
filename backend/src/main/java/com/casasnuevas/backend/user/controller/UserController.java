package com.casasnuevas.backend.user.controller;

import com.casasnuevas.backend.common.util.PaginationUtils;
import com.casasnuevas.backend.user.dto.UserCreateDTO;
import com.casasnuevas.backend.user.dto.UserDTO;
import com.casasnuevas.backend.user.dto.UserUpdateDTO;
import com.casasnuevas.backend.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Gestión de usuarios y agentes — solo ADMIN. Sin limit/offset devuelve array; con ambos devuelve objeto paginado.")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar usuarios",
               description = "Sin `limit`/`offset` → array plano. Con ambos → `{ count, next, previous, results }`. Parámetro `search` filtra por nombre o email.")
    public ResponseEntity<Object> findAll(
            @Parameter(description = "Resultados por página") @RequestParam(required = false) Integer limit,
            @Parameter(description = "Desplazamiento")        @RequestParam(required = false) Integer offset,
            @Parameter(description = "Búsqueda por nombre o email") @RequestParam(required = false) String search,
            HttpServletRequest request
    ) {
        if (limit != null && offset != null) {
            PaginationUtils.validate(limit, offset);
            var page = userService.findAll(PaginationUtils.toPageable(limit, offset), search);
            return ResponseEntity.ok(PaginationUtils.build(page, limit, offset,
                    request.getRequestURL().toString(), request.getQueryString()));
        }
        return ResponseEntity.ok(userService.findAll(search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Obtener usuario por ID")
    public ResponseEntity<UserDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear usuario / agente")
    public ResponseEntity<UserDTO> create(@Valid @RequestBody UserCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(dto));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar usuario")
    public ResponseEntity<UserDTO> update(@PathVariable UUID id, @Valid @RequestBody UserUpdateDTO dto) {
        return ResponseEntity.ok(userService.update(id, dto));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activar / desactivar usuario")
    public ResponseEntity<Void> toggleActive(@PathVariable UUID id) {
        userService.toggleActive(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desactivar usuario (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
