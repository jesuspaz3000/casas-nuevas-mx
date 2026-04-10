"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/shared/config/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useRipple } from "@/shared/hooks/useRipple";
import { useLogout } from "@/shared/hooks/useLogout";
import { LogoutDialog } from "@/shared/components/LogoutDialog";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DescriptionIcon from "@mui/icons-material/Description";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import LogoutIcon from "@mui/icons-material/Logout";
import type { SvgIconComponent } from "@mui/icons-material";

const ICON_MAP: Record<string, SvgIconComponent> = {
    dashboard: DashboardIcon,
    home_work: HomeWorkIcon,
    people: PeopleIcon,
    calendar_month: CalendarMonthIcon,
    description: DescriptionIcon,
    manage_accounts: ManageAccountsIcon,
};

interface SidebarProps {
    open: boolean;
    collapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

function NavLink({ item, active, collapsed, onClose }: {
    item: typeof NAV_ITEMS[0];
    active: boolean;
    collapsed: boolean;
    onClose: () => void;
}) {
    const { ref, trigger } = useRipple<HTMLAnchorElement>();
    const Icon = ICON_MAP[item.icon];

    return (
        <Link
            ref={ref}
            href={item.path}
            title={collapsed ? item.label : undefined}
            onClick={(e) => { trigger(e as never); onClose(); }}
            className={[
                "ripple flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center" : "",
                active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-900/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
            ].join(" ")}
        >
            {Icon && <Icon sx={{ fontSize: 20 }} className="flex-shrink-0" />}
            <span className={["whitespace-nowrap transition-all duration-200", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 delay-150"].join(" ")}>
                {item.label}
            </span>
        </Link>
    );
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);
    const role = user?.role;
    const { ref: logoutRef, trigger: logoutTrigger } = useRipple<HTMLButtonElement>();
    const { dialogOpen, loading, requestLogout, cancelLogout, confirmLogout } = useLogout();

    const visibleItems = NAV_ITEMS.filter((item) =>
        role && item.roles.includes(role)
    );

    const sidebarContent = (collapsed: boolean) => (
        <div className={["flex flex-col h-full bg-gray-950 border-r border-gray-800 transition-all duration-300", collapsed ? "w-16" : "w-64"].join(" ")}>

            {/* Logo */}
            <div className="flex items-center h-18 flex-shrink-0 border-b border-gray-800 px-3 gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 flex-shrink-0">
                    <HomeWorkIcon sx={{ fontSize: 20, color: "white" }} />
                </div>
                <div className={["min-w-0 whitespace-nowrap transition-all duration-200", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 delay-150"].join(" ")}>
                    <p className="text-white font-semibold text-sm leading-tight">Casas Nuevas MX</p>
                    <p className="text-gray-500 text-xs">Panel de agentes</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.path}
                        item={item}
                        active={pathname === item.path}
                        collapsed={collapsed}
                        onClose={onClose}
                    />
                ))}
            </nav>

            {/* Logout button */}
            <div className="px-2 py-3">
                <button
                    ref={logoutRef}
                    onClick={(e) => { logoutTrigger(e); requestLogout(); }}
                    title="Cerrar sesión"
                    className={[
                        "ripple w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-gray-800",
                        "text-gray-400 hover:border-red-500/40 hover:bg-red-600/10 hover:text-red-400 transition-all duration-150 cursor-pointer",
                        collapsed ? "justify-center" : "",
                    ].join(" ")}
                >
                    <LogoutIcon sx={{ fontSize: 20 }} className="flex-shrink-0" />
                    <span className={["whitespace-nowrap transition-all duration-200", collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 delay-150"].join(" ")}>
                        Cerrar sesión
                    </span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <LogoutDialog
                open={dialogOpen}
                loading={loading}
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />

            {/* Desktop sidebar */}
            <aside className="hidden md:flex flex-col flex-shrink-0 min-h-screen">
                {sidebarContent(collapsed)}
            </aside>

            {/* Mobile overlay */}
            {open && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <aside className="absolute left-0 top-0 h-full z-50 shadow-2xl">
                        {sidebarContent(false)}
                    </aside>
                </div>
            )}
        </>
    );
}
