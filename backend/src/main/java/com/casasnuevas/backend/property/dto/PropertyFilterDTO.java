package com.casasnuevas.backend.property.dto;

import com.casasnuevas.backend.property.model.Property;

import java.math.BigDecimal;

public record PropertyFilterDTO(
        Property.PropertyType type,
        Property.PropertyStatus status,
        String city,
        String neighborhood,
        BigDecimal priceMin,
        BigDecimal priceMax,
        Integer bedroomsMin,
        Integer bathroomsMin,
        BigDecimal areaM2Min
) {}
