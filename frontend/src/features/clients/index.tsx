"use client";

import { useState } from "react";
import { useClients } from "@/features/clients/hooks/useClients";
import { Client, ClientStatus } from "@/features/clients/types/clients.types";
import { DataTable, Column } from "@/shared/components/dataTable";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { ClientCreateDialog } from "@/features/clients/components/ClientCreateDialog";
import { ClientEditDialog } from "@/features/clients/components/ClientEditDialog";
import { ClientDeleteDialog } from "@/features/clients/components/ClientDeleteDialog";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import PeopleIcon from "@mui/icons-material/People";

/* ── Badges ─────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
    LEAD: "Prospecto", INTERESTED: "Interesado",
    NEGOTIATING: "Negociando", CLOSED: "Cerrado", LOST: "Perdido",
};
const STATUS_BADGE: Record<string, string> = {
    LEAD:        "bg-slate-100  text-slate-600  dark:bg-slate-800/60  dark:text-slate-300",
    INTERESTED:  "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300",
    NEGOTIATING: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300",
    CLOSED:      "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300",
    LOST:        "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300",
};
const TYPE_LABEL: Record<string, string> = {
    HOUSE: "Casa", APARTMENT: "Apartamento", LAND: "Terreno", COMMERCIAL: "Comercial",
};

const STATUS_OPTIONS = [
    { value: "",           label: "Todos los estados" },
    { value: "LEAD",       label: "Prospecto" },
    { value: "INTERESTED", label: "Interesado" },
    { value: "NEGOTIATING",label: "Negociando" },
    { value: "CLOSED",     label: "Cerrado" },
    { value: "LOST",       label: "Perdido" },
];

const formatBudget = (min?: number, max?: number) => {
    const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
    if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
    if (min != null) return `Desde ${fmt(min)}`;
    if (max != null) return `Hasta ${fmt(max)}`;
    return null;
};

export default function Clients() {
    const {
        clients, isLoading, error,
        total, page, totalPages, pageSize, setPage, setPageSize,
        search, setSearch,
        statusFilter, setStatusFilter,
        refetch, remove,
    } = useClients();

    const [createOpen, setCreateOpen]       = useState(false);
    const [editClient, setEditClient]       = useState<Client | null>(null);
    const [deleteClient, setDeleteClient]   = useState<Client | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteClient) return;
        setDeleteLoading(true);
        try { await remove(deleteClient.id); setDeleteClient(null); }
        finally { setDeleteLoading(false); }
    };

    const columns: Column<Client>[] = [
        {
            key: "index", header: "#",
            headerClassName: "w-12",
            className: "text-gray-400 dark:text-gray-500 font-medium tabular-nums",
            render: (_, i) => (page - 1) * pageSize + i + 1,
        },
        {
            key: "client", header: "Cliente",
            render: (c) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                            {c.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                        </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-800 dark:text-white truncate">{c.name}</span>
                        {c.email && <span className="text-xs text-gray-400 truncate">{c.email}</span>}
                    </div>
                </div>
            ),
        },
        {
            key: "phone", header: "Teléfono",
            className: "text-gray-500 dark:text-gray-400 whitespace-nowrap",
            render: (c) => c.phone ?? <span className="text-gray-300 dark:text-gray-600">—</span>,
        },
        {
            key: "budget", header: "Presupuesto",
            className: "text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap tabular-nums",
            render: (c) => formatBudget(c.budgetMin, c.budgetMax) ?? <span className="text-gray-300 dark:text-gray-600">—</span>,
        },
        {
            key: "interest", header: "Interés",
            render: (c) => c.interestedType
                ? <span className="text-sm text-gray-600 dark:text-gray-300">{TYPE_LABEL[c.interestedType] ?? c.interestedType}{c.interestedCity ? ` · ${c.interestedCity}` : ""}</span>
                : <span className="text-gray-300 dark:text-gray-600">—</span>,
        },
        {
            key: "status", header: "Estado",
            render: (c) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE[c.status] ?? ""}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                </span>
            ),
        },
        {
            key: "agent", header: "Agente",
            className: "text-gray-500 dark:text-gray-400 whitespace-nowrap",
            render: (c) => c.agentName ?? <span className="text-gray-300 dark:text-gray-600">—</span>,
        },
        {
            key: "actions", header: "Acciones",
            headerClassName: "text-right",
            className: "text-right",
            render: (c) => (
                <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditClient(c)} title="Editar cliente"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
                        <EditIcon sx={{ fontSize: 17 }} />
                    </button>
                    <button onClick={() => setDeleteClient(c)} title="Eliminar cliente"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
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
                        <PeopleIcon sx={{ fontSize: 22, color: "white" }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Gestión de clientes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">CRM de prospectos y clientes en negociación</p>
                    </div>
                </div>

                {/* Filtros + botón crear */}
                <div className="flex flex-col gap-3">
                    {/* Fila 1: búsqueda + botón móvil */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input type="text" placeholder="Buscar por nombre, email o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            title="Nuevo cliente"
                            className="md:hidden flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                        >
                            <AddIcon sx={{ fontSize: 20 }} />
                        </button>
                    </div>
                    {/* Fila 2: select + botón desktop */}
                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onChange={(v) => setStatusFilter(v as ClientStatus | "")} options={STATUS_OPTIONS} className="w-full md:w-48" />
                        <div className="hidden md:block md:ml-auto">
                            <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                                <AddIcon sx={{ fontSize: 17 }} />
                                Nuevo cliente
                            </Button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{error}</div>
                )}

                <DataTable<Client>
                    columns={columns} data={clients} keyExtractor={(c) => c.id}
                    isLoading={isLoading} page={page} totalPages={totalPages} total={total}
                    pageSize={pageSize} pageSizeOptions={[5, 10, 25, 50]}
                    onPageChange={setPage} onPageSizeChange={setPageSize}
                    emptyMessage={search || statusFilter ? "Sin resultados para los filtros aplicados" : "No hay clientes registrados"}
                    emptyIcon={<PeopleIcon sx={{ fontSize: 48 }} />}
                    renderCard={(c, i) => (
                        <div className="px-4 py-3 space-y-2">
                            {/* Fila 1: avatar + nombre + email */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">
                                        {c.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-gray-400 tabular-nums leading-none mb-0.5">#{(page - 1) * pageSize + i + 1}</p>
                                    <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{c.name}</p>
                                    {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                                </div>
                            </div>

                            {/* Fila 2: badge estado */}
                            <span className={`inline-flex shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] ?? ""}`}>
                                {STATUS_LABEL[c.status] ?? c.status}
                            </span>

                            {/* Fila 3: presupuesto */}
                            {formatBudget(c.budgetMin, c.budgetMax) && (
                                <p className="text-sm font-bold text-gray-800 dark:text-white tabular-nums">
                                    {formatBudget(c.budgetMin, c.budgetMax)}
                                </p>
                            )}

                            {/* Fila 4: teléfono */}
                            {c.phone && (
                                <p className="text-xs text-gray-400">{c.phone}</p>
                            )}

                            {/* Fila 5: interés */}
                            {c.interestedType && (
                                <p className="text-xs text-gray-400 truncate">
                                    {TYPE_LABEL[c.interestedType] ?? c.interestedType}
                                    {c.interestedCity ? `, ${c.interestedCity}` : ""}
                                </p>
                            )}

                            {/* Fila 6: agente */}
                            {c.agentName && (
                                <p className="text-xs text-gray-400 truncate">{c.agentName}</p>
                            )}

                            {/* Fila 7: acciones */}
                            <div className="flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <button onClick={() => setEditClient(c)} title="Editar"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
                                    <EditIcon sx={{ fontSize: 17 }} />
                                </button>
                                <button onClick={() => setDeleteClient(c)} title="Eliminar"
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
                                    <DeleteOutlinedIcon sx={{ fontSize: 17 }} />
                                </button>
                            </div>
                        </div>
                    )}
                />
            </div>

            <ClientCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
            <ClientEditDialog open={editClient !== null} client={editClient} onClose={() => setEditClient(null)} onUpdated={refetch} />
            <ClientDeleteDialog open={deleteClient !== null} loading={deleteLoading} client={deleteClient} onConfirm={handleDelete} onCancel={() => setDeleteClient(null)} />
        </>
    );
}
