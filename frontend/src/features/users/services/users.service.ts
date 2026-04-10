import { ApiService } from "@/shared/services/api.service";
import { User, UserCreateDTO, UserUpdateDTO, UsersResponse } from "@/features/users/types/users.types";

export interface UserFindParams {
    limit: number;
    offset: number;
    search?: string;
}

export const UsersService = {
    findAll: async (): Promise<User[]> => {
        const res = await ApiService.get<User[]>("/users");
        return res.data;
    },

    findPaginated: async (params: UserFindParams): Promise<UsersResponse> => {
        const query: Record<string, unknown> = { limit: params.limit, offset: params.offset };
        if (params.search) query.search = params.search;
        const res = await ApiService.get<UsersResponse>("/users", { params: query });
        return res.data;
    },

    findById: async (id: string): Promise<User> => {
        const res = await ApiService.get<User>(`/users/${id}`);
        return res.data;
    },

    create: async (dto: UserCreateDTO): Promise<User> => {
        const res = await ApiService.post<User>("/users", dto);
        return res.data;
    },

    update: async (id: string, dto: UserUpdateDTO): Promise<User> => {
        const res = await ApiService.patch<User>(`/users/${id}`, dto);
        return res.data;
    },

    toggleActive: async (id: string): Promise<void> => {
        await ApiService.patch(`/users/${id}/toggle-active`);
    },

    remove: async (id: string): Promise<void> => {
        await ApiService.delete(`/users/${id}`);
    },
};
