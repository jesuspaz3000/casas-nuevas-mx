package com.casasnuevas.backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UserUpdateDTO(
        @Size(max = 100) String name,
        @Email @Size(max = 150) String email,
        @Size(min = 8, max = 255) String password
) {}
