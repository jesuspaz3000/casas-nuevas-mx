package com.casasnuevas.backend.appointment.service.Impl;

import com.casasnuevas.backend.appointment.dto.AppointmentCreateDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentUpdateDTO;
import com.casasnuevas.backend.appointment.model.Appointment;
import com.casasnuevas.backend.appointment.repository.AppointmentRepository;
import com.casasnuevas.backend.appointment.service.AppointmentService;
import com.casasnuevas.backend.client.repository.ClientRepository;
import com.casasnuevas.backend.common.exception.ResourceNotFoundException;
import com.casasnuevas.backend.notification.EmailService;
import com.casasnuevas.backend.property.repository.PropertyRepository;
import com.casasnuevas.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PropertyRepository propertyRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    public List<AppointmentDTO> findAll() {
        return appointmentRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    public Page<AppointmentDTO> findAll(Pageable pageable) {
        return appointmentRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    public List<AppointmentDTO> findByAgent(UUID agentId) {
        return appointmentRepository.findByAgentId(agentId).stream().map(this::toDTO).toList();
    }

    @Override
    public List<AppointmentDTO> findByClient(UUID clientId) {
        return appointmentRepository.findByClientId(clientId).stream().map(this::toDTO).toList();
    }

    @Override
    public AppointmentDTO findById(UUID id) {
        return toDTO(getOrThrow(id));
    }

    @Override
    @Transactional
    public AppointmentDTO create(AppointmentCreateDTO dto) {
        Appointment appointment = Appointment.builder()
                .property(propertyRepository.findById(dto.propertyId())
                        .orElseThrow(() -> new ResourceNotFoundException("Property", dto.propertyId())))
                .client(clientRepository.findById(dto.clientId())
                        .orElseThrow(() -> new ResourceNotFoundException("Client", dto.clientId())))
                .agent(userRepository.findById(dto.agentId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId())))
                .scheduledAt(dto.scheduledAt())
                .status(dto.status())
                .notes(dto.notes())
                .build();
        AppointmentDTO result = toDTO(appointmentRepository.save(appointment));

        emailService.sendAppointmentConfirmation(
                appointment.getClient().getEmail(),
                appointment.getClient().getName(),
                appointment.getProperty().getTitle(),
                appointment.getAgent().getName(),
                appointment.getScheduledAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
        );

        return result;
    }

    @Override
    @Transactional
    public AppointmentDTO update(UUID id, AppointmentUpdateDTO dto) {
        Appointment appointment = getOrThrow(id);
        if (dto.scheduledAt() != null) appointment.setScheduledAt(dto.scheduledAt());
        if (dto.status() != null)      appointment.setStatus(dto.status());
        if (dto.notes() != null)       appointment.setNotes(dto.notes());
        return toDTO(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Appointment appointment = getOrThrow(id);
        appointment.setDeletedAt(LocalDateTime.now());
        appointmentRepository.save(appointment);
    }

    private Appointment getOrThrow(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    private AppointmentDTO toDTO(Appointment a) {
        return new AppointmentDTO(
                a.getId(),
                a.getProperty().getId(), a.getProperty().getTitle(),
                a.getClient().getId(),   a.getClient().getName(),
                a.getAgent().getId(),    a.getAgent().getName(),
                a.getScheduledAt(), a.getStatus(), a.getNotes(),
                a.getCreatedAt()
        );
    }
}
