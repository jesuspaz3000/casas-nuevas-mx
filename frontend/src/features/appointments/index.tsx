"use client";

import { useState } from "react";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { Appointment, AppointmentStatus } from "@/features/appointments/types/appointments.types";
import { DataTable, Column } from "@/shared/components/dataTable";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { AppointmentCreateDialog } from "@/features/appointments/components/AppointmentCreateDialog";
import { AppointmentEditDialog } from "@/features/appointments/components/AppointmentEditDialog";
import { AppointmentDeleteDialog } from "@/features/appointments/components/AppointmentDeleteDialog";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

/* ── Badges ─────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
    PENDING:   "Pendiente",
    CONFIRMED: "Confirmada",
    CANCELLED: "Cancelada",
    DONE:      "Realizada",
};
const STATUS_BADGE: Record<string, string> = {
    PENDING:   "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300",
    CONFIRMED: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300",
    CANCELLED: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300",
    DONE:      "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300",
};

const STATUS_OPTIONS = [
    { value: "",          label: "Todos los estados" },
    { value: "PENDING",   label: "Pendiente" },
    { value: "CONFIRMED", label: "Confirmada" },
    { value: "CANCELLED", label: "Cancelada" },
    { value: "DONE",      label: "Realizada" },
];

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
        + " " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
};

export default function Appointments() {
    const {
        appointments, isLoading, error,
        total, page, totalPages, pageSize, setPage, setPageSize,
        search, setSearch,
        statusFilter, setStatusFilter,
        refetch, remove,
    } = useAppointments();

    const [createOpen, setCreateOpen]             = useState(false);
    const [editAppointment, setEditAppointment]   = useState<Appointment | null>(null);
    const [deleteAppointment, setDeleteAppointment] = useState<Appointment | null>(null);
    const [deleteLoading, setDeleteLoading]       = useState(false);

    const handleDelete = async () => {
        if (!deleteAppointment) return;
        setDeleteLoading(true);
        try { await remove(deleteAppointment.id); setDeleteAppointment(null); }
        finally { setDeleteLoading(false); }
    };

    const columns: Column<Appointment>[] = [
        {
            key: "index", header: "#",
            headerClassName: "w-12",
            className: "text-gray-400 dark:text-gray-500 font-medium tabular-nums",
            render: (_, i) => (page - 1) * pageSize + i + 1,
        },
        {
            key: "property", header: "Propiedad",
            render: (a) => (
                <span className="font-medium text-gray-800 dark:text-white">{a.propertyTitle}</span>
            ),
        },
        {
            key: "client", header: "Cliente",
            render: (a) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                            {a.clientName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                        </span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 text-sm">{a.clientName}</span>
                </div>
            ),
        },
        {
            key: "agent", header: "Agente",
            className: "text-gray-500 dark:text-gray-400 whitespace-nowrap text-sm",
            render: (a) => a.agentName,
        },
        {
            key: "scheduledAt", header: "Fecha y hora",
            className: "text-gray-600 dark:text-gray-300 text-sm whitespace-nowrap tabular-nums",
            render: (a) => formatDateTime(a.scheduledAt),
        },
        {
            key: "status", header: "Estado",
            render: (a) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE[a.status] ?? ""}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                </span>
            ),
        },
        {
            key: "actions", header: "Acciones",
            headerClassName: "text-right",
            className: "text-right",
            render: (a) => (
                <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditAppointment(a)} title="Editar cita"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer">
                        <EditIcon sx={{ fontSize: 17 }} />
                    </button>
                    <button onClick={() => setDeleteAppointment(a)} title="Eliminar cita"
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
                        <CalendarMonthIcon sx={{ fontSize: 22, color: "white" }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Gestión de citas</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Agenda y seguimiento de visitas a propiedades</p>
                    </div>
                </div>

                {/* Filtros + botón crear */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Buscar por cliente o propiedad..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                    </div>
                    <Select value={statusFilter} onChange={(v) => setStatusFilter(v as AppointmentStatus | "")} options={STATUS_OPTIONS} className="w-44" />
                    <div className="ml-auto">
                        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                            <AddIcon sx={{ fontSize: 17 }} />
                            Nueva cita
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{error}</div>
                )}

                <DataTable<Appointment>
                    columns={columns} data={appointments} keyExtractor={(a) => a.id}
                    isLoading={isLoading} page={page} totalPages={totalPages} total={total}
                    pageSize={pageSize} pageSizeOptions={[5, 10, 25, 50]}
                    onPageChange={setPage} onPageSizeChange={setPageSize}
                    emptyMessage={search || statusFilter ? "Sin resultados para los filtros aplicados" : "No hay citas registradas"}
                    emptyIcon={<CalendarMonthIcon sx={{ fontSize: 48 }} />}
                />
            </div>

            <AppointmentCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
            <AppointmentEditDialog open={editAppointment !== null} appointment={editAppointment} onClose={() => setEditAppointment(null)} onUpdated={refetch} />
            <AppointmentDeleteDialog open={deleteAppointment !== null} loading={deleteLoading} appointment={deleteAppointment} onConfirm={handleDelete} onCancel={() => setDeleteAppointment(null)} />
        </>
    );
}
