package com.casasnuevas.backend.appointment.dto;

import com.casasnuevas.backend.appointment.model.Appointment;

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
        LocalDateTime createdAt
) {}
