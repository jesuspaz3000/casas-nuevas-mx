package com.casasnuevas.backend.user.dto;

import com.casasnuevas.backend.user.model.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String name,
        String email,
        User.Role role,
        boolean isActive,
        LocalDateTime createdAt
) {}
