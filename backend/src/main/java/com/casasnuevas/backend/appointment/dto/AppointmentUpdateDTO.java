package com.casasnuevas.backend.appointment.dto;

import com.casasnuevas.backend.appointment.model.Appointment;
import jakarta.validation.constraints.Future;

import java.time.LocalDateTime;

public record AppointmentUpdateDTO(
        @Future LocalDateTime scheduledAt,
        Appointment.AppointmentStatus status,
        String notes
) {}
