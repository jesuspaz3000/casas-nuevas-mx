package com.casasnuevas.backend.auth.dto;

import com.casasnuevas.backend.user.model.User;

import java.util.UUID;

/**
 * Respuesta de login. Los tokens NO van en el body — viajan en cookies httpOnly.
 * Solo se expone info del usuario para que el frontend sepa con quién está logueado.
 */
public record AuthResponse(
        UUID id,
        String name,
        String email,
        User.Role role
) {}
