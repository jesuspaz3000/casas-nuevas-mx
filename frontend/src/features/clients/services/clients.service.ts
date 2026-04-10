import { ApiService } from "@/shared/services/api.service";
import { Client, ClientCreateDTO, ClientUpdateDTO, ClientFilterParams, ClientsResponse } from "@/features/clients/types/clients.types";

export const ClientsService = {
    findAll: async (): Promise<Client[]> => {
        const res = await ApiService.get<Client[]>("/clients");
        return res.data;
    },

    findPaginated: async (params: ClientFilterParams): Promise<ClientsResponse> => {
        const query: Record<string, unknown> = { limit: params.limit, offset: params.offset };
        if (params.search) query.search = params.search;
        if (params.status) query.status = params.status;
        const res = await ApiService.get<ClientsResponse>("/clients", { params: query });
        return res.data;
    },

    findById: async (id: string): Promise<Client> => {
        const res = await ApiService.get<Client>(`/clients/${id}`);
        return res.data;
    },

    create: async (dto: ClientCreateDTO): Promise<Client> => {
        const res = await ApiService.post<Client>("/clients", dto);
        return res.data;
    },

    update: async (id: string, dto: ClientUpdateDTO): Promise<Client> => {
        const res = await ApiService.patch<Client>(`/clients/${id}`, dto);
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await ApiService.delete(`/clients/${id}`);
    },
};
