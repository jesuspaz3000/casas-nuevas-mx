"use client";

import { useCallback, useEffect, useState } from "react";
import { PropertiesService } from "@/features/properties/services/properties.service";
import { Property, PropertyType, PropertyStatus } from "@/features/properties/types/properties.types";
import { useDebounce } from "@/shared/hooks/useDebounce";

export function useProperties(initialPageSize = 10) {
    const [properties, setProperties] = useState<Property[]>([]);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const [pageSize, setPageSizeRaw]  = useState(initialPageSize);
    const [searchRaw, setSearchRaw]   = useState("");
    const [typeFilter, setTypeFilter]     = useState<PropertyType | "">("");
    const [statusFilter, setStatusFilter] = useState<PropertyStatus | "">("");
    const [cityFilter, setCityFilter]           = useState("");
    const [neighborhoodFilter, setNeighborhoodFilter] = useState("");
    const [priceMinFilter, setPriceMinFilter]   = useState("");
    const [priceMaxFilter, setPriceMaxFilter]   = useState("");
    const [bedroomsMinFilter, setBedroomsMinFilter]   = useState("");
    const [bathroomsMinFilter, setBathroomsMinFilter] = useState("");
    const [areaM2MinFilter, setAreaM2MinFilter]     = useState("");
    const [isLoading, setIsLoading]   = useState(true);
    const [error, setError]           = useState<string | null>(null);

    const debouncedSearch = useDebounce(searchRaw, 400);
    const offset    = (page - 1) * pageSize;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const parseOptionalInt = (s: string): number | undefined => {
        const t = s.trim();
        if (!t) return undefined;
        const n = Number(t);
        return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
    };

    const parseOptionalDecimal = (s: string): number | undefined => {
        const t = s.trim();
        if (!t) return undefined;
        const n = Number(t);
        return Number.isFinite(n) && n >= 0 ? n : undefined;
    };

    const fetchProperties = useCallback(() => {
        setIsLoading(true);
        setError(null);
        PropertiesService.findPaginated({
            limit: pageSize,
            offset,
            search: debouncedSearch || undefined,
            type: typeFilter || undefined,
            status: statusFilter || undefined,
            city: cityFilter.trim() || undefined,
            neighborhood: neighborhoodFilter.trim() || undefined,
            priceMin: parseOptionalDecimal(priceMinFilter),
            priceMax: parseOptionalDecimal(priceMaxFilter),
            bedroomsMin: parseOptionalInt(bedroomsMinFilter),
            bathroomsMin: parseOptionalInt(bathroomsMinFilter),
            areaM2Min: parseOptionalDecimal(areaM2MinFilter),
        })
            .then((data) => {
                setProperties(data.results);
                setTotal(data.count);
            })
            .catch(() => setError("No se pudieron cargar las propiedades"))
            .finally(() => setIsLoading(false));
    }, [
        pageSize,
        offset,
        debouncedSearch,
        typeFilter,
        statusFilter,
        cityFilter,
        neighborhoodFilter,
        priceMinFilter,
        priceMaxFilter,
        bedroomsMinFilter,
        bathroomsMinFilter,
        areaM2MinFilter,
    ]);

    useEffect(() => { fetchProperties(); }, [fetchProperties]);

    // Reset a página 1 cuando cambian los filtros
    useEffect(() => {
        setPage(1);
    }, [
        debouncedSearch,
        typeFilter,
        statusFilter,
        cityFilter,
        neighborhoodFilter,
        priceMinFilter,
        priceMaxFilter,
        bedroomsMinFilter,
        bathroomsMinFilter,
        areaM2MinFilter,
    ]);

    const setSearch = (value: string) => {
        setSearchRaw(value);
        if (page !== 1) setPage(1);
    };

    const setPageSize = (size: number) => {
        setPageSizeRaw(size);
        setPage(1);
    };

    const remove = async (id: string) => {
        await PropertiesService.remove(id);
        fetchProperties();
    };

    return {
        properties, isLoading, error,
        total, page, totalPages, pageSize,
        setPage, setPageSize,
        search: searchRaw, setSearch,
        typeFilter, setTypeFilter,
        statusFilter, setStatusFilter,
        cityFilter, setCityFilter,
        neighborhoodFilter, setNeighborhoodFilter,
        priceMinFilter, setPriceMinFilter,
        priceMaxFilter, setPriceMaxFilter,
        bedroomsMinFilter, setBedroomsMinFilter,
        bathroomsMinFilter, setBathroomsMinFilter,
        areaM2MinFilter, setAreaM2MinFilter,
        refetch: fetchProperties, remove,
    };
}
