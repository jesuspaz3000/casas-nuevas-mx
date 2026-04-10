"use client";

import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/shared/components/themeToggle";
import { LogoutDialog } from "@/shared/components/LogoutDialog";
import { useAuthStore } from "@/store/auth.store";
import { useRipple } from "@/shared/hooks/useRipple";
import { useLogout } from "@/shared/hooks/useLogout";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import LogoutIcon from "@mui/icons-material/Logout";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";

interface HeaderProps {
    onMenuClick: () => void;
    onToggleCollapse: () => void;
    collapsed: boolean;
}

export function Header({ onMenuClick, onToggleCollapse, collapsed }: HeaderProps) {
    const user = useAuthStore((s) => s.user);
    const { ref: menuRef, trigger } = useRipple<HTMLButtonElement>();
    const { ref: avatarBtnRef, trigger: avatarTrigger } = useRipple<HTMLButtonElement>();
    const { ref: logoutBtnRef, trigger: logoutTrigger } = useRipple<HTMLButtonElement>();
    const { dialogOpen, loading, requestLogout, cancelLogout, confirmLogout } = useLogout();

    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);

    // Cerrar dropdown al click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setAvatarMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const initials = user?.name
        ?.split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <>
            <LogoutDialog
                open={dialogOpen}
                loading={loading}
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />

            <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-18 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">

                {/* Left: menu toggle */}
                <div className="flex items-center gap-3">
                    <button
                        ref={menuRef}
                        onClick={(e) => {
                            trigger(e);
                            if (window.innerWidth < 768) onMenuClick();
                            else onToggleCollapse();
                        }}
                        aria-label="Toggle menú"
                        className="ripple p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        {collapsed
                            ? <MenuIcon sx={{ fontSize: 22 }} />
                            : <MenuOpenIcon sx={{ fontSize: 22 }} />
                        }
                    </button>

                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                        Bienvenido,{" "}
                        <span className="font-medium text-gray-800 dark:text-gray-200">{user?.name}</span>
                    </span>
                </div>

                {/* Right: theme toggle + avatar */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    {/* Avatar */}
                    <div ref={avatarRef} className="relative">
                        <button
                            ref={avatarBtnRef}
                            onClick={(e) => { avatarTrigger(e); setAvatarMenuOpen((v) => !v); }}
                            className="ripple flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{initials}</span>
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight">{user?.name}</p>
                                <p className="text-xs text-gray-400 leading-tight">
                                    {user?.role === "ADMIN" ? "Administrador" : "Agente"}
                                </p>
                            </div>
                        </button>

                        {/* Dropdown */}
                        {avatarMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-50">

                                {/* Info */}
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-bold">{initials}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detalles */}
                                <div className="px-4 py-2 space-y-1.5 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <EmailIcon sx={{ fontSize: 14 }} />
                                        <span className="truncate">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <BadgeIcon sx={{ fontSize: 14 }} />
                                        <span>{user?.role === "ADMIN" ? "Administrador" : "Agente"}</span>
                                    </div>
                                </div>

                                {/* Logout */}
                                <div className="p-2">
                                    <button
                                        ref={logoutBtnRef}
                                        onClick={(e) => { logoutTrigger(e); setAvatarMenuOpen(false); requestLogout(); }}
                                        className="ripple w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                    >
                                        <LogoutIcon sx={{ fontSize: 17 }} />
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}
