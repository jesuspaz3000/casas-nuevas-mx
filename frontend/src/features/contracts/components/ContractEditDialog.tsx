"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { ContractsService } from "@/features/contracts/services/contracts.service";
import { Contract, ContractStatus, ContractUpdateDTO } from "@/features/contracts/types/contracts.types";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

interface Props { open: boolean; contract: Contract | null; onClose: () => void; onUpdated: () => void; }

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
    { value: "DRAFT", label: "Borrador" },
    { value: "PENDING_SIGNATURE", label: "Pendiente de firma" },
    { value: "SIGNED", label: "Firmado" },
    { value: "CANCELLED", label: "Cancelado" },
];

const inputClass = "w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";
const sectionTitleClass = "text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider";

type Form = {
    status: ContractStatus;
    salePrice: string;
    clientRfc: string;
    clientAddress: string;
    clientCfdiUse: string;
};
type Errors = Partial<Record<keyof Form, string>>;

function Skel() {
    return <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
}

export function ContractEditDialog({ open, contract, onClose, onUpdated }: Props) {
    const [form, setForm]               = useState<Form>({
        status: "DRAFT", salePrice: "", clientRfc: "", clientAddress: "", clientCfdiUse: "",
    });
    const [fetched, setFetched]         = useState<Contract | null>(null);
    const [isFetching, setIsFetching]   = useState(false);
    const [fetchError, setFetchError]   = useState<string | null>(null);
    const [errors, setErrors]           = useState<Errors>({});
    const [loading, setLoading]         = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailNotice, setEmailNotice] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        if (!open || !contract) return;
        setIsFetching(true);
        setFetchError(null);
        setErrors({});
        setServerError(null);
        setFetched(null);
        setEmailNotice(null);
        ContractsService.findById(contract.id)
            .then((data) => {
                setFetched(data);
                setForm({
                    status: data.status,
                    salePrice: data.salePrice != null ? String(data.salePrice) : "",
                    clientRfc: data.clientRfc ?? "",
                    clientAddress: data.clientAddress ?? "",
                    clientCfdiUse: data.clientCfdiUse ?? "",
                });
            })
            .catch(() => setFetchError("No se pudieron cargar los datos del contrato."))
            .finally(() => setIsFetching(false));
    }, [open, contract]);

    if (!open || !contract) return null;

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
        if (form.salePrice.trim() && (isNaN(Number(form.salePrice)) || Number(form.salePrice) < 0)) {
            errs.salePrice = "Monto inválido";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fetched || !validate()) return;
        setLoading(true);
        try {
            const dto: ContractUpdateDTO = {
                status: form.status,
                salePrice: form.salePrice.trim() ? Number(form.salePrice) : undefined,
                clientRfc: form.clientRfc.trim() || undefined,
                clientAddress: form.clientAddress.trim() || undefined,
                clientCfdiUse: form.clientCfdiUse.trim() || undefined,
            };
            await ContractsService.update(contract.id, dto);
            setServerError(null);
            onClose();
            onUpdated();
        } catch {
            setServerError("No se pudo actualizar el contrato.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setServerError(null);
        setFetchError(null);
        setEmailNotice(null);
        onClose();
    };

    const handleSendClientEmail = async () => {
        if (!fetched) return;
        setEmailLoading(true);
        setEmailNotice(null);
        try {
            const { message } = await ContractsService.sendClientEmail(contract.id);
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
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <EditIcon sx={{ fontSize: 18 }} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Editar contrato</h2>
                            {fetched && <p className="text-xs text-gray-500 dark:text-gray-400">{fetched.folio}</p>}
                        </div>
                    </div>
                    <button type="button" onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 flex flex-col gap-6">
                        {fetchError && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{fetchError}</div>
                        )}
                        {isFetching && (
                            <div className="space-y-3">
                                <Skel /><Skel /><Skel />
                            </div>
                        )}
                        {!isFetching && fetched && (
                            <>
                                {serverError && (
                                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">{serverError}</div>
                                )}
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

                                <div className="text-sm text-gray-600 dark:text-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 space-y-1">
                                    <p><span className="text-gray-400">Propiedad:</span> {fetched.propertyTitle}</p>
                                    <p><span className="text-gray-400">Cliente:</span> {fetched.clientName}</p>
                                    <p><span className="text-gray-400">Agente:</span> {fetched.agentName}</p>
                                    <p><span className="text-gray-400">Reserva:</span>{" "}
                                        {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(fetched.reservationPrice)}
                                    </p>
                                </div>

                                <div>
                                    <p className={sectionTitleClass}>Estado</p>
                                    <div className="mt-3">
                                        <label className={labelClass}>Estatus del contrato</label>
                                        <Select
                                            value={form.status}
                                            onChange={(v) => setSel("status")(v as ContractStatus)}
                                            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <p className={sectionTitleClass}>Montos y fiscales</p>
                                    <div className="mt-3 flex flex-col gap-4">
                                        <div>
                                            <label className={labelClass}>Precio de venta (opcional)</label>
                                            <input type="text" inputMode="decimal" value={form.salePrice} onChange={set("salePrice")} className={inputClass} />
                                            {errors.salePrice && <p className="text-xs text-red-500 mt-1">{errors.salePrice}</p>}
                                        </div>
                                        <div>
                                            <label className={labelClass}>RFC cliente</label>
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
                            </>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3 flex-shrink-0">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            fullWidth
                            loading={emailLoading}
                            loadingText="Enviando..."
                            disabled={isFetching || !fetched || loading}
                            onClick={handleSendClientEmail}
                        >
                            <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                            Enviar resumen por correo al cliente
                        </Button>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="ghost" size="md" onClick={handleClose}>Cancelar</Button>
                            <Button type="submit" variant="primary" size="md" loading={loading} disabled={isFetching || !fetched}>
                                Guardar cambios
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
