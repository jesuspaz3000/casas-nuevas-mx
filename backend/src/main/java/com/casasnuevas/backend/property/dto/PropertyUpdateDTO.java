package com.casasnuevas.backend.property.dto;

import com.casasnuevas.backend.property.model.Property;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record PropertyUpdateDTO(
        @Size(max = 150) String title,
        String description,
        Property.PropertyType type,
        Property.PropertyStatus status,
        @DecimalMin("0.0") BigDecimal price,
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
