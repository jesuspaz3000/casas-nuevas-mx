package com.casasnuevas.backend.client.dto;

import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.property.model.Property;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record ClientUpdateDTO(
        @Size(max = 100) String name,
        @Email @Size(max = 150) String email,
        @Size(max = 20) String phone,
        @DecimalMin("0.0") BigDecimal budgetMin,
        @DecimalMin("0.0") BigDecimal budgetMax,
        Property.PropertyType interestedType,
        @Size(max = 100) String interestedCity,
        Client.ClientStatus status,
        String notes,
        UUID agentId
) {}
