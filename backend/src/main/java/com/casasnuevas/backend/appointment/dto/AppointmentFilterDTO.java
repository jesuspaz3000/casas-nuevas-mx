package com.casasnuevas.backend.appointment.dto;

import com.casasnuevas.backend.appointment.model.Appointment;

public record AppointmentFilterDTO(
        String search,
        Appointment.AppointmentStatus status
) {}
