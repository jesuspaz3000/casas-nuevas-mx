"use client";

import { useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { UsersService } from "@/features/users/services/users.service";
import { Role } from "@/features/auth/types/auth.types";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

interface FormState {
    name: string;
    email: string;
    password: string;
    role: Role;
}

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
}

const inputClass =
    "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";

export function UserCreateDialog({ open, onClose, onCreated }: Props) {
    const [form, setForm] = useState<FormState>({ name: "", email: "", password: "", role: "AGENT" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    if (!open) return null;

    const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setServerError(null);
    };

    const setField = (field: keyof FormState) => (value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setServerError(null);
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!form.name.trim()) errs.name = "El nombre es requerido";
        if (!form.email.trim()) {
            errs.email = "El email es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errs.email = "El email no es válido";
        }
        if (!form.password) {
            errs.password = "La contraseña es requerida";
        } else if (form.password.length < 8) {
            errs.password = "Mínimo 8 caracteres";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await UsersService.create(form);
            handleClose();
            onCreated();
        } catch {
            setServerError("No se pudo crear el usuario. Verifica los datos e intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({ name: "", email: "", password: "", role: "AGENT" });
        setErrors({});
        setServerError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <PersonAddIcon sx={{ fontSize: 18 }} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Nuevo usuario
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="px-6 py-5 flex flex-col gap-4">
                    {serverError && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Nombre completo</label>
                        <input
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            value={form.name}
                            onChange={set("name")}
                            className={inputClass}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Correo electrónico</label>
                        <input
                            type="email"
                            placeholder="juan@ejemplo.com"
                            value={form.email}
                            onChange={set("email")}
                            className={inputClass}
                            autoComplete="new-email"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Contraseña</label>
                        <input
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            value={form.password}
                            onChange={set("password")}
                            className={inputClass}
                            autoComplete="new-password"
                        />
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Rol</label>
                        <Select
                            value={form.role}
                            onChange={setField("role")}
                            options={[
                                { value: "AGENT", label: "Agente" },
                                { value: "ADMIN", label: "Administrador" },
                            ]}
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="secondary" fullWidth onClick={handleClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" fullWidth loading={loading} loadingText="Creando...">
                            Crear usuario
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
