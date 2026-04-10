export interface MonthlyChartPoint {
    label: string;
    signedContracts: number;
    revenue: number;
}

export interface DashboardStats {
    totalProperties: number;
    availableProperties: number;
    soldProperties: number;
    totalClients: number;
    activeClients: number;
    totalAppointments: number;
    pendingAppointments: number;
    totalContracts: number;
    signedContracts: number;
    totalSalesAmount: number;
    // Mes actual
    monthlySignedContracts: number;
    monthlyRevenue: number;
    monthlyNewClients: number;
    monthlyAppointments: number;
    /** Últimos 6 meses (contratos firmados + ingresos por mes). */
    monthlySeries: MonthlyChartPoint[];
}
