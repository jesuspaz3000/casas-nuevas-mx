"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { AppointmentsService } from "@/features/appointments/services/appointments.service";
import { AppointmentCreateDTO, AppointmentStatus } from "@/features/appointments/types/appointments.types";
import { PropertiesService } from "@/features/properties/services/properties.service";
import { ClientsService } from "@/features/clients/services/clients.service";
import { UsersService } from "@/features/users/services/users.service";
import { Property } from "@/features/properties/types/properties.types";
import { Client } from "@/features/clients/types/clients.types";
import { User } from "@/features/users/types/users.types";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

interface Props { open: boolean; onClose: () => void; onCreated: () => void; }

const STATUS_OPTIONS = [
    { value: "PENDING",   label: "Pendiente" },
    { value: "CONFIRMED", label: "Confirmada" },
    { value: "CANCELLED", label: "Cancelada" },
    { value: "DONE",      label: "Realizada" },
];

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";
const sectionTitleClass = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider";

type Form = { propertyId: string; clientId: string; agentId: string; scheduledAt: string; status: string; notes: string; };
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = { propertyId: "", clientId: "", agentId: "", scheduledAt: "", status: "PENDING", notes: "" };

function Skel() { return <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />; }

export function AppointmentCreateDialog({ open, onClose, onCreated }: Props) {
    const [form, setForm]               = useState<Form>(EMPTY);
    const [errors, setErrors]           = useState<Errors>({});
    const [loading, setLoading]         = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [properties, setProperties]   = useState<Property[]>([]);
    const [clients, setClients]         = useState<Client[]>([]);
    const [agents, setAgents]           = useState<User[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoadingData(true);
        Promise.all([PropertiesService.findAll(), ClientsService.findAll(), UsersService.findAll()])
            .then(([props, cls, usrs]) => { setProperties(props); setClients(cls); setAgents(usrs); })
            .catch(() => {})
            .finally(() => setLoadingData(false));
    }, [open]);

    if (!open) return null;

    const setSel = (field: keyof Form) => (v: string) => { setForm((p) => ({ ...p, [field]: v })); setErrors((p) => ({ ...p, [field]: undefined })); setServerError(null); };
    const set    = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
        setServerError(null);
    };

    const validate = () => {
        const errs: Errors = {};
        if (!form.propertyId)   errs.propertyId   = "Selecciona una propiedad";
        if (!form.clientId)     errs.clientId     = "Selecciona un cliente";
        if (!form.agentId)      errs.agentId      = "Selecciona un agente";
        if (!form.scheduledAt)  errs.scheduledAt  = "La fecha y hora son requeridas";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const dto: AppointmentCreateDTO = {
                propertyId:  form.propertyId,
                clientId:    form.clientId,
                agentId:     form.agentId,
                scheduledAt: new Date(form.scheduledAt).toISOString(),
                status:      form.status as AppointmentStatus,
                notes:       form.notes || undefined,
            };
            await AppointmentsService.create(dto);
            setForm(EMPTY); setErrors({}); setServerError(null); onClose(); onCreated();
        } catch {
            setServerError("No se pudo registrar la cita.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => { setForm(EMPTY); setErrors({}); setServerError(null); onClose(); };

    const propertyOptions = [{ value: "", label: "Seleccionar propiedad..." }, ...properties.map((p) => ({ value: p.id, label: `${p.title}${p.city ? ` · ${p.city}` : ""}` }))];
    const clientOptions   = [{ value: "", label: "Seleccionar cliente..." },   ...clients.map((c) => ({ value: c.id, label: c.name }))];
    const agentOptions    = [{ value: "", label: "Seleccionar agente..." },    ...agents.map((a) => ({ value: a.id, label: a.name }))];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <CalendarMonthIcon sx={{ fontSize: 18 }} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nueva cita</h2>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 flex flex-col gap-6">
                        {serverError && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{serverError}</div>}

                        {/* Relaciones */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Datos de la cita</p>
                            <div>
                                <label className={labelClass}>Propiedad</label>
                                {loadingData ? <Skel /> : <Select value={form.propertyId} onChange={setSel("propertyId")} options={propertyOptions} />}
                                {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Cliente</label>
                                    {loadingData ? <Skel /> : <Select value={form.clientId} onChange={setSel("clientId")} options={clientOptions} />}
                                    {errors.clientId && <p className="mt-1 text-xs text-red-500">{errors.clientId}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Agente</label>
                                    {loadingData ? <Skel /> : <Select value={form.agentId} onChange={setSel("agentId")} options={agentOptions} />}
                                    {errors.agentId && <p className="mt-1 text-xs text-red-500">{errors.agentId}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Fecha y estado */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Programación</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Fecha y hora</label>
                                    <input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} className={inputClass} />
                                    {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Estado</label>
                                    <Select value={form.status} onChange={setSel("status")} options={STATUS_OPTIONS} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Notas</label>
                                <textarea placeholder="Observaciones de la visita..." value={form.notes} onChange={set("notes")} rows={3} className={`${inputClass} resize-none`} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                        <Button type="button" variant="secondary" fullWidth onClick={handleClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" variant="primary" fullWidth loading={loading} loadingText="Registrando...">Registrar cita</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
