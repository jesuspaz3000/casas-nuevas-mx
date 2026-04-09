package com.casasnuevas.backend.dashboard.controller;

import com.casasnuevas.backend.appointment.model.Appointment;
import com.casasnuevas.backend.appointment.repository.AppointmentRepository;
import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.client.repository.ClientRepository;
import com.casasnuevas.backend.contract.model.Contract;
import com.casasnuevas.backend.contract.repository.ContractRepository;
import com.casasnuevas.backend.dashboard.dto.DashboardDTO;
import com.casasnuevas.backend.property.model.Property;
import com.casasnuevas.backend.property.repository.PropertyRepository;
import com.casasnuevas.backend.user.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.UUID;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Estadísticas de ventas por agente")
public class DashboardController {

    private final PropertyRepository propertyRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ContractRepository contractRepository;

    @GetMapping("/me")
    @Operation(summary = "Dashboard del agente autenticado")
    public ResponseEntity<DashboardDTO> myDashboard(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(buildDashboard(user.getId()));
    }

    @GetMapping("/agent/{agentId}")
    @Operation(summary = "Dashboard de un agente específico — solo ADMIN")
    public ResponseEntity<DashboardDTO> agentDashboard(@PathVariable UUID agentId) {
        return ResponseEntity.ok(buildDashboard(agentId));
    }

    private DashboardDTO buildDashboard(UUID agentId) {
        long totalProperties     = propertyRepository.countByAgentIdAndStatus(agentId, Property.PropertyStatus.AVAILABLE)
                                 + propertyRepository.countByAgentIdAndStatus(agentId, Property.PropertyStatus.RESERVED)
                                 + propertyRepository.countByAgentIdAndStatus(agentId, Property.PropertyStatus.SOLD);
        long availableProperties = propertyRepository.countByAgentIdAndStatus(agentId, Property.PropertyStatus.AVAILABLE);
        long soldProperties      = propertyRepository.countByAgentIdAndStatus(agentId, Property.PropertyStatus.SOLD);

        long totalClients  = clientRepository.findByAgentId(agentId).size();
        long activeClients = clientRepository.countByAgentIdAndStatus(agentId, Client.ClientStatus.INTERESTED)
                           + clientRepository.countByAgentIdAndStatus(agentId, Client.ClientStatus.NEGOTIATING);

        long totalAppointments   = appointmentRepository.findByAgentId(agentId).size();
        long pendingAppointments = appointmentRepository.findByAgentId(agentId).stream()
                .filter(a -> a.getStatus() == Appointment.AppointmentStatus.PENDING
                          || a.getStatus() == Appointment.AppointmentStatus.CONFIRMED)
                .count();

        long signedContracts = contractRepository.findByAgentIdAndStatus(agentId, Contract.ContractStatus.SIGNED).size();
        long totalContracts  = contractRepository.findByAgentId(agentId).size();

        BigDecimal totalSalesAmount = contractRepository.sumSalePriceByAgentId(agentId);

        // Estadísticas del mes actual
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime monthEnd   = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);

        long monthlySignedContracts = contractRepository.countByAgentIdAndStatusAndCreatedAtBetween(
                agentId, Contract.ContractStatus.SIGNED, monthStart, monthEnd);
        BigDecimal monthlyRevenue = contractRepository.sumSalePriceByAgentIdAndCreatedAtBetween(
                agentId, monthStart, monthEnd);
        long monthlyNewClients  = clientRepository.countByAgentIdAndCreatedAtBetween(agentId, monthStart, monthEnd);
        long monthlyAppointments = appointmentRepository.countByAgentIdAndScheduledAtBetween(agentId, monthStart, monthEnd);

        return new DashboardDTO(
                totalProperties, availableProperties, soldProperties,
                totalClients, activeClients,
                totalAppointments, pendingAppointments,
                totalContracts, signedContracts,
                totalSalesAmount,
                monthlySignedContracts, monthlyRevenue, monthlyNewClients, monthlyAppointments
        );
    }
}
