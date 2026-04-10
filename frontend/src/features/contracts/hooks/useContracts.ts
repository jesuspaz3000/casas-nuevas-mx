"use client";

import { useCallback, useEffect, useState } from "react";
import { ContractsService } from "@/features/contracts/services/contracts.service";
import { Contract, ContractStatus, ContractType } from "@/features/contracts/types/contracts.types";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function useContracts(initialPageSize = 10) {
    const [contracts, setContracts]          = useState<Contract[]>([]);
    const [total, setTotal]                  = useState(0);
    const [page, setPage]                    = useState(1);
    const [pageSize, setPageSizeRaw]         = useState(initialPageSize);
    const [searchRaw, setSearchRaw]          = useState("");
    const [statusFilter, setStatusFilter]   = useState<ContractStatus | "">("");
    const [typeFilter, setTypeFilter]       = useState<ContractType | "">("");
    const [isLoading, setIsLoading]          = useState(true);
    const [error, setError]                = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchRaw, 400);
    const offset     = (page - 1) * pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetchContracts = useCallback(() => {
        setIsLoading(true);
        setError(null);
        ContractsService.findPaginated({
            limit:  pageSize,
            offset,
            search: debouncedSearch || undefined,
            status: statusFilter    || undefined,
            contractType: typeFilter || undefined,
        })
            .then((data) => { setContracts(data.results); setTotal(data.count); })
            .catch(() => setError("No se pudieron cargar los contratos"))
            .finally(() => setIsLoading(false));
    }, [pageSize, offset, debouncedSearch, statusFilter, typeFilter]);

    useEffect(() => { fetchContracts(); }, [fetchContracts]);
    useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, typeFilter]);

    const setSearch = (v: string) => { setSearchRaw(v); if (page !== 1) setPage(1); };
    const setPageSize = (s: number) => { setPageSizeRaw(s); setPage(1); };

    return {
        contracts, isLoading, error,
        total, page, totalPages, pageSize,
        setPage, setPageSize,
        search: searchRaw, setSearch,
        statusFilter, setStatusFilter,
        typeFilter, setTypeFilter,
        refetch: fetchContracts,
    };
}
