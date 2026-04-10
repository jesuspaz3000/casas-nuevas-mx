import { ApiService } from "@/shared/services/api.service";
import { useAuthStore } from "@/store/auth.store";
import { AuthResponse, LoginRequest, User } from "@/features/auth/types/auth.types";

export const AuthService = {
    login: async (request: LoginRequest): Promise<AuthResponse> => {
        const response = await ApiService.post<AuthResponse>("/auth/login", request);
        useAuthStore.getState().setSession(response.data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        try {
            await ApiService.post<void>("/auth/logout");
        } finally {
            useAuthStore.getState().clearSession();
        }
    },

    refresh: async (): Promise<AuthResponse> => {
        const response = await ApiService.post<AuthResponse>("/auth/refresh");
        useAuthStore.getState().setSession(response.data);
        return response.data;
    },

    me: async (): Promise<User> => {
        const response = await ApiService.get<User>("/auth/me");
        useAuthStore.getState().setSession(response.data);
        return response.data;
    },
};
