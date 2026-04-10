"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppointmentsService } from "@/features/appointments/services/appointments.service";
import { Appointment, AppointmentStatus } from "@/features/appointments/types/appointments.types";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { User } from "@/features/users/types/users.types";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";

const DAY_START_H = 7;
const DAY_END_H = 20;
const SLOT_MIN = 30;
const ROWS = ((DAY_END_H - DAY_START_H) * 60) / SLOT_MIN;
const ROW_PX = 28;

function pad(n: number) {
    return String(n).padStart(2, "0");
}

/** Lunes de la semana de `d` (00:00 local). */
export function startOfWeekMonday(d: Date): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dow = x.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function toLocalDateTimeParam(dt: Date): string {
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;
}

function addDays(d: Date, n: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function minutesSinceDayStart(d: Date): number {
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function dayIndexInWeek(weekMonday: Date, appointmentStart: Date): number {
    const a = new Date(appointmentStart.getFullYear(), appointmentStart.getMonth(), appointmentStart.getDate());
    const m = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate());
    return Math.round((a.getTime() - m.getTime()) / 86400000);
}

function slotDatetimeLocal(weekMonday: Date, dayIndex: number, slotIndex: number): string {
    const d = addDays(weekMonday, dayIndex);
    const mins = DAY_START_H * 60 + slotIndex * SLOT_MIN;
    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

function slotKey(dayIndex: number, slotIndex: number): string {
    return `d${dayIndex}-s${slotIndex}`;
}

function parseSlotKey(key: string): { dayIndex: number; slotIndex: number } | null {
    const m = /^d(\d+)-s(\d+)$/.exec(key);
    if (!m) return null;
    return { dayIndex: Number(m[1]), slotIndex: Number(m[2]) };
}

/** Una sola fila de día; de la primera a la última celda (inclusive), en bloques de SLOT_MIN. */
function selectionToCreatePayload(
    weekMonday: Date,
    keys: Set<string>,
): { ok: true; scheduledAt: string; durationMinutes: number } | { ok: false; message: string } {
    if (keys.size === 0) return { ok: false, message: "" };
    const parsed = [...keys].map(parseSlotKey).filter((x): x is NonNullable<typeof x> => x != null);
    if (parsed.length !== keys.size) return { ok: false, message: "Selección inválida." };
    const days = new Set(parsed.map((p) => p.dayIndex));
    if (days.size !== 1) {
        return { ok: false, message: "Las celdas deben ser del mismo día." };
    }
    const dayIndex = parsed[0].dayIndex;
    const slots = [...new Set(parsed.map((p) => p.slotIndex))].sort((a, b) => a - b);
    const minS = slots[0];
    const maxS = slots[slots.length - 1];
    const startStr = slotDatetimeLocal(weekMonday, dayIndex, minS);
    const rawMin = 15;
    const rawMax = 480;
    const durationMinutes = Math.min(rawMax, Math.max(rawMin, (maxS - minS + 1) * SLOT_MIN));
    return { ok: true, scheduledAt: startStr, durationMinutes };
}

const EVENT_BG: Record<AppointmentStatus, string> = {
    PENDING: "bg-amber-500/95 text-white border-amber-600/50",
    CONFIRMED: "bg-blue-600/95 text-white border-blue-700/50",
    CANCELLED: "bg-gray-500/80 text-white border-gray-600/50",
    DONE: "bg-emerald-600/95 text-white border-emerald-700/50",
};

type Props = {
    weekStart: Date;
    onWeekChange: (nextMonday: Date) => void;
    /** Agente cuya agenda se muestra (admin elige; agente fijo). */
    selectedAgentId: string;
    onAgentChange: (id: string) => void;
    agentOptions: User[];
    isAgentRole: boolean;
    /** Incrementar tras crear/editar/eliminar cita para recargar la semana. */
    refreshToken?: number;
    /** Al confirmar creación tras elegir una o más celdas. */
    onConfirmSelection: (payload: { scheduledAt: string; durationMinutes: number }) => void;
    onAppointmentClick: (a: Appointment) => void;
};

export function AppointmentWeekCalendar({
    weekStart,
    onWeekChange,
    selectedAgentId,
    onAgentChange,
    agentOptions,
    isAgentRole,
    refreshToken = 0,
    onConfirmSelection,
    onAppointmentClick,
}: Props) {
    const [items, setItems] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
    const [selectionHint, setSelectionHint] = useState<string | null>(null);

    const weekEndExclusive = useMemo(() => addDays(weekStart, 7), [weekStart]);

    const load = useCallback(() => {
        if (!selectedAgentId) {
            setItems([]);
            return;
        }
        setLoading(true);
        setFetchError(null);
        const from = toLocalDateTimeParam(weekStart);
        const to = toLocalDateTimeParam(weekEndExclusive);
        AppointmentsService.findCalendar(selectedAgentId, from, to)
            .then(setItems)
            .catch(() => setFetchError("No se pudo cargar la agenda de la semana."))
            .finally(() => setLoading(false));
    }, [selectedAgentId, weekStart, weekEndExclusive]);

    useEffect(() => {
        load();
    }, [load, refreshToken]);

    useEffect(() => {
        setSelectedKeys(new Set());
        setSelectionHint(null);
    }, [weekStart, selectedAgentId]);

    const dayLabels = useMemo(() => {
        const names = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        return Array.from({ length: 7 }, (_, i) => {
            const d = addDays(weekStart, i);
            return `${names[i]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        });
    }, [weekStart]);

    const byDay = useMemo(() => {
        const map: Appointment[][] = Array.from({ length: 7 }, () => []);
        for (const a of items) {
            const start = new Date(a.scheduledAt);
            const idx = dayIndexInWeek(weekStart, start);
            if (idx >= 0 && idx < 7) map[idx].push(a);
        }
        return map;
    }, [items, weekStart]);

    const gridMinutes = (DAY_END_H - DAY_START_H) * 60;

    function eventStyle(a: Appointment): { top: string; height: string } {
        const start = new Date(a.scheduledAt);
        const mins = minutesSinceDayStart(start);
        const dur = a.durationMinutes ?? 60;
        const relStart = Math.max(0, mins - DAY_START_H * 60);
        const relEnd = Math.min(gridMinutes, relStart + dur);
        const h = Math.max(relEnd - relStart, 12);
        const topPct = (relStart / gridMinutes) * 100;
        const heightPct = (h / gridMinutes) * 100;
        return { top: `${topPct}%`, height: `${heightPct}%` };
    }

    const hourLabels = [];
    for (let h = DAY_START_H; h < DAY_END_H; h++) {
        hourLabels.push(`${pad(h)}:00`);
    }

    const agentSelectOptions = [
        { value: "", label: "Seleccionar agente…" },
        ...agentOptions.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })),
    ];

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onWeekChange(addDays(weekStart, -7))}
                        className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        aria-label="Semana anterior"
                    >
                        <ChevronLeftIcon />
                    </button>
                    <button
                        type="button"
                        onClick={() => onWeekChange(startOfWeekMonday(new Date()))}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={() => onWeekChange(addDays(weekStart, 7))}
                        className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        aria-label="Semana siguiente"
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                    Semana del {weekStart.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="w-full sm:w-auto sm:ml-auto sm:min-w-[280px] flex items-center gap-2">
                    <PersonIcon className="text-gray-400 shrink-0" sx={{ fontSize: 20 }} />
                    {isAgentRole ? (
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {agentOptions.find((u) => u.id === selectedAgentId)?.name ?? "Tu agenda"}
                        </span>
                    ) : (
                        <Select value={selectedAgentId} onChange={onAgentChange} options={agentSelectOptions} className="w-full" />
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                Horario {DAY_START_H}:00–{DAY_END_H}:00 · Cada celda es {SLOT_MIN} min. Clic en celdas vacías para seleccionar una o varias (mismo día); luego usa &quot;Crear cita&quot; o &quot;Descartar&quot;. Clic en un bloque de cita para editar.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-800/40 px-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                    {selectedKeys.size === 0 ? (
                        <span className="text-gray-500 dark:text-gray-400">Ninguna celda seleccionada.</span>
                    ) : (
                        <>
                            <span className="font-medium">{selectedKeys.size}</span> celda{selectedKeys.size !== 1 ? "s" : ""} seleccionada
                            {selectedKeys.size !== 1 ? "s" : ""}
                        </>
                    )}
                </p>
                {selectionHint && (
                    <p className="text-sm text-amber-700 dark:text-amber-300 sm:w-full">{selectionHint}</p>
                )}
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={selectedKeys.size === 0}
                        onClick={() => {
                            setSelectedKeys(new Set());
                            setSelectionHint(null);
                        }}
                    >
                        Descartar selección
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={!selectedAgentId || loading || selectedKeys.size === 0}
                        onClick={() => {
                            const r = selectionToCreatePayload(weekStart, selectedKeys);
                            if (!r.ok) {
                                setSelectionHint(r.message);
                                return;
                            }
                            setSelectionHint(null);
                            onConfirmSelection({ scheduledAt: r.scheduledAt, durationMinutes: r.durationMinutes });
                            setSelectedKeys(new Set());
                        }}
                    >
                        Crear cita con este horario
                    </Button>
                </div>
            </div>

            {fetchError && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2">
                    {fetchError}
                </div>
            )}

            {!selectedAgentId && !isAgentRole && (
                <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                    Elige un agente para ver su disponibilidad y citas.
                </div>
            )}

            <div className="flex overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/50">
                <div
                    className="shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 select-none relative"
                    style={{ width: 44, minHeight: ROWS * ROW_PX + 32 }}
                >
                    <div className="h-8 border-b border-gray-200 dark:border-gray-800" />
                    <div className="relative" style={{ height: ROWS * ROW_PX }}>
                        {hourLabels.map((label, hi) => (
                            <div
                                key={label}
                                className="absolute right-1 text-[10px] text-gray-400 tabular-nums leading-none"
                                style={{ top: hi * 2 * ROW_PX }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex min-w-[720px] flex-1">
                    {dayLabels.map((label, dayIdx) => (
                        <div
                            key={label}
                            className="flex-1 min-w-[100px] border-l border-gray-200 dark:border-gray-800 relative"
                            style={{ minHeight: ROWS * ROW_PX + 32 }}
                        >
                            <div className="sticky top-0 z-20 h-8 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-center text-[11px] font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800">
                                {label}
                            </div>
                            <div className="relative" style={{ height: ROWS * ROW_PX }}>
                                {Array.from({ length: ROWS }, (_, slotIdx) => {
                                    const k = slotKey(dayIdx, slotIdx);
                                    const isSel = selectedKeys.has(k);
                                    return (
                                        <button
                                            key={slotIdx}
                                            type="button"
                                            disabled={!selectedAgentId || loading}
                                            onClick={() => {
                                                setSelectionHint(null);
                                                setSelectedKeys((prev) => {
                                                    const next = new Set(prev);
                                                    if (next.has(k)) next.delete(k);
                                                    else next.add(k);
                                                    return next;
                                                });
                                            }}
                                            className={`absolute left-0 right-0 border-b border-gray-100 dark:border-gray-800/80 transition-colors cursor-pointer ${
                                                isSel
                                                    ? "bg-blue-500/25 dark:bg-blue-500/35 ring-1 ring-inset ring-blue-500/60 z-[5]"
                                                    : "hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
                                            } disabled:opacity-40 disabled:hover:bg-transparent disabled:ring-0`}
                                            style={{ top: (slotIdx / ROWS) * 100 + "%", height: 100 / ROWS + "%" }}
                                            aria-pressed={isSel}
                                            aria-label={`Celda ${label} ${slotIdx + 1}`}
                                        />
                                    );
                                })}
                                <div className="absolute inset-0 pointer-events-none z-10 px-0.5">
                                    {byDay[dayIdx].map((a) => {
                                        const st = eventStyle(a);
                                        const dur = a.durationMinutes ?? 60;
                                        return (
                                            <button
                                                key={a.id}
                                                type="button"
                                                className={`pointer-events-auto absolute left-0.5 right-0.5 rounded-md border text-left px-1.5 py-0.5 shadow-sm overflow-hidden ${EVENT_BG[a.status] ?? "bg-gray-600 text-white"}`}
                                                style={{ top: st.top, height: st.height, minHeight: 22 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedKeys(new Set());
                                                    setSelectionHint(null);
                                                    onAppointmentClick(a);
                                                }}
                                            >
                                                <span className="block text-[10px] font-semibold leading-tight truncate">
                                                    {new Date(a.scheduledAt).toLocaleTimeString("es-MX", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}{" "}
                                                    · {dur} min
                                                </span>
                                                <span className="block text-[9px] opacity-95 truncate leading-tight">{a.clientName}</span>
                                                <span className="block text-[9px] opacity-90 truncate leading-tight">{a.propertyTitle}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500" /> Pendiente
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-600" /> Confirmada
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-600" /> Realizada
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-500" /> Cancelada
                </span>
            </div>
        </div>
    );
}
