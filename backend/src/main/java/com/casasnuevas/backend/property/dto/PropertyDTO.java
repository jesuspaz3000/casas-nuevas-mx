package com.casasnuevas.backend.property.dto;

import com.casasnuevas.backend.property.model.Property;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PropertyDTO(
        UUID id,
        String title,
        String description,
        Property.PropertyType type,
        Property.PropertyStatus status,
        BigDecimal price,
        String currency,
        String street,
        String neighborhood,
        String city,
        String state,
        String zipCode,
        Integer bedrooms,
        Integer bathrooms,
        BigDecimal areaM2,
        UUID agentId,
        String agentName,
        List<PropertyPhotoDTO> photos,
        LocalDateTime createdAt
) {}
