"use client";

import { useCallback, useEffect, useState } from "react";
import { UsersService } from "@/features/users/services/users.service";
import { User } from "@/features/users/types/users.types";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function useUsers(initialPageSize = 10) {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSizeRaw] = useState(initialPageSize);
    const [searchRaw, setSearchRaw] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchRaw, 400);
    const offset = (page - 1) * pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const fetchUsers = useCallback(() => {
        setIsLoading(true);
        setError(null);
        UsersService.findPaginated({
            limit: pageSize,
            offset,
            search: debouncedSearch || undefined,
        })
            .then((data) => {
                setUsers(data.results);
                setTotal(data.count);
            })
            .catch(() => setError("No se pudieron cargar los usuarios"))
            .finally(() => setIsLoading(false));
    }, [pageSize, offset, debouncedSearch]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Al cambiar la búsqueda debounced → volver a página 1
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const setSearch = (value: string) => {
        setSearchRaw(value);
        if (page !== 1) setPage(1);
    };

    const setPageSize = (size: number) => {
        setPageSizeRaw(size);
        setPage(1);
    };

    const remove = async (id: string) => {
        await UsersService.remove(id);
        fetchUsers();
    };

    return {
        users,
        isLoading,
        error,
        total,
        page,
        totalPages,
        pageSize,
        setPage,
        setPageSize,
        search: searchRaw,
        setSearch,
        refetch: fetchUsers,
        remove,
    };
}
