package com.casasnuevas.backend.dashboard.dto;

import java.math.BigDecimal;

public record DashboardDTO(
        long totalProperties,
        long availableProperties,
        long soldProperties,
        long totalClients,
        long activeClients,
        long totalAppointments,
        long pendingAppointments,
        long totalContracts,
        long signedContracts,
        BigDecimal totalSalesAmount,
        // Estadísticas del mes actual
        long monthlySignedContracts,
        BigDecimal monthlyRevenue,
        long monthlyNewClients,
        long monthlyAppointments
) {}
