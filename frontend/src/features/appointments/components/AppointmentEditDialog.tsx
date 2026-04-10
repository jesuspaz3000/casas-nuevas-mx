"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { localDatetimeInputToApi } from "@/shared/utils/appointmentLocalDateTime";
import { AppointmentsService } from "@/features/appointments/services/appointments.service";
import { Appointment, AppointmentStatus } from "@/features/appointments/types/appointments.types";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

interface Props { open: boolean; appointment: Appointment | null; onClose: () => void; onUpdated: () => void; }

const STATUS_OPTIONS = [
    { value: "PENDING",   label: "Pendiente" },
    { value: "CONFIRMED", label: "Confirmada" },
    { value: "CANCELLED", label: "Cancelada" },
    { value: "DONE",      label: "Realizada" },
];

const DURATION_OPTIONS = [
    { value: "30", label: "30 min" },
    { value: "45", label: "45 min" },
    { value: "60", label: "1 h" },
    { value: "90", label: "1 h 30" },
    { value: "120", label: "2 h" },
];

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";
const sectionTitleClass = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider";
const readonlyClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400";

type Form = { scheduledAt: string; durationMinutes: string; status: string; notes: string; };
type Errors = Partial<Record<keyof Form, string>>;

function Skel() { return <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />; }

function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentEditDialog({ open, appointment, onClose, onUpdated }: Props) {
    const [form, setForm]               = useState<Form>({ scheduledAt: "", durationMinutes: "60", status: "PENDING", notes: "" });
    const [fetched, setFetched]         = useState<Appointment | null>(null);
    const [isFetching, setIsFetching]   = useState(false);
    const [fetchError, setFetchError]   = useState<string | null>(null);
    const [errors, setErrors]           = useState<Errors>({});
    const [loading, setLoading]         = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailNotice, setEmailNotice] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        if (!open || !appointment) return;
        setIsFetching(true); setFetchError(null); setErrors({});         setServerError(null); setFetched(null); setEmailNotice(null);
        AppointmentsService.findById(appointment.id)
            .then((data) => {
                setFetched(data);
                setForm({
                    scheduledAt: toDatetimeLocal(data.scheduledAt),
                    durationMinutes: String(data.durationMinutes ?? 60),
                    status:      data.status,
                    notes:       data.notes ?? "",
                });
            })
            .catch(() => setFetchError("No se pudieron cargar los datos de la cita."))
            .finally(() => setIsFetching(false));
    }, [open, appointment]);

    if (!open || !appointment) return null;

    const setSel = (field: keyof Form) => (v: string) => { setForm((p) => ({ ...p, [field]: v })); setServerError(null); };
    const set    = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
        setServerError(null);
    };

    const validate = () => {
        const errs: Errors = {};
        if (!form.scheduledAt) errs.scheduledAt = "La fecha y hora son requeridas";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fetched || !validate()) return;
        setLoading(true);
        try {
            await AppointmentsService.update(appointment.id, {
                scheduledAt: localDatetimeInputToApi(form.scheduledAt),
                durationMinutes: Number(form.durationMinutes) || 60,
                status:      form.status as AppointmentStatus,
                notes:       form.notes || undefined,
            });
            onClose(); onUpdated();
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === "object") {
                const m = (e.response.data as { message?: string }).message;
                if (typeof m === "string" && m.trim()) setServerError(m);
                else setServerError("No se pudo actualizar la cita.");
            } else {
                setServerError("No se pudo actualizar la cita.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => { setErrors({}); setServerError(null); setFetchError(null); setEmailNotice(null); onClose(); };

    const handleSendConfirmationEmail = async () => {
        if (!fetched) return;
        setEmailLoading(true);
        setEmailNotice(null);
        try {
            const { message } = await AppointmentsService.sendConfirmationEmail(appointment.id);
            setEmailNotice({ ok: true, text: message });
        } catch (e: unknown) {
            if (axios.isAxiosError(e) && e.response?.data && typeof e.response.data === "object") {
                const m = (e.response.data as { message?: string }).message;
                setEmailNotice({ ok: false, text: typeof m === "string" && m.trim() ? m : "No se pudo enviar el correo." });
            } else {
                setEmailNotice({ ok: false, text: "No se pudo enviar el correo." });
            }
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <EditIcon sx={{ fontSize: 18 }} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Editar cita</h2>
                            <p className="text-xs text-gray-400">{appointment.clientName} · {appointment.propertyTitle}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 flex flex-col gap-6">
                        {fetchError  && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{fetchError}</div>}
                        {serverError && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{serverError}</div>}
                        {emailNotice && (
                            <div
                                className={
                                    emailNotice.ok
                                        ? "text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5"
                                        : "text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5"
                                }
                            >
                                {emailNotice.text}
                            </div>
                        )}

                        {/* Info de solo lectura */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Información (solo lectura)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Propiedad</label>
                                    <div className={readonlyClass}>{appointment.propertyTitle}</div>
                                </div>
                                <div>
                                    <label className={labelClass}>Cliente</label>
                                    <div className={readonlyClass}>{appointment.clientName}</div>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Agente</label>
                                <div className={readonlyClass}>{appointment.agentName}</div>
                            </div>
                        </div>

                        {/* Editable */}
                        <div className="flex flex-col gap-3">
                            <p className={sectionTitleClass}>Programación</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Inicio</label>
                                    {isFetching ? <Skel /> : <input type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} className={inputClass} />}
                                    {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Duración</label>
                                    {isFetching ? <Skel /> : <Select value={form.durationMinutes} onChange={setSel("durationMinutes")} options={DURATION_OPTIONS} />}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Estado</label>
                                {isFetching ? <Skel /> : <Select value={form.status} onChange={setSel("status")} options={STATUS_OPTIONS} />}
                            </div>
                            <div>
                                <label className={labelClass}>Notas</label>
                                {isFetching
                                    ? <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                                    : <textarea placeholder="Observaciones..." value={form.notes} onChange={set("notes")} rows={3} className={`${inputClass} resize-none`} />
                                }
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            loading={emailLoading}
                            loadingText="Enviando..."
                            disabled={isFetching || !!fetchError || loading}
                            onClick={handleSendConfirmationEmail}
                        >
                            <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                            Enviar correo de confirmación al cliente
                        </Button>
                        <div className="flex gap-3">
                            <Button type="button" variant="secondary" fullWidth onClick={handleClose} disabled={loading}>Cancelar</Button>
                            <Button type="submit" variant="primary" fullWidth loading={loading} loadingText="Guardando..." disabled={isFetching || !!fetchError}>Guardar cambios</Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
