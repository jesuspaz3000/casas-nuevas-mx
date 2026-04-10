"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { PropertiesService } from "@/features/properties/services/properties.service";
import { UsersService } from "@/features/users/services/users.service";
import { PropertyCreateDTO, PropertyType, PropertyStatus } from "@/features/properties/types/properties.types";
import type { User } from "@/features/users/types/users.types";
import { useAuthStore } from "@/store/auth.store";
import CloseIcon from "@mui/icons-material/Close";
import HomeWorkIcon from "@mui/icons-material/HomeWork";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const TYPE_OPTIONS = [
    { value: "HOUSE",      label: "Casa" },
    { value: "APARTMENT",  label: "Apartamento" },
    { value: "LAND",       label: "Terreno" },
    { value: "COMMERCIAL", label: "Comercial" },
];

const STATUS_OPTIONS = [
    { value: "AVAILABLE", label: "Disponible" },
    { value: "RESERVED",  label: "Reservada" },
    { value: "SOLD",      label: "Vendida" },
];

const inputClass =
    "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";
const sectionClass = "flex flex-col gap-3";
const sectionTitleClass = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider";
const readonlyClass =
    "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200";

type FormState = {
    title: string; description: string;
    type: PropertyType; status: PropertyStatus;
    price: string;
    street: string; neighborhood: string; city: string; state: string; zipCode: string;
    bedrooms: string; bathrooms: string; areaM2: string;
    agentId: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
    title: "", description: "", type: "HOUSE", status: "AVAILABLE",
    price: "", street: "", neighborhood: "", city: "", state: "", zipCode: "",
    bedrooms: "", bathrooms: "", areaM2: "", agentId: "",
};

export function PropertyCreateDialog({ open, onClose, onCreated }: Props) {
    const authUser = useAuthStore((s) => s.user);
    const isAgent = authUser?.role === "AGENT";

    const [form, setForm]               = useState<FormState>(EMPTY);
    const [errors, setErrors]           = useState<FormErrors>({});
    const [loading, setLoading]         = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [agents, setAgents]           = useState<User[]>([]);

    useEffect(() => {
        if (!open) return;
        if (isAgent) {
            setAgents([]);
            setForm({ ...EMPTY, agentId: authUser?.id ?? "" });
            return;
        }
        UsersService.findAll()
            .then((list) => {
                setAgents(list.filter((u) => u.role === "AGENT" && u.isActive));
                setForm(EMPTY);
            })
            .catch(() => setAgents([]));
    }, [open, isAgent, authUser?.id]);

    if (!open) return null;

    const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((p) => ({ ...p, [field]: e.target.value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
        setServerError(null);
    };

    const setSelect = (field: keyof FormState) => (value: string) => {
        setForm((p) => ({ ...p, [field]: value }));
        setServerError(null);
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!form.title.trim())  errs.title = "El título es requerido";
        if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
            errs.price = "Ingresa un precio válido";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const dto: PropertyCreateDTO = {
                title:        form.title.trim(),
                type:         form.type as PropertyType,
                status:       form.status as PropertyStatus,
                price:        Number(form.price),
                description:  form.description  || undefined,
                street:       form.street       || undefined,
                neighborhood: form.neighborhood || undefined,
                city:         form.city         || undefined,
                state:        form.state        || undefined,
                zipCode:      form.zipCode      || undefined,
                bedrooms:     form.bedrooms  ? Number(form.bedrooms)  : undefined,
                bathrooms:    form.bathrooms ? Number(form.bathrooms) : undefined,
                areaM2:       form.areaM2    ? Number(form.areaM2)    : undefined,
                agentId:      isAgent ? authUser!.id : form.agentId || undefined,
            };
            await PropertiesService.create(dto);
            handleClose();
            onCreated();
        } catch {
            setServerError("No se pudo crear la propiedad. Verifica los datos.");
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

    const agentOptions = [
        { value: "", label: "Sin agente asignado" },
        ...agents.map((a) => ({ value: a.id, label: a.name })),
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header fijo */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <HomeWorkIcon sx={{ fontSize: 18 }} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nueva propiedad</h2>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                {/* Body scrollable */}
                <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 flex flex-col gap-6">

                        {serverError && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                                {serverError}
                            </div>
                        )}

                        {/* Información básica */}
                        <div className={sectionClass}>
                            <p className={sectionTitleClass}>Información básica</p>
                            <div>
                                <label className={labelClass}>Título</label>
                                <input type="text" placeholder="Ej. Casa en Polanco con jardín" value={form.title} onChange={set("title")} className={inputClass} />
                                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Tipo</label>
                                    <Select value={form.type} onChange={setSelect("type")} options={TYPE_OPTIONS} />
                                </div>
                                <div>
                                    <label className={labelClass}>Estado</label>
                                    <Select value={form.status} onChange={setSelect("status")} options={STATUS_OPTIONS} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Descripción</label>
                                <textarea placeholder="Descripción de la propiedad..." value={form.description} onChange={set("description")} rows={3}
                                    className={`${inputClass} resize-none`} />
                            </div>
                        </div>

                        {/* Precio */}
                        <div className={sectionClass}>
                            <p className={sectionTitleClass}>Precio</p>
                            <div>
                                <label className={labelClass}>Precio (MXN)</label>
                                <input type="number" min="0" placeholder="0.00" value={form.price} onChange={set("price")} className={inputClass} />
                                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                            </div>
                        </div>

                        {/* Ubicación */}
                        <div className={sectionClass}>
                            <p className={sectionTitleClass}>Ubicación</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Calle</label>
                                    <input type="text" placeholder="Ej. Av. Presidente Masaryk 123" value={form.street} onChange={set("street")} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Colonia</label>
                                    <input type="text" placeholder="Ej. Polanco" value={form.neighborhood} onChange={set("neighborhood")} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelClass}>Ciudad</label>
                                    <input type="text" placeholder="Ej. Ciudad de México" value={form.city} onChange={set("city")} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Estado</label>
                                    <input type="text" placeholder="Ej. CDMX" value={form.state} onChange={set("state")} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>C.P.</label>
                                    <input type="text" placeholder="11560" value={form.zipCode} onChange={set("zipCode")} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Características */}
                        <div className={sectionClass}>
                            <p className={sectionTitleClass}>Características</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelClass}>Habitaciones</label>
                                    <input type="number" min="0" placeholder="0" value={form.bedrooms} onChange={set("bedrooms")} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Baños</label>
                                    <input type="number" min="0" placeholder="0" value={form.bathrooms} onChange={set("bathrooms")} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Área (m²)</label>
                                    <input type="number" min="0" placeholder="0" value={form.areaM2} onChange={set("areaM2")} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Agente */}
                        <div className={sectionClass}>
                            <p className={sectionTitleClass}>Agente</p>
                            <div>
                                <label className={labelClass}>Agente asignado</label>
                                {isAgent ? (
                                    <div className={readonlyClass}>
                                        {authUser ? `${authUser.name} (${authUser.email})` : "—"}
                                    </div>
                                ) : (
                                    <Select value={form.agentId} onChange={setSelect("agentId")} options={agentOptions} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer fijo */}
                    <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                        <Button type="button" variant="secondary" fullWidth onClick={handleClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" variant="primary" fullWidth loading={loading} loadingText="Creando...">Crear propiedad</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
