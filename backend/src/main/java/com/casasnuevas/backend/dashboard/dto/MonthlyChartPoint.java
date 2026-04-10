package com.casasnuevas.backend.dashboard.dto;

import java.math.BigDecimal;

public record MonthlyChartPoint(
        String label,
        long signedContracts,
        BigDecimal revenue
) {}
