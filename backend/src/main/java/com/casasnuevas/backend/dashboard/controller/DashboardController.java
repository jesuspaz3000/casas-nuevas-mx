package com.casasnuevas.backend.dashboard.controller;

import com.casasnuevas.backend.appointment.model.Appointment;
import com.casasnuevas.backend.appointment.repository.AppointmentRepository;
import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.client.repository.ClientRepository;
import com.casasnuevas.backend.contract.model.Contract;
import com.casasnuevas.backend.contract.repository.ContractRepository;
import com.casasnuevas.backend.dashboard.dto.DashboardDTO;
import com.casasnuevas.backend.dashboard.dto.MonthlyChartPoint;
import com.casasnuevas.backend.property.model.Property;
import com.casasnuevas.backend.property.repository.PropertyRepository;
import com.casasnuevas.backend.user.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.function.BiFunction;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Estadísticas: agente (su cartera) o administrador (toda la operación)")
public class DashboardController {

    private final PropertyRepository propertyRepository;
    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ContractRepository contractRepository;

    @GetMapping("/me")
    @Operation(summary = "Dashboard según rol",
               description = "ADMIN: métricas globales del sistema. AGENT: métricas de las propiedades/clientes/citas/contratos asignados a ese usuario.")
    public ResponseEntity<DashboardDTO> myDashboard(@AuthenticationPrincipal User user) {
        if (user.getRole() == User.Role.ADMIN) {
            return ResponseEntity.ok(buildGlobalDashboard());
        }
        return ResponseEntity.ok(buildDashboard(user.getId()));
    }

    @GetMapping("/agent/{agentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Dashboard de un agente específico (solo ADMIN)")
    public ResponseEntity<DashboardDTO> agentDashboard(@PathVariable UUID agentId) {
        return ResponseEntity.ok(buildDashboard(agentId));
    }

    private DashboardDTO buildGlobalDashboard() {
        long totalProperties     = propertyRepository.count();
        long availableProperties = propertyRepository.countByStatus(Property.PropertyStatus.AVAILABLE);
        long soldProperties      = propertyRepository.countByStatus(Property.PropertyStatus.SOLD);

        long totalClients  = clientRepository.count();
        long activeClients = clientRepository.countByStatus(Client.ClientStatus.INTERESTED)
                           + clientRepository.countByStatus(Client.ClientStatus.NEGOTIATING);

        long totalAppointments   = appointmentRepository.count();
        long pendingAppointments = appointmentRepository.countPendingOrConfirmed();

        long signedContracts = contractRepository.countByStatus(Contract.ContractStatus.SIGNED);
        long totalContracts  = contractRepository.count();

        BigDecimal fromContracts = contractRepository.sumSignedContractValueAll();
        BigDecimal fromCatalog   = propertyRepository.sumSoldWithoutSignedContractPriceAll();
        BigDecimal totalSalesAmount = nz(fromContracts).add(nz(fromCatalog));

        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime monthEnd   = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);

        long monthlySignedContracts = monthlyClosedDealsCountGlobal(monthStart, monthEnd);
        BigDecimal monthlyRevenue   = monthlyClosedDealsRevenueGlobal(monthStart, monthEnd);
        long monthlyNewClients        = clientRepository.countByCreatedAtBetween(monthStart, monthEnd);
        long monthlyAppointments      = appointmentRepository.countByScheduledAtBetween(monthStart, monthEnd);

        List<MonthlyChartPoint> monthlySeries = buildMonthlySeriesGlobal();

        return new DashboardDTO(
                totalProperties, availableProperties, soldProperties,
                totalClients, activeClients,
                totalAppointments, pendingAppointments,
                totalContracts, signedContracts,
                totalSalesAmount,
                monthlySignedContracts, monthlyRevenue, monthlyNewClients, monthlyAppointments,
                monthlySeries
        );
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
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

        BigDecimal fromContracts = contractRepository.sumSalePriceByAgentId(agentId);
        BigDecimal fromCatalog   = propertyRepository.sumSoldWithoutSignedContractPriceAllByAgent(agentId);
        BigDecimal totalSalesAmount = nz(fromContracts).add(nz(fromCatalog));

