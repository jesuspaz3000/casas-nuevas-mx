package com.casasnuevas.backend.auth.controller;

import com.casasnuevas.backend.auth.dto.AuthResponse;
import com.casasnuevas.backend.auth.dto.LoginRequest;
import com.casasnuevas.backend.auth.service.AuthService;
import com.casasnuevas.backend.user.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Login, logout y usuario actual")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Iniciar sesión", description = "Devuelve info del usuario y setea cookies httpOnly con los tokens")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.login(request, response));
    }

    @Operation(summary = "Refrescar access token", description = "Usa el refresh_token cookie para emitir un nuevo access_token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.refresh(request, response));
    }

    @Operation(summary = "Cerrar sesión", description = "Invalida el token en Redis y limpia las cookies")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Usuario actual", description = "Retorna la info del usuario autenticado")
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole())
        );
    }
}
