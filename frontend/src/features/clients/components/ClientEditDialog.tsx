"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { ClientsService } from "@/features/clients/services/clients.service";
import { UsersService } from "@/features/users/services/users.service";
import { Client, ClientStatus } from "@/features/clients/types/clients.types";
import type { User } from "@/features/users/types/users.types";
import { useAuthStore } from "@/store/auth.store";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

interface Props { open: boolean; client: Client | null; onClose: () => void; onUpdated: () => void; }

const STATUS_OPTIONS = [
    { value: "LEAD",        label: "Prospecto" },
    { value: "INTERESTED",  label: "Interesado" },
    { value: "NEGOTIATING", label: "Negociando" },
    { value: "CLOSED",      label: "Cerrado" },
    { value: "LOST",        label: "Perdido" },
];

const TYPE_OPTIONS = [
    { value: "",           label: "Sin preferencia" },
    { value: "HOUSE",      label: "Casa" },
    { value: "APARTMENT",  label: "Apartamento" },
    { value: "LAND",       label: "Terreno" },
    { value: "COMMERCIAL", label: "Comercial" },
];

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";
const sectionTitleClass = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider";
const readonlyClass =
    "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200";

type Form = { name: string; email: string; phone: string; budgetMin: string; budgetMax: string; interestedType: string; interestedCity: string; status: string; notes: string; agentId: string; };
type Errors = Partial<Record<keyof Form, string>>;

function Skel() { return <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />; }

