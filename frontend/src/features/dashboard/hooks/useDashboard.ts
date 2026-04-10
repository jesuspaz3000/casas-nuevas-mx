"use client";

import { useEffect, useState } from "react";
import { DashboardService } from "@/features/dashboard/services/dashboard.service";
import { DashboardStats } from "@/features/dashboard/types/dashboard.types";

export function useDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        DashboardService.getMyStats()
            .then(setStats)
            .catch(() => setError("No se pudieron cargar las estadísticas"))
            .finally(() => setIsLoading(false));
    }, []);

    return { stats, isLoading, error };
}
