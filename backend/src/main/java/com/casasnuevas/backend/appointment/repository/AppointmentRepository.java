package com.casasnuevas.backend.appointment.repository;

import com.casasnuevas.backend.appointment.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID>, JpaSpecificationExecutor<Appointment> {

    List<Appointment> findByAgentId(UUID agentId);

    List<Appointment> findByClientId(UUID clientId);

    List<Appointment> findByPropertyId(UUID propertyId);

    List<Appointment> findByAgentIdAndScheduledAtBetween(UUID agentId, LocalDateTime from, LocalDateTime to);

    List<Appointment> findByAgentIdAndScheduledAtGreaterThanEqualAndScheduledAtBefore(
            UUID agentId, LocalDateTime from, LocalDateTime toExclusive);

    long countByAgentIdAndScheduledAtBetween(UUID agentId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.scheduledAt BETWEEN :from AND :to")
    long countByScheduledAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status IN ('PENDING', 'CONFIRMED')")
    long countPendingOrConfirmed();
}
