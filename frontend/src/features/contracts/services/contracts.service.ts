import api from "@/lib/axios";
import { ApiService } from "@/shared/services/api.service";
import {
    Contract,
    ContractCreateDTO,
    ContractUpdateDTO,
    ContractFilterParams,
    ContractsResponse,
} from "@/features/contracts/types/contracts.types";

/** Abre el PDF guardado en una pestaña nueva usando la sesión (cookies). */
export async function openStoredPdf(pdfPath: string): Promise<void> {
    const path = pdfPath.startsWith("/") ? pdfPath : `/${pdfPath}`;
    const res = await api.get<Blob>(path, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
        window.URL.revokeObjectURL(url);
        throw new Error("No se pudo abrir una nueva pestaña");
    }
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

export const ContractsService = {
    findAll: async (): Promise<Contract[]> => {
        const res = await ApiService.get<Contract[]>("/contracts");
        return res.data;
    },

    findPaginated: async (params: ContractFilterParams): Promise<ContractsResponse> => {
        const query: Record<string, unknown> = { limit: params.limit, offset: params.offset };
        if (params.search) query.search = params.search;
        if (params.status) query.status = params.status;
        if (params.contractType) query.contractType = params.contractType;
        const res = await ApiService.get<ContractsResponse>("/contracts", { params: query });
        return res.data;
    },

    findById: async (id: string): Promise<Contract> => {
        const res = await ApiService.get<Contract>(`/contracts/${id}`);
        return res.data;
    },

    create: async (dto: ContractCreateDTO): Promise<Contract> => {
        const res = await ApiService.post<Contract>("/contracts", dto);
        return res.data;
    },

    update: async (id: string, dto: ContractUpdateDTO): Promise<Contract> => {
        const res = await ApiService.patch<Contract>(`/contracts/${id}`, dto);
        return res.data;
    },

    /** Descarga el PDF generado/regenerado por el backend (también persiste en disco). */
    downloadPdf: async (id: string, folio: string): Promise<void> => {
        const res = await api.get<Blob>(`/contracts/${id}/pdf`, { responseType: "blob" });
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contrato-${folio}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },

    /** Envía al cliente un correo de texto con resumen del contrato (requiere SMTP en el servidor). */
    sendClientEmail: async (id: string): Promise<{ message: string }> => {
        const res = await ApiService.post<{ message: string }>(`/contracts/${id}/send-client-email`, {});
        return res.data;
    },
};
