"use client";

import { useState } from "react";
import { useContracts } from "@/features/contracts/hooks/useContracts";
import { Contract, ContractStatus, ContractType } from "@/features/contracts/types/contracts.types";
import { ContractsService, openStoredPdf } from "@/features/contracts/services/contracts.service";
import { DataTable, Column } from "@/shared/components/dataTable";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { ContractCreateDialog } from "@/features/contracts/components/ContractCreateDialog";
import { ContractEditDialog } from "@/features/contracts/components/ContractEditDialog";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DescriptionIcon from "@mui/icons-material/Description";

const TYPE_LABEL: Record<string, string> = {
    RESERVATION: "Reserva",
    PURCHASE_AGREEMENT: "Compraventa",
};
const TYPE_BADGE: Record<string, string> = {
    RESERVATION: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
    PURCHASE_AGREEMENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};
const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Borrador",
    PENDING_SIGNATURE: "Pendiente firma",
    SIGNED: "Firmado",
    CANCELLED: "Cancelado",
};
const STATUS_BADGE: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    PENDING_SIGNATURE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    SIGNED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_OPTIONS = [
    { value: "", label: "Todos los estados" },
    { value: "DRAFT", label: "Borrador" },
    { value: "PENDING_SIGNATURE", label: "Pendiente firma" },
    { value: "SIGNED", label: "Firmado" },
    { value: "CANCELLED", label: "Cancelado" },
];

const TYPE_FILTER_OPTIONS = [
    { value: "", label: "Todos los tipos" },
    { value: "RESERVATION", label: "Reserva" },
    { value: "PURCHASE_AGREEMENT", label: "Compraventa" },
];

const formatMXN = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export default function Contracts() {
    const {
        contracts, isLoading, error,
        total, page, totalPages, pageSize, setPage, setPageSize,
        search, setSearch,
        statusFilter, setStatusFilter,
        typeFilter, setTypeFilter,
        refetch,
    } = useContracts();

    const [createOpen, setCreateOpen]         = useState(false);
    const [editContract, setEditContract]   = useState<Contract | null>(null);
    const [pdfLoadingId, setPdfLoadingId]   = useState<string | null>(null);
    const [openPdfLoadingId, setOpenPdfLoadingId] = useState<string | null>(null);

    const handleOpenStoredPdf = async (c: Contract) => {
        if (!c.pdfUrl) return;
        setOpenPdfLoadingId(c.id);
        try {
            await openStoredPdf(c.pdfUrl);
        } catch {
            /* 401 o bloqueo de pop-up */
        } finally {
            setOpenPdfLoadingId(null);
        }
    };

    const handleDownloadPdf = async (c: Contract) => {
        setPdfLoadingId(c.id);
        try {
            await ContractsService.downloadPdf(c.id, c.folio);
            refetch();
        } catch {
            /* axios interceptor puede redirigir a login */
        } finally {
            setPdfLoadingId(null);
        }
    };

    const columns: Column<Contract>[] = [
        {
            key: "index",
            header: "#",
            headerClassName: "w-12",
            className: "text-gray-400 dark:text-gray-500 font-medium tabular-nums",
            render: (_, i) => (page - 1) * pageSize + i + 1,
        },
        {
            key: "folio",
            header: "Folio",
            render: (c) => (
                <div className="flex flex-col min-w-0">
                    <span className="font-mono text-sm font-medium text-gray-800 dark:text-white">{c.folio}</span>
                    <span className="text-xs text-gray-400 truncate max-w-[200px]">{c.propertyTitle}</span>
                </div>
            ),
        },
        {
            key: "client",
            header: "Cliente",
            className: "text-gray-700 dark:text-gray-200",
            render: (c) => c.clientName,
        },
        {
            key: "type",
            header: "Tipo",
            render: (c) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${TYPE_BADGE[c.contractType] ?? ""}`}>
                    {TYPE_LABEL[c.contractType] ?? c.contractType}
                </span>
            ),
        },
        {
            key: "status",
            header: "Estado",
            render: (c) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE[c.status] ?? ""}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                </span>
            ),
        },
        {
            key: "reservation",
            header: "Reserva",
            className: "text-gray-600 dark:text-gray-300 text-sm tabular-nums whitespace-nowrap",
            render: (c) => formatMXN(c.reservationPrice),
        },
        {
            key: "agent",
            header: "Agente",
            className: "text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap",
            render: (c) => c.agentName,
        },
        {
            key: "actions",
            header: "Acciones",
            headerClassName: "text-right",
            className: "text-right",
            render: (c) => (
                <div className="flex items-center justify-end gap-1 flex-wrap">
                    {c.pdfUrl && (
                        <button
                            type="button"
                            onClick={() => handleOpenStoredPdf(c)}
                            disabled={openPdfLoadingId === c.id}
                            title="Abrir PDF guardado"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <OpenInNewIcon sx={{ fontSize: 17 }} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleDownloadPdf(c)}
                        disabled={pdfLoadingId === c.id}
                        title="Generar / descargar PDF"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <PictureAsPdfIcon sx={{ fontSize: 17 }} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditContract(c)}
                        title="Editar contrato"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                    >
                        <EditIcon sx={{ fontSize: 17 }} />
                    </button>
                </div>
            ),
        },
    ];

    const hasFilters = !!(search || statusFilter || typeFilter);

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 flex-shrink-0">
                        <DescriptionIcon sx={{ fontSize: 22, color: "white" }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Contratos</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reservas, datos fiscales y generación de PDF</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <SearchIcon sx={{ fontSize: 18 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por folio, propiedad o cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v as ContractStatus | "")}
                        options={STATUS_OPTIONS}
                        className="w-48"
                    />
                    <Select
                        value={typeFilter}
                        onChange={(v) => setTypeFilter(v as ContractType | "")}
                        options={TYPE_FILTER_OPTIONS}
                        className="w-44"
                    />
                    <div className="ml-auto">
                        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
                            <AddIcon sx={{ fontSize: 17 }} />
                            Nuevo contrato
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{error}</div>
                )}

                <DataTable<Contract>
                    columns={columns}
                    data={contracts}
                    keyExtractor={(c) => c.id}
                    isLoading={isLoading}
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={pageSize}
                    pageSizeOptions={[5, 10, 25, 50]}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    emptyMessage={hasFilters ? "Sin resultados para los filtros aplicados" : "No hay contratos registrados"}
                    emptyIcon={<DescriptionIcon sx={{ fontSize: 48 }} />}
                />
            </div>

            <ContractCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
            <ContractEditDialog open={editContract !== null} contract={editContract} onClose={() => setEditContract(null)} onUpdated={refetch} />
        </>
    );
}
