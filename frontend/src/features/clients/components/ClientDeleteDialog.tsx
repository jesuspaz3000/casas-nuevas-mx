"use client";

import { Button } from "@/shared/components/Button";
import { Client } from "@/features/clients/types/clients.types";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface Props {
    open: boolean;
    loading: boolean;
    client: Client | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ClientDeleteDialog({ open, loading, client, onConfirm, onCancel }: Props) {
    if (!open || !client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 flex flex-col items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <WarningAmberIcon sx={{ fontSize: 26 }} className="text-red-500 dark:text-red-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">¿Eliminar cliente?</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        El cliente{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-200">{client.name}</span>{" "}
                        será eliminado del sistema.
                    </p>
                </div>
                <div className="flex gap-3 w-full">
                    <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>Cancelar</Button>
                    <Button variant="danger" fullWidth loading={loading} loadingText="Eliminando..." onClick={onConfirm}>
                        <DeleteOutlinedIcon sx={{ fontSize: 17 }} />
                        Eliminar
                    </Button>
                </div>
            </div>
        </div>
    );
}
