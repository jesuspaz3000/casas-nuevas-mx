package com.casasnuevas.backend.client.dto;

import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.property.model.Property;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ClientDTO(
        UUID id,
        String name,
        String email,
        String phone,
        BigDecimal budgetMin,
        BigDecimal budgetMax,
        Property.PropertyType interestedType,
        String interestedCity,
        Client.ClientStatus status,
        String notes,
        UUID agentId,
        String agentName,
        LocalDateTime createdAt
) {}
