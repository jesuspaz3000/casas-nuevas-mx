"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { ContractsService } from "@/features/contracts/services/contracts.service";
import { ContractCreateDTO, ContractType } from "@/features/contracts/types/contracts.types";
import { PropertiesService } from "@/features/properties/services/properties.service";
import { ClientsService } from "@/features/clients/services/clients.service";
import { UsersService } from "@/features/users/services/users.service";
import { Property } from "@/features/properties/types/properties.types";
import { Client } from "@/features/clients/types/clients.types";
import { User } from "@/features/users/types/users.types";
import { useAuthStore } from "@/store/auth.store";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";

interface Props { open: boolean; onClose: () => void; onCreated: () => void; }

const TYPE_OPTIONS: { value: ContractType; label: string }[] = [
    { value: "RESERVATION", label: "Reserva" },
    { value: "PURCHASE_AGREEMENT", label: "Compraventa" },
];

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";
const sectionTitleClass = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider";

type Form = {
    propertyId: string;
    clientId: string;
    agentId: string;
    contractType: ContractType;
    reservationPrice: string;
    salePrice: string;
    clientRfc: string;
    clientAddress: string;
    clientCfdiUse: string;
};
type Errors = Partial<Record<keyof Form, string>>;

const EMPTY: Form = {
    propertyId: "",
    clientId: "",
    agentId: "",
    contractType: "RESERVATION",
    reservationPrice: "",
    salePrice: "",
    clientRfc: "",
    clientAddress: "",
    clientCfdiUse: "",
};

