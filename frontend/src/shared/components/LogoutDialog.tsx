"use client";

import { Button } from "@/shared/components/Button";
import LogoutIcon from "@mui/icons-material/Logout";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface LogoutDialogProps {
    open: boolean;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function LogoutDialog({ open, loading, onConfirm, onCancel }: LogoutDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 flex flex-col items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <WarningAmberIcon sx={{ fontSize: 26 }} className="text-red-500 dark:text-red-400" />
                </div>

                <div className="text-center">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">¿Cerrar sesión?</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Tu sesión actual se cerrará. Tendrás que volver a iniciar sesión.
                    </p>
                </div>

                <div className="flex gap-3 w-full">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        fullWidth
                        loading={loading}
                        loadingText="Saliendo..."
                        onClick={onConfirm}
                    >
                        <LogoutIcon sx={{ fontSize: 17 }} />
                        Cerrar sesión
                    </Button>
                </div>
            </div>
        </div>
    );
}