        // Estadísticas del mes actual
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime monthEnd   = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);

        long monthlySignedContracts = monthlyClosedDealsCount(agentId, monthStart, monthEnd);
        BigDecimal monthlyRevenue = monthlyClosedDealsRevenue(agentId, monthStart, monthEnd);
        long monthlyNewClients  = clientRepository.countByAgentIdAndCreatedAtBetween(agentId, monthStart, monthEnd);
        long monthlyAppointments = appointmentRepository.countByAgentIdAndScheduledAtBetween(agentId, monthStart, monthEnd);

        List<MonthlyChartPoint> monthlySeries = buildMonthlySeries(agentId);

        return new DashboardDTO(
                totalProperties, availableProperties, soldProperties,
                totalClients, activeClients,
                totalAppointments, pendingAppointments,
                totalContracts, signedContracts,
                totalSalesAmount,
                monthlySignedContracts, monthlyRevenue, monthlyNewClients, monthlyAppointments,
                monthlySeries
        );
    }

    private List<MonthlyChartPoint> buildMonthlySeries(UUID agentId) {
        return buildMonthlySeriesInternal(
                (start, end) -> monthlyClosedDealsCount(agentId, start, end),
                (start, end) -> monthlyClosedDealsRevenue(agentId, start, end));
    }

    private List<MonthlyChartPoint> buildMonthlySeriesGlobal() {
        return buildMonthlySeriesInternal(this::monthlyClosedDealsCountGlobal, this::monthlyClosedDealsRevenueGlobal);
    }

    private List<MonthlyChartPoint> buildMonthlySeriesInternal(
            BiFunction<LocalDateTime, LocalDateTime, Long> countFn,
            BiFunction<LocalDateTime, LocalDateTime, BigDecimal> revenueFn) {
        List<MonthlyChartPoint> points = new ArrayList<>(6);
        YearMonth now = YearMonth.now();
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("MMM uuuu", Locale.forLanguageTag("es-MX"));
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
            long signed = countFn.apply(start, end);
            BigDecimal rev = revenueFn.apply(start, end);
            String rawLabel = ym.format(labelFmt);
            String label = rawLabel.isEmpty() ? rawLabel : Character.toUpperCase(rawLabel.charAt(0)) + rawLabel.substring(1);
            points.add(new MonthlyChartPoint(label, signed, rev != null ? rev : BigDecimal.ZERO));
        }
        return points;
    }

    /** Contratos firmados (por fecha de última actualización) + propiedades vendidas sin contrato firmado. */
    private long monthlyClosedDealsCount(UUID agentId, LocalDateTime start, LocalDateTime end) {
        long contracts = contractRepository.countByAgentIdAndStatusAndUpdatedAtBetween(
                agentId, Contract.ContractStatus.SIGNED, start, end);
        long catalogOnly = propertyRepository.countSoldWithoutSignedContractByAgentAndUpdatedAtBetween(agentId, start, end);
        return contracts + catalogOnly;
    }

    private BigDecimal monthlyClosedDealsRevenue(UUID agentId, LocalDateTime start, LocalDateTime end) {
        BigDecimal fromContracts = contractRepository.sumSignedContractValueByAgentIdAndUpdatedAtBetween(agentId, start, end);
        BigDecimal fromProps = propertyRepository.sumSoldWithoutSignedContractPriceByAgentAndUpdatedAtBetween(agentId, start, end);
        return nz(fromContracts).add(nz(fromProps));
    }

    private long monthlyClosedDealsCountGlobal(LocalDateTime start, LocalDateTime end) {
        long contracts = contractRepository.countByStatusAndUpdatedAtBetween(Contract.ContractStatus.SIGNED, start, end);
        long catalogOnly = propertyRepository.countSoldWithoutSignedContractByUpdatedAtBetween(start, end);
        return contracts + catalogOnly;
    }

    private BigDecimal monthlyClosedDealsRevenueGlobal(LocalDateTime start, LocalDateTime end) {
        BigDecimal fromContracts = contractRepository.sumSignedContractValueByUpdatedAtBetween(start, end);
        BigDecimal fromProps = propertyRepository.sumSoldWithoutSignedContractPriceByUpdatedAtBetween(start, end);
        return nz(fromContracts).add(nz(fromProps));
    }
}