export function ContractCreateDialog({ open, onClose, onCreated }: Props) {
    const authUser = useAuthStore((s) => s.user);
    const [form, setForm]               = useState<Form>(EMPTY);
    const [errors, setErrors]           = useState<Errors>({});
    const [loading, setLoading]         = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [properties, setProperties]   = useState<Property[]>([]);
    const [clients, setClients]         = useState<Client[]>([]);
    const [agents, setAgents]           = useState<User[]>([]);

    useEffect(() => {
        if (!open) return;
        Promise.all([
            PropertiesService.findAll(),
            ClientsService.findAll(),
            UsersService.findAll(),
        ])
            .then(([propsList, clientsList, usersList]) => {
                setProperties(propsList);
                setClients(clientsList);
                const ag = usersList.filter((u) => u.role === "AGENT" && u.isActive);
                setAgents(ag);
                setForm((prev) => ({
                    ...EMPTY,
                    agentId: authUser?.role === "AGENT" ? authUser.id : ag[0]?.id ?? "",
                }));
            })
            .catch(() => setServerError("No se pudieron cargar catálogos."));
    }, [open, authUser?.id, authUser?.role]);

    if (!open) return null;

    const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
        setServerError(null);
    };
    const setSel = (field: keyof Form) => (v: string) => {
        setForm((p) => ({ ...p, [field]: v }));
        setServerError(null);
    };

    const validate = () => {
        const errs: Errors = {};
        if (!form.propertyId) errs.propertyId = "Selecciona una propiedad";
        if (!form.clientId) errs.clientId = "Selecciona un cliente";
        if (!form.agentId) errs.agentId = "Selecciona un agente";
        if (!form.reservationPrice.trim()) errs.reservationPrice = "El monto de reserva es requerido";
        else if (isNaN(Number(form.reservationPrice)) || Number(form.reservationPrice) < 0) {
            errs.reservationPrice = "Monto inválido";
        }
        if (form.salePrice.trim() && (isNaN(Number(form.salePrice)) || Number(form.salePrice) < 0)) {
            errs.salePrice = "Monto inválido";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const dto: ContractCreateDTO = {
                propertyId: form.propertyId,
                clientId: form.clientId,
                agentId: form.agentId,
                contractType: form.contractType,
                reservationPrice: Number(form.reservationPrice),
                salePrice: form.salePrice.trim() ? Number(form.salePrice) : undefined,
                clientRfc: form.clientRfc.trim() || undefined,
                clientAddress: form.clientAddress.trim() || undefined,
                clientCfdiUse: form.clientCfdiUse.trim() || undefined,
            };
            await ContractsService.create(dto);
            setForm({
                ...EMPTY,
                agentId: authUser?.role === "AGENT" ? authUser.id : agents[0]?.id ?? "",
            });
            setErrors({});
            setServerError(null);
            onClose();
            onCreated();
        } catch {
            setServerError("No se pudo crear el contrato.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm(EMPTY);
        setErrors({});
        setServerError(null);
        onClose();
    };

    const propOptions = [
        { value: "", label: "Seleccionar propiedad" },
        ...properties.map((p) => ({ value: p.id, label: p.title })),
    ];
    const clientOptions = [
        { value: "", label: "Seleccionar cliente" },
        ...clients.map((c) => ({ value: c.id, label: c.name })),
    ];
    const agentOptions = agents.map((a) => ({ value: a.id, label: `${a.name} (${a.email})` }));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <DescriptionIcon sx={{ fontSize: 18 }} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nuevo contrato</h2>
                    </div>
                    <button type="button" onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 flex flex-col gap-6">
                        {serverError && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{serverError}</div>
                        )}

                        <div>
                            <p className={sectionTitleClass}>Relación</p>
                            <div className="mt-3 flex flex-col gap-4">
                                <div>
                                    <label className={labelClass}>Propiedad</label>
                                    <Select value={form.propertyId} onChange={(v) => setSel("propertyId")(v)} options={propOptions} className="w-full" />
                                    {errors.propertyId && <p className="text-xs text-red-500 mt-1">{errors.propertyId}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Cliente</label>
                                    <Select value={form.clientId} onChange={(v) => setSel("clientId")(v)} options={clientOptions} className="w-full" />
                                    {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Agente</label>
                                    <Select value={form.agentId} onChange={(v) => setSel("agentId")(v)} options={[{ value: "", label: "Seleccionar agente" }, ...agentOptions]} className="w-full" />
                                    {errors.agentId && <p className="text-xs text-red-500 mt-1">{errors.agentId}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Tipo de contrato</label>
                                    <Select
                                        value={form.contractType}
                                        onChange={(v) => setForm((p) => ({ ...p, contractType: v as ContractType }))}
                                        options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className={sectionTitleClass}>Montos</p>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Reserva (MXN) *</label>
                                    <input type="text" inputMode="decimal" value={form.reservationPrice} onChange={set("reservationPrice")} className={inputClass} placeholder="0" />
                                    {errors.reservationPrice && <p className="text-xs text-red-500 mt-1">{errors.reservationPrice}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Precio venta (opcional)</label>
                                    <input type="text" inputMode="decimal" value={form.salePrice} onChange={set("salePrice")} className={inputClass} placeholder="Opcional" />
                                    {errors.salePrice && <p className="text-xs text-red-500 mt-1">{errors.salePrice}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className={sectionTitleClass}>Datos fiscales del cliente</p>
                            <div className="mt-3 flex flex-col gap-4">
                                <div>
                                    <label className={labelClass}>RFC</label>
                                    <input type="text" value={form.clientRfc} onChange={set("clientRfc")} className={inputClass} maxLength={13} />
                                </div>
                                <div>
                                    <label className={labelClass}>Domicilio fiscal</label>
                                    <textarea value={form.clientAddress} onChange={set("clientAddress")} rows={2} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Uso CFDI</label>
                                    <input type="text" value={form.clientCfdiUse} onChange={set("clientCfdiUse")} className={inputClass} maxLength={10} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0">
                        <Button type="button" variant="ghost" size="md" onClick={handleClose}>Cancelar</Button>
                        <Button type="submit" variant="primary" size="md" loading={loading}>Crear contrato</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
