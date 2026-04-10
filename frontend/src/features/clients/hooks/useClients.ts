"use client";

import { useCallback, useEffect, useState } from "react";
import { ClientsService } from "@/features/clients/services/clients.service";
import { Client, ClientStatus } from "@/features/clients/types/clients.types";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function useClients(initialPageSize = 10) {
    const [clients, setClients]          = useState<Client[]>([]);
    const [total, setTotal]              = useState(0);
    const [page, setPage]                = useState(1);
    const [pageSize, setPageSizeRaw]     = useState(initialPageSize);
    const [searchRaw, setSearchRaw]      = useState("");
    const [statusFilter, setStatusFilter] = useState<ClientStatus | "">("");
    const [isLoading, setIsLoading]      = useState(true);
    const [error, setError]              = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchRaw, 400);
    const offset     = (page - 1) * pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetchClients = useCallback(() => {
        setIsLoading(true);
        setError(null);
        ClientsService.findPaginated({
            limit:  pageSize,
            offset,
            search: debouncedSearch || undefined,
            status: statusFilter    || undefined,
        })
            .then((data) => { setClients(data.results); setTotal(data.count); })
            .catch(() => setError("No se pudieron cargar los clientes"))
            .finally(() => setIsLoading(false));
    }, [pageSize, offset, debouncedSearch, statusFilter]);

    useEffect(() => { fetchClients(); }, [fetchClients]);
    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

    const setSearch = (v: string) => { setSearchRaw(v); if (page !== 1) setPage(1); };
    const setPageSize = (s: number) => { setPageSizeRaw(s); setPage(1); };
    const remove = async (id: string) => { await ClientsService.remove(id); fetchClients(); };

    return {
        clients, isLoading, error,
        total, page, totalPages, pageSize,
        setPage, setPageSize,
        search: searchRaw, setSearch,
        statusFilter, setStatusFilter,
        refetch: fetchClients, remove,
    };
}
