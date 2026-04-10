package com.casasnuevas.backend.appointment.dto;

import com.casasnuevas.backend.appointment.model.Appointment;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentCreateDTO(
        @NotNull UUID propertyId,
        @NotNull UUID clientId,
        @NotNull UUID agentId,
        @NotNull @Future LocalDateTime scheduledAt,
        @Min(15) @Max(480) Integer durationMinutes,
        @NotNull Appointment.AppointmentStatus status,
        String notes
) {}
