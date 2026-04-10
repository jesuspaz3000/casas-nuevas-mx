"use client";

import { useCallback, useEffect, useState } from "react";
import { AppointmentsService } from "@/features/appointments/services/appointments.service";
import { Appointment, AppointmentStatus } from "@/features/appointments/types/appointments.types";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function useAppointments(initialPageSize = 10) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [total, setTotal]               = useState(0);
    const [page, setPage]                 = useState(1);
    const [pageSize, setPageSizeRaw]      = useState(initialPageSize);
    const [searchRaw, setSearchRaw]       = useState("");
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
    const [isLoading, setIsLoading]       = useState(true);
    const [error, setError]               = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchRaw, 400);
    const offset     = (page - 1) * pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetchAppointments = useCallback(() => {
        setIsLoading(true);
        setError(null);
        AppointmentsService.findPaginated({
            limit:  pageSize,
            offset,
            search: debouncedSearch || undefined,
            status: statusFilter    || undefined,
        })
            .then((data) => { setAppointments(data.results); setTotal(data.count); })
            .catch(() => setError("No se pudieron cargar las citas"))
            .finally(() => setIsLoading(false));
    }, [pageSize, offset, debouncedSearch, statusFilter]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

    const setSearch   = (v: string) => { setSearchRaw(v); if (page !== 1) setPage(1); };
    const setPageSize = (s: number) => { setPageSizeRaw(s); setPage(1); };
    const remove      = async (id: string) => { await AppointmentsService.remove(id); fetchAppointments(); };

    return {
        appointments, isLoading, error,
        total, page, totalPages, pageSize,
        setPage, setPageSize,
        search: searchRaw, setSearch,
        statusFilter, setStatusFilter,
        refetch: fetchAppointments, remove,
    };
}
