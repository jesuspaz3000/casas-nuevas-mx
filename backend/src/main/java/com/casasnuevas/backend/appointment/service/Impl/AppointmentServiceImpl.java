package com.casasnuevas.backend.appointment.service.Impl;

import com.casasnuevas.backend.appointment.dto.AppointmentCreateDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentFilterDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentUpdateDTO;
import com.casasnuevas.backend.appointment.model.Appointment;
import com.casasnuevas.backend.appointment.repository.AppointmentRepository;
import com.casasnuevas.backend.appointment.repository.AppointmentSpecification;
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
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    /** Máximo permitido en DTO; ventana de búsqueda de solapes. */
    private static final int MAX_DURATION_MINUTES = 480;

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
    public List<AppointmentDTO> findAll(AppointmentFilterDTO filter) {
        return appointmentRepository.findAll(AppointmentSpecification.withFilters(filter)).stream().map(this::toDTO).toList();
    }

    @Override
    public Page<AppointmentDTO> findAll(Pageable pageable) {
        return appointmentRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    public Page<AppointmentDTO> findAll(AppointmentFilterDTO filter, Pageable pageable) {
        return appointmentRepository.findAll(AppointmentSpecification.withFilters(filter), pageable).map(this::toDTO);
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
    public List<AppointmentDTO> findCalendar(UUID agentId, LocalDateTime from, LocalDateTime toExclusive) {
        if (!from.isBefore(toExclusive)) {
            throw new IllegalArgumentException("El rango de fechas es inválido (from debe ser anterior a to).");
        }
        return appointmentRepository
                .findByAgentIdAndScheduledAtGreaterThanEqualAndScheduledAtBefore(agentId, from, toExclusive)
                .stream()
                .sorted(Comparator.comparing(Appointment::getScheduledAt))
                .map(this::toDTO)
                .toList();
    }

    @Override
    public AppointmentDTO findById(UUID id) {
        return toDTO(getOrThrow(id));
    }

    @Override
    @Transactional
    public AppointmentDTO create(AppointmentCreateDTO dto) {
        int duration = dto.durationMinutes() != null ? dto.durationMinutes() : 60;
        assertNoSchedulingConflict(dto.agentId(), dto.scheduledAt(), duration, null);

        Appointment appointment = Appointment.builder()
                .property(propertyRepository.findById(dto.propertyId())
                        .orElseThrow(() -> new ResourceNotFoundException("Property", dto.propertyId())))
                .client(clientRepository.findById(dto.clientId())
                        .orElseThrow(() -> new ResourceNotFoundException("Client", dto.clientId())))
                .agent(userRepository.findById(dto.agentId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId())))
                .scheduledAt(dto.scheduledAt())
                .durationMinutes(duration)
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
        LocalDateTime newStart = dto.scheduledAt() != null ? dto.scheduledAt() : appointment.getScheduledAt();
        int newDuration = dto.durationMinutes() != null ? dto.durationMinutes() : appointment.getDurationMinutes();
        if (dto.scheduledAt() != null || dto.durationMinutes() != null) {
            assertNoSchedulingConflict(appointment.getAgent().getId(), newStart, newDuration, id);
        }
        if (dto.scheduledAt() != null)     appointment.setScheduledAt(dto.scheduledAt());
        if (dto.durationMinutes() != null) appointment.setDurationMinutes(dto.durationMinutes());
        if (dto.status() != null)          appointment.setStatus(dto.status());
        if (dto.notes() != null)           appointment.setNotes(dto.notes());
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
                a.getScheduledAt(),
                a.getDurationMinutes(),
                a.getStatus(),
                a.getNotes(),
                a.getCreatedAt()
        );
    }

    private static boolean intervalsOverlap(LocalDateTime s1, int d1Min, LocalDateTime s2, int d2Min) {
        LocalDateTime e1 = s1.plusMinutes(d1Min);
        LocalDateTime e2 = s2.plusMinutes(d2Min);
        return s1.isBefore(e2) && s2.isBefore(e1);
    }

    private void assertNoSchedulingConflict(UUID agentId, LocalDateTime start, int durationMinutes, UUID excludeAppointmentId) {
        LocalDateTime end = start.plusMinutes(durationMinutes);
        LocalDateTime winStart = start.minusMinutes(MAX_DURATION_MINUTES);
        LocalDateTime winEnd = end.plusMinutes(MAX_DURATION_MINUTES);
        List<Appointment> candidates = appointmentRepository.findByAgentIdAndScheduledAtBetween(agentId, winStart, winEnd);
        for (Appointment a : candidates) {
            if (a.getStatus() != Appointment.AppointmentStatus.PENDING
                    && a.getStatus() != Appointment.AppointmentStatus.CONFIRMED) {
                continue;
            }
            if (excludeAppointmentId != null && excludeAppointmentId.equals(a.getId())) {
                continue;
            }
            if (intervalsOverlap(start, durationMinutes, a.getScheduledAt(), a.getDurationMinutes())) {
                throw new IllegalArgumentException(
                        "El agente ya tiene una cita pendiente o confirmada que se traslapa en ese horario.");
            }
        }
    }
}
