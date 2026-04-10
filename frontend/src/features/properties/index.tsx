"use client";

import { useMemo, useState } from "react";
import { useProperties } from "@/features/properties/hooks/useProperties";
import { Property, PropertyType, PropertyStatus } from "@/features/properties/types/properties.types";
import { DataTable, Column } from "@/shared/components/dataTable";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { PropertyCreateDialog } from "@/features/properties/components/PropertyCreateDialog";
import { PropertyEditDialog } from "@/features/properties/components/PropertyEditDialog";
import { PropertyDeleteDialog } from "@/features/properties/components/PropertyDeleteDialog";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import FilterListIcon from "@mui/icons-material/FilterList";
import { resolveMediaUrl } from "@/shared/utils/mediaUrl";
import BedIcon from "@mui/icons-material/Bed";
import BathtubIcon from "@mui/icons-material/Bathtub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";

/* ── Badges ─────────────────────────────────────────────── */
const TYPE_LABEL: Record<string, string> = { HOUSE: "Casa", APARTMENT: "Apartamento", LAND: "Terreno", COMMERCIAL: "Comercial" };
const TYPE_BADGE: Record<string, string> = {
    HOUSE:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    APARTMENT:  "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300",
    LAND:       "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300",
    COMMERCIAL: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};
const STATUS_LABEL: Record<string, string> = { AVAILABLE: "Disponible", RESERVED: "Reservada", SOLD: "Vendida" };
const STATUS_BADGE: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    RESERVED:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    SOLD:      "bg-red-100   text-red-700   dark:bg-red-900/30   dark:text-red-300",
};

const TYPE_OPTIONS = [
    { value: "",           label: "Todos los tipos" },
    { value: "HOUSE",      label: "Casa" },
    { value: "APARTMENT",  label: "Apartamento" },
    { value: "LAND",       label: "Terreno" },
    { value: "COMMERCIAL", label: "Comercial" },
];
const STATUS_OPTIONS = [
    { value: "",          label: "Todos los estados" },
    { value: "AVAILABLE", label: "Disponible" },
    { value: "RESERVED",  label: "Reservada" },
    { value: "SOLD",      label: "Vendida" },
];

const formatPrice = (price: number, currency = "MXN") =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

function PropertyThumb({ property: p }: { property: Property }) {
    const photos = p.photos ?? [];
    const path = (photos.find((x) => x.isCover) ?? photos[0])?.url;
    const src = path ? resolveMediaUrl(path) : "";
    if (!src) {
        return (
            <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200/80 dark:border-gray-700">
                <HomeWorkIcon sx={{ fontSize: 22 }} className="text-gray-400" />
            </div>
        );
    }
    return (
        <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
    );
}

