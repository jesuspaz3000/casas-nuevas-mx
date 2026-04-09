package com.casasnuevas.backend.property.dto;

import com.casasnuevas.backend.property.model.Property;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record PropertyCreateDTO(
        @NotBlank @Size(max = 150) String title,
        String description,
        @NotNull Property.PropertyType type,
        @NotNull Property.PropertyStatus status,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @Size(max = 3) String currency,
        @Size(max = 200) String street,
        @Size(max = 100) String neighborhood,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 10) String zipCode,
        @Min(0) Integer bedrooms,
        @Min(0) Integer bathrooms,
        @DecimalMin("0.0") BigDecimal areaM2,
        UUID agentId
) {}
