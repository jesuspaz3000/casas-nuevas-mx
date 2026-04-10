"use client";

import { useState } from "react";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { ThemeToggle } from "@/shared/components/themeToggle";
import { Button } from "@/shared/components/Button";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import LoginIcon from "@mui/icons-material/Login";
import AutorenewIcon from "@mui/icons-material/Autorenew";

const inputBase = "w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
const inputNormal = `${inputBase} border-gray-200 dark:border-gray-700 focus:ring-blue-500`;
const inputError  = `${inputBase} border-red-400 dark:border-red-500 focus:ring-red-400`;

interface FieldErrors {
    email?: string;
    password?: string;
}

export default function LoginForm() {
    const { login, isLoading, error } = useLogin();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const validate = (): boolean => {
        const errors: FieldErrors = {};
        if (!email.trim()) {
            errors.email = "El correo electrónico es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Ingresa un correo electrónico válido";
        }
        if (!password) {
            errors.password = "La contraseña es requerida";
        } else if (password.length < 6) {
            errors.password = "La contraseña debe tener al menos 6 caracteres";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        await login({ email, password });
    };

    const clearFieldError = (field: keyof FieldErrors) => {
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-md">

                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
                        <HomeWorkIcon sx={{ fontSize: 28, color: "white" }} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Casas Nuevas MX</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Panel de agentes</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center">Iniciar sesión</h2>

                    <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="new-email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                                placeholder="agente@casasnuevas.mx"
                                className={fieldErrors.email ? inputError : inputNormal}
                            />
                            {fieldErrors.email && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <ErrorOutlinedIcon sx={{ fontSize: 14 }} />
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                                placeholder="••••••••"
                                className={fieldErrors.password ? inputError : inputNormal}
                            />
                            {fieldErrors.password && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <ErrorOutlinedIcon sx={{ fontSize: 14 }} />
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Error del servidor */}
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-lg px-4 py-3">
                                <ErrorOutlinedIcon sx={{ fontSize: 18 }} className="flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            loading={isLoading}
                            loadingText="Ingresando..."
                        >
                            <LoginIcon sx={{ fontSize: 18 }} />
                            Ingresar
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    © {new Date().getFullYear()} Casas Nuevas MX · ReWo
                </p>
            </div>
        </div>
    );
}