/* ── Componente principal ───────────────────────────────── */
export default function Properties() {
    const {
        properties, isLoading, error,
        total, page, totalPages, pageSize, setPage, setPageSize,
        search, setSearch,
        typeFilter, setTypeFilter,
        statusFilter, setStatusFilter,
        cityFilter, setCityFilter,
        neighborhoodFilter, setNeighborhoodFilter,
        priceMinFilter, setPriceMinFilter,
        priceMaxFilter, setPriceMaxFilter,
        bedroomsMinFilter, setBedroomsMinFilter,
        bathroomsMinFilter, setBathroomsMinFilter,
        areaM2MinFilter, setAreaM2MinFilter,
        refetch, remove,
    } = useProperties();

    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const [createOpen, setCreateOpen]       = useState(false);
    const [editProperty, setEditProperty]   = useState<Property | null>(null);
    const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteProperty) return;
        setDeleteLoading(true);
        try {
            await remove(deleteProperty.id);
            setDeleteProperty(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const hasAdvancedFilters = useMemo(
        () =>
            cityFilter.trim() !== "" ||
            neighborhoodFilter.trim() !== "" ||
            priceMinFilter.trim() !== "" ||
            priceMaxFilter.trim() !== "" ||
            bedroomsMinFilter.trim() !== "" ||
            bathroomsMinFilter.trim() !== "" ||
            areaM2MinFilter.trim() !== "",
        [
            cityFilter,
            neighborhoodFilter,
            priceMinFilter,
            priceMaxFilter,
            bedroomsMinFilter,
            bathroomsMinFilter,
            areaM2MinFilter,
        ],
    );

    const clearAdvancedFilters = () => {
        setCityFilter("");
        setNeighborhoodFilter("");
        setPriceMinFilter("");
        setPriceMaxFilter("");
        setBedroomsMinFilter("");
        setBathroomsMinFilter("");
        setAreaM2MinFilter("");
    };

    const columns: Column<Property>[] = [
        {
            key: "index",
            header: "#",
            headerClassName: "w-12",
            className: "text-gray-400 dark:text-gray-500 font-medium tabular-nums",
            render: (_, i) => (page - 1) * pageSize + i + 1,
        },
        {
            key: "title",
            header: "Propiedad",
            render: (p) => (
                <div className="flex items-center gap-3 min-w-0">
                    <PropertyThumb property={p} />
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-800 dark:text-white truncate max-w-[200px]">{p.title}</span>
                        {(p.city || p.state) && (
                            <span className="text-xs text-gray-400 truncate">
                                {[p.city, p.state].filter(Boolean).join(", ")}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "type",
            header: "Tipo",
            render: (p) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${TYPE_BADGE[p.type] ?? ""}`}>
                    {TYPE_LABEL[p.type] ?? p.type}
                </span>
            ),
        },
        {
            key: "status",
            header: "Estado",
            render: (p) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE[p.status] ?? ""}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                </span>
            ),
        },
        {
            key: "price",
            header: "Precio",
            className: "font-semibold text-gray-800 dark:text-white whitespace-nowrap tabular-nums",
            render: (p) => formatPrice(p.price, p.currency),
        },
        {
            key: "details",
            header: "Detalles",
            render: (p) => (
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {p.bedrooms != null && (
                        <span className="flex items-center gap-1">
                            <BedIcon sx={{ fontSize: 14 }} />
                            {p.bedrooms}
                        </span>
                    )}
                    {p.bathrooms != null && (
                        <span className="flex items-center gap-1">
                            <BathtubIcon sx={{ fontSize: 14 }} />
                            {p.bathrooms}
                        </span>
                    )}
                    {p.areaM2 != null && (
                        <span className="flex items-center gap-1">
                            <SquareFootIcon sx={{ fontSize: 14 }} />
                            {p.areaM2} m²
                        </span>
                    )}
                    {p.bedrooms == null && p.bathrooms == null && p.areaM2 == null && (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                </div>
            ),
        },
        {
            key: "agent",
            header: "Agente",
            className: "text-gray-500 dark:text-gray-400 whitespace-nowrap",
            render: (p) => p.agentName ?? <span className="text-gray-300 dark:text-gray-600">—</span>,
        },
        {
            key: "actions",
            header: "Acciones",
            headerClassName: "text-right",
            className: "text-right",
            render: (p) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => setEditProperty(p)}
                        title="Editar propiedad"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                    >
                        <EditIcon sx={{ fontSize: 17 }} />
                    </button>
                    <button
                        onClick={() => setDeleteProperty(p)}
                        title="Eliminar propiedad"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                        <DeleteOutlinedIcon sx={{ fontSize: 17 }} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="flex flex-col gap-6">
                {/* Encabezado */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 flex-shrink-0">
                        <HomeWorkIcon sx={{ fontSize: 22, color: "white" }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            Gestión de propiedades
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Catálogo de propiedades con filtros avanzados
                        </p>
                    </div>
                </div>

                {/* Filtros + botón crear */}
                <div className="flex flex-col gap-3">
                    {/* Fila 1: búsqueda + botón móvil */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar por título..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        {/* Botón solo ícono — visible en móvil */}
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            title="Nueva propiedad"
                            className="md:hidden flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                        >
                            <AddIcon sx={{ fontSize: 20 }} />
                        </button>
                    </div>

                    {/* Fila 2: selects + más filtros + botón desktop */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Select
                            value={typeFilter}
                            onChange={(v) => setTypeFilter(v as PropertyType | "")}
                            options={TYPE_OPTIONS}
                            className="w-full md:w-44"
                        />
                        <Select
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v as PropertyStatus | "")}
                            options={STATUS_OPTIONS}
                            className="w-full md:w-44"
                        />
                        <button
                            type="button"
                            onClick={() => setFiltersExpanded((x) => !x)}
                            className={`w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors cursor-pointer ${
                                filtersExpanded || hasAdvancedFilters
                                    ? "border-blue-500/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        >
                            <FilterListIcon sx={{ fontSize: 18 }} />
                            Más filtros
                            {hasAdvancedFilters && !filtersExpanded && (
                                <span className="ml-0.5 w-2 h-2 rounded-full bg-blue-500" aria-hidden />
                            )}
                        </button>
                        {/* Botón con texto — visible en desktop */}
                        <div className="hidden md:block md:ml-auto">
                            <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                                <AddIcon sx={{ fontSize: 17 }} />
                                Nueva propiedad
                            </Button>
                        </div>
                    </div>
                </div>

                {filtersExpanded && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Filtros avanzados
                            </p>
                            {hasAdvancedFilters && (
                                <button
                                    type="button"
                                    onClick={clearAdvancedFilters}
                                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    Limpiar avanzados
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ciudad</label>
                                <input
                                    type="text"
                                    placeholder="Ej. CDMX"
                                    value={cityFilter}
                                    onChange={(e) => setCityFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Colonia</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Polanco"
                                    value={neighborhoodFilter}
                                    onChange={(e) => setNeighborhoodFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Precio mín. (MXN)</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={priceMinFilter}
                                    onChange={(e) => setPriceMinFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Precio máx. (MXN)</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="Sin límite"
                                    value={priceMaxFilter}
                                    onChange={(e) => setPriceMaxFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recámaras mín.</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={bedroomsMinFilter}
                                    onChange={(e) => setBedroomsMinFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Baños mín.</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={bathroomsMinFilter}
                                    onChange={(e) => setBathroomsMinFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Superficie mín. (m²)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    placeholder="0"
                                    value={areaM2MinFilter}
                                    onChange={(e) => setAreaM2MinFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Tabla */}
                <DataTable<Property>
                    columns={columns}
                    data={properties}
                    keyExtractor={(p) => p.id}
                    isLoading={isLoading}
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={pageSize}
                    pageSizeOptions={[5, 10, 25, 50]}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    emptyMessage={
                        search || typeFilter || statusFilter || hasAdvancedFilters
                            ? "Sin resultados para los filtros aplicados"
                            : "No hay propiedades registradas"
                    }
                    emptyIcon={<HomeWorkIcon sx={{ fontSize: 48 }} />}
                    renderCard={(p, i) => (
                        <div className="px-4 py-3 space-y-2">
                            {/* Fila 1: foto + título/ubicación */}
                            <div className="flex items-center gap-3">
                                <PropertyThumb property={p} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-gray-400 tabular-nums leading-none mb-0.5">#{(page - 1) * pageSize + i + 1}</p>
                                    <p className="font-semibold text-sm text-gray-800 dark:text-white truncate leading-snug">{p.title}</p>
                                    {(p.city || p.state) && (
                                        <p className="text-xs text-gray-400 truncate">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                                    )}
                                </div>
                            </div>

                            {/* Fila 2: badges */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[p.type] ?? ""}`}>
                                    {TYPE_LABEL[p.type] ?? p.type}
                                </span>
                                <span className={`inline-flex shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status] ?? ""}`}>
                                    {STATUS_LABEL[p.status] ?? p.status}
                                </span>
                            </div>

                            {/* Fila 3: precio */}
                            <p className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">
                                {formatPrice(p.price, p.currency)}
                            </p>

                            {/* Fila 4: specs */}
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                {p.bedrooms != null && (
                                    <span className="flex items-center gap-1"><BedIcon sx={{ fontSize: 13 }} />{p.bedrooms}</span>
                                )}
                                {p.bathrooms != null && (
                                    <span className="flex items-center gap-1"><BathtubIcon sx={{ fontSize: 13 }} />{p.bathrooms}</span>
                                )}
                                {p.areaM2 != null && (
                                    <span className="flex items-center gap-1"><SquareFootIcon sx={{ fontSize: 13 }} />{p.areaM2} m²</span>
                                )}
                            </div>

                            {/* Fila 5: agente */}
                            {p.agentName && (
                                <p className="text-xs text-gray-400 truncate">{p.agentName}</p>
                            )}

                            {/* Fila 5: acciones */}
                            <div className="flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setEditProperty(p)}
                                    title="Editar"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                                >
                                    <EditIcon sx={{ fontSize: 17 }} />
                                </button>
                                <button
                                    onClick={() => setDeleteProperty(p)}
                                    title="Eliminar"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                                >
                                    <DeleteOutlinedIcon sx={{ fontSize: 17 }} />
                                </button>
                            </div>
                        </div>
                    )}
                />
            </div>

            {/* Dialogs */}
            <PropertyCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
            <PropertyEditDialog open={editProperty !== null} property={editProperty} onClose={() => setEditProperty(null)} onUpdated={refetch} />
            <PropertyDeleteDialog open={deleteProperty !== null} loading={deleteLoading} property={deleteProperty} onConfirm={handleDelete} onCancel={() => setDeleteProperty(null)} />
        </>
    );
}
