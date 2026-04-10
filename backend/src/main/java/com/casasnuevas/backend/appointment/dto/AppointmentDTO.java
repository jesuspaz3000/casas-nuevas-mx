package com.casasnuevas.backend.appointment.dto;

import com.casasnuevas.backend.appointment.model.Appointment;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentDTO(
        UUID id,
        UUID propertyId,
        String propertyTitle,
        UUID clientId,
        String clientName,
        UUID agentId,
        String agentName,
        LocalDateTime scheduledAt,
        int durationMinutes,
        Appointment.AppointmentStatus status,
        String notes,
        LocalDateTime createdAt,
        /** Solo se informa al crear la cita; en listados suele omitirse en JSON si es null. */
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Boolean confirmationEmailSent
) {}
