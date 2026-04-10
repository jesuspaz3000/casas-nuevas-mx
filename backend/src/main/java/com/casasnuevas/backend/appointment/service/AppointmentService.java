package com.casasnuevas.backend.appointment.service;

import com.casasnuevas.backend.appointment.dto.AppointmentCreateDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentFilterDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentUpdateDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentService {
    List<AppointmentDTO> findAll();
    List<AppointmentDTO> findAll(AppointmentFilterDTO filter);
    Page<AppointmentDTO> findAll(Pageable pageable);
    Page<AppointmentDTO> findAll(AppointmentFilterDTO filter, Pageable pageable);
    List<AppointmentDTO> findByAgent(UUID agentId);
    List<AppointmentDTO> findByClient(UUID clientId);
    List<AppointmentDTO> findCalendar(UUID agentId, LocalDateTime from, LocalDateTime to);
    AppointmentDTO findById(UUID id);
    AppointmentDTO create(AppointmentCreateDTO dto);
    AppointmentDTO update(UUID id, AppointmentUpdateDTO dto);
    void delete(UUID id);

    /** Reenvía al cliente el mismo correo de confirmación de cita (datos actuales de la cita). */
    void resendConfirmationEmail(UUID id);
}