export function ClientEditDialog({ open, client, onClose, onUpdated }: Props) {
    const authUser = useAuthStore((s) => s.user);
    const isAgent = authUser?.role === "AGENT";

    const [form, setForm]               = useState<Form>({ name: "", email: "", phone: "", budgetMin: "", budgetMax: "", interestedType: "", interestedCity: "", status: "LEAD", notes: "", agentId: "" });
    const [fetched, setFetched]         = useState<Client | null>(null);
    const [isFetching, setIsFetching]   = useState(false);
    const [fetchError, setFetchError]   = useState<string | null>(null);
    const [errors, setErrors]           = useState<Errors>({});
    const [loading, setLoading]         = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [agents, setAgents]           = useState<User[]>([]);

    useEffect(() => {
        if (!open || !client) return;
        setIsFetching(true);
        setFetchError(null);
        setErrors({});
        setServerError(null);
        setFetched(null);

        const applyClient = (data: Client, users: User[]) => {
            setFetched(data);
            setAgents(users);
            setForm({
                name:           data.name ?? "",
                email:          data.email ?? "",
                phone:          data.phone ?? "",
                budgetMin:      data.budgetMin != null ? String(data.budgetMin) : "",
                budgetMax:      data.budgetMax != null ? String(data.budgetMax) : "",
                interestedType: data.interestedType ?? "",
                interestedCity: data.interestedCity ?? "",
                status:         data.status,
                notes:          data.notes ?? "",
                agentId:        data.agentId ?? "",
            });
        };

        if (isAgent) {
            ClientsService.findById(client.id)
                .then((data) => applyClient(data, []))
                .catch(() => setFetchError("No se pudieron cargar los datos del cliente."))
                .finally(() => setIsFetching(false));
        } else {
            Promise.all([ClientsService.findById(client.id), UsersService.findAll()])
                .then(([data, users]) =>
                    applyClient(
                        data,
                        users.filter((u) => u.role === "AGENT" && u.isActive),
                    ),
                )
                .catch(() => setFetchError("No se pudieron cargar los datos del cliente."))
                .finally(() => setIsFetching(false));
        }
    }, [open, client, isAgent]);

    if (!open || !client) return null;

    const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
        setServerError(null);
    };
    const setSel = (field: keyof Form) => (v: string) => { setForm((p) => ({ ...p, [field]: v })); setServerError(null); };

    const validate = () => {
        const errs: Errors = {};
        if (!form.name.trim()) errs.name = "El nombre es requerido";
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email inválido";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fetched || !validate()) return;
        setLoading(true);
        try {
            await ClientsService.update(client.id, {
                name:          form.name.trim()      || undefined,
                email:         form.email            || undefined,
                phone:         form.phone            || undefined,
                budgetMin:     form.budgetMin        ? Number(form.budgetMin)  : undefined,
                budgetMax:     form.budgetMax        ? Number(form.budgetMax)  : undefined,
                interestedType: form.interestedType  ? form.interestedType as never : undefined,
                interestedCity: form.interestedCity  || undefined,
                status:        form.status as ClientStatus,
                notes:         form.notes            || undefined,
                agentId:       isAgent ? undefined : form.agentId || undefined,
            });
            onClose(); onUpdated();
        } catch {
            setServerError("No se pudo actualizar el cliente.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => { setErrors({}); setServerError(null); setFetchError(null); onClose(); };
    const agentOptions = [{ value: "", label: "Sin agente asignado" }, ...agents.map((a) => ({ value: a.id, label: a.name }))];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full sm:max-w-xl sm:mx-auto flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <EditIcon sx={{ fontSize: 18 }} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Editar cliente</h2>
                            <p className="text-xs text-gray-400">{client.name}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1">
                    <div className="px-4 sm:px-6 py-5 flex flex-col gap-6">
                        {fetchError  && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{fetchError}</div>}
                        {serverError && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{serverError}</div>}

                        {/* Datos del cliente */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Datos del cliente</p>
                            <div>
                                <label className={labelClass}>Nombre completo</label>
                                {isFetching ? <Skel /> : <><input type="text" placeholder="María González" value={form.name} onChange={set("name")} className={inputClass} />{errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}</>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Correo electrónico</label>
                                    {isFetching ? <Skel /> : <><input type="email" placeholder="maria@ejemplo.com" value={form.email} onChange={set("email")} className={inputClass} />{errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}</>}
                                </div>
                                <div>
                                    <label className={labelClass}>Teléfono</label>
                                    {isFetching ? <Skel /> : <input type="tel" placeholder="55 1234 5678" value={form.phone} onChange={set("phone")} className={inputClass} />}
                                </div>
                            </div>
                        </div>

                        {/* Preferencias */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Preferencias de búsqueda</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Tipo de propiedad</label>
                                    {isFetching ? <Skel /> : <Select value={form.interestedType} onChange={setSel("interestedType")} options={TYPE_OPTIONS} />}
                                </div>
                                <div>
                                    <label className={labelClass}>Ciudad de interés</label>
                                    {isFetching ? <Skel /> : <input type="text" placeholder="Ciudad de México" value={form.interestedCity} onChange={set("interestedCity")} className={inputClass} />}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Presupuesto mínimo (MXN)</label>
                                    {isFetching ? <Skel /> : <input type="number" min="0" placeholder="0" value={form.budgetMin} onChange={set("budgetMin")} className={inputClass} />}
                                </div>
                                <div>
                                    <label className={labelClass}>Presupuesto máximo (MXN)</label>
                                    {isFetching ? <Skel /> : <input type="number" min="0" placeholder="0" value={form.budgetMax} onChange={set("budgetMax")} className={inputClass} />}
                                </div>
                            </div>
                        </div>

                        {/* CRM */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Estado CRM</p>
                            <div>
                                <label className={labelClass}>Estatus</label>
                                {isFetching ? <Skel /> : <Select value={form.status} onChange={setSel("status")} options={STATUS_OPTIONS} />}
                            </div>
                            <div>
                                <label className={labelClass}>Notas</label>
                                {isFetching ? <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" /> : <textarea placeholder="Observaciones..." value={form.notes} onChange={set("notes")} rows={3} className={`${inputClass} resize-none`} />}
                            </div>
                        </div>

                        {/* Agente */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Agente</p>
                            <div>
                                <label className={labelClass}>Agente asignado</label>
                                {isFetching ? (
                                    <Skel />
                                ) : isAgent ? (
                                    <div className={readonlyClass}>
                                        {fetched?.agentName ??
                                            (authUser ? `${authUser.name} (${authUser.email})` : "—")}
                                    </div>
                                ) : (
                                    <Select value={form.agentId} onChange={setSel("agentId")} options={agentOptions} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                        <Button type="button" variant="secondary" fullWidth onClick={handleClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" variant="primary" fullWidth loading={loading} loadingText="Guardando..." disabled={isFetching || !!fetchError}>Guardar cambios</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
