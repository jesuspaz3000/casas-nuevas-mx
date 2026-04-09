package com.casasnuevas.backend.property.dto;

import java.util.UUID;

public record PropertyPhotoDTO(
        UUID id,
        String url,
        boolean isCover,
        Integer sortOrder
) {}
