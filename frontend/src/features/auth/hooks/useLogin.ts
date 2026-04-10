"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/features/auth/services/auth.service";
import { LoginRequest } from "@/features/auth/types/auth.types";

export function useLogin() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async (data: LoginRequest) => {
        setIsLoading(true);
        setError(null);
        try {
            await AuthService.login(data);
            router.push("/dashboard");
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "Credenciales incorrectas";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading, error };
}
