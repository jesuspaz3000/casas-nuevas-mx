"use client";

import { useState } from "react";
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

/* ── Componente principal ───────────────────────────────── */
export default function Properties() {
    const {
        properties, isLoading, error,
        total, page, totalPages, pageSize, setPage, setPageSize,
        search, setSearch,
        typeFilter, setTypeFilter,
        statusFilter, setStatusFilter,
        refetch, remove,
    } = useProperties();

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
                <div className="flex flex-col min-w-0">
                    <span className="font-medium text-gray-800 dark:text-white truncate max-w-[220px]">{p.title}</span>
                    {(p.city || p.state) && (
                        <span className="text-xs text-gray-400 truncate">
                            {[p.city, p.state].filter(Boolean).join(", ")}
                        </span>
                    )}
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
                <div className="flex flex-wrap items-center gap-3">
                    {/* Búsqueda */}
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Tipo */}
                    <Select
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v as PropertyType | "")}
                        options={TYPE_OPTIONS}
                        className="w-44"
                    />

                    {/* Estado */}
                    <Select
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v as PropertyStatus | "")}
                        options={STATUS_OPTIONS}
                        className="w-44"
                    />

                    <div className="ml-auto">
                        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                            <AddIcon sx={{ fontSize: 17 }} />
                            Nueva propiedad
                        </Button>
                    </div>
                </div>

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
                    emptyMessage={search || typeFilter || statusFilter ? "Sin resultados para los filtros aplicados" : "No hay propiedades registradas"}
                    emptyIcon={<HomeWorkIcon sx={{ fontSize: 48 }} />}
                />
            </div>

            {/* Dialogs */}
            <PropertyCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
            <PropertyEditDialog open={editProperty !== null} property={editProperty} onClose={() => setEditProperty(null)} onUpdated={refetch} />
            <PropertyDeleteDialog open={deleteProperty !== null} loading={deleteLoading} property={deleteProperty} onConfirm={handleDelete} onCancel={() => setDeleteProperty(null)} />
        </>
    );
}
