package com.casasnuevas.backend.appointment.dto;

import com.casasnuevas.backend.appointment.model.Appointment;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentCreateDTO(
        @NotNull UUID propertyId,
        @NotNull UUID clientId,
        @NotNull UUID agentId,
        @NotNull @Future LocalDateTime scheduledAt,
        @NotNull Appointment.AppointmentStatus status,
        String notes
) {}
