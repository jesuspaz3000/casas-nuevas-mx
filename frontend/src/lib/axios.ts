import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8080/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

const AUTH_PATHS = ["/auth/login", "/auth/logout", "/auth/refresh"];

function isAuthPath(url: string | undefined): boolean {
    if (!url) return false;
    return AUTH_PATHS.some((p) => url.includes(p));
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const url = error.config?.url ?? "";
        if (error.response?.status === 401 && !isAuthPath(url)) {
            try {
                await api.post("/auth/logout");
            } catch {
                /* sesión ya inválida */
            }
            useAuthStore.getState().clearSession();
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
