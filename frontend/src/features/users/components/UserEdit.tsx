"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { UsersService } from "@/features/users/services/users.service";
import { User } from "@/features/users/types/users.types";
import { Role } from "@/features/auth/types/auth.types";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

interface Props {
    open: boolean;
    user: User | null;   // solo se usa el id para el fetch y el name para el header
    onClose: () => void;
    onUpdated: () => void;
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
}

const inputClass =
    "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";

function FieldSkeleton() {
    return <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
}

export function UserEditDialog({ open, user, onClose, onUpdated }: Props) {
    const [form, setForm] = useState<FormState>({ name: "", email: "", password: "", role: "AGENT" });
    const [fetchedUser, setFetchedUser] = useState<User | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Cada vez que se abre con un usuario, llamar al servicio findById
    useEffect(() => {
        if (!open || !user) return;

        setIsFetching(true);
        setFetchError(null);
        setErrors({});
        setServerError(null);
        setForm({ name: "", email: "", password: "", role: "AGENT" });
        setFetchedUser(null);

        UsersService.findById(user.id)
            .then((data) => {
                setFetchedUser(data);
                setForm({ name: data.name, email: data.email, password: "", role: data.role });
            })
            .catch(() => setFetchError("No se pudieron cargar los datos del usuario."))
            .finally(() => setIsFetching(false));
    }, [open, user]);

    if (!open || !user) return null;

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
        if (form.password && form.password.length < 8) {
            errs.password = "Mínimo 8 caracteres";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fetchedUser || !validate()) return;
        setLoading(true);
        try {
            const dto: Record<string, string> = {};
            if (form.name !== fetchedUser.name)   dto.name  = form.name;
            if (form.email !== fetchedUser.email)  dto.email = form.email;
            if (form.password)                     dto.password = form.password;
            if (form.role !== fetchedUser.role)    dto.role  = form.role;

            await UsersService.update(user.id, dto);
            handleClose();
            onUpdated();
        } catch {
            setServerError("No se pudo actualizar el usuario. Verifica los datos e intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        setServerError(null);
        setFetchError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <EditIcon sx={{ fontSize: 18 }} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Editar usuario
                            </h2>
                            <p className="text-xs text-gray-400">{user.name}</p>
                        </div>
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

                    {/* Error al cargar */}
                    {fetchError && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                            {fetchError}
                        </div>
                    )}

                    {/* Error del servidor */}
                    {serverError && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label className={labelClass}>Nombre completo</label>
                        {isFetching ? <FieldSkeleton /> : (
                            <>
                                <input
                                    type="text"
                                    placeholder="Ej. Juan Pérez"
                                    value={form.name}
                                    onChange={set("name")}
                                    className={inputClass}
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Correo electrónico</label>
                        {isFetching ? <FieldSkeleton /> : (
                            <>
                                <input
                                    type="email"
                                    placeholder="juan@ejemplo.com"
                                    value={form.email}
                                    onChange={set("email")}
                                    className={inputClass}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                            </>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>
                            Nueva contraseña{" "}
                            <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>
                        </label>
                        {isFetching ? <FieldSkeleton /> : (
                            <>
                                <input
                                    type="password"
                                    placeholder="Mínimo 8 caracteres"
                                    value={form.password}
                                    onChange={set("password")}
                                    className={inputClass}
                                    autoComplete="new-password"
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                            </>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Rol</label>
                        {isFetching ? <FieldSkeleton /> : (
                            <Select
                                value={form.role}
                                onChange={setField("role")}
                                options={[
                                    { value: "AGENT", label: "Agente" },
                                    { value: "ADMIN", label: "Administrador" },
                                ]}
                            />
                        )}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <Button type="button" variant="secondary" fullWidth onClick={handleClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                            loadingText="Guardando..."
                            disabled={isFetching || !!fetchError}
                        >
                            Guardar cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
