package com.casasnuevas.backend.appointment.dto;

import com.casasnuevas.backend.appointment.model.Appointment;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

public record AppointmentUpdateDTO(
        @Future LocalDateTime scheduledAt,
        @Min(15) @Max(480) Integer durationMinutes,
        Appointment.AppointmentStatus status,
        String notes
) {}
