package com.casasnuevas.backend.appointment.service;

import com.casasnuevas.backend.appointment.dto.AppointmentCreateDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentUpdateDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AppointmentService {
    List<AppointmentDTO> findAll();
    Page<AppointmentDTO> findAll(Pageable pageable);
    List<AppointmentDTO> findByAgent(UUID agentId);
    List<AppointmentDTO> findByClient(UUID clientId);
    AppointmentDTO findById(UUID id);
    AppointmentDTO create(AppointmentCreateDTO dto);
    AppointmentDTO update(UUID id, AppointmentUpdateDTO dto);
    void delete(UUID id);
}
