import { Role } from "@/features/auth/types/auth.types";

export interface NavItem {
    label: string;
    path: string;
    icon: string;
    roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: "dashboard",
        roles: ["ADMIN", "AGENT"],
    },
    {
        label: "Propiedades",
        path: "/properties",
        icon: "home_work",
        roles: ["ADMIN", "AGENT"],
    },
    {
        label: "Clientes",
        path: "/clients",
        icon: "people",
        roles: ["ADMIN", "AGENT"],
    },
    {
        label: "Citas",
        path: "/appointments",
        icon: "calendar_month",
        roles: ["ADMIN", "AGENT"],
    },
    {
        label: "Contratos",
        path: "/contracts",
        icon: "description",
        roles: ["ADMIN", "AGENT"],
    },
    {
        label: "Usuarios",
        path: "/users",
        icon: "manage_accounts",
        roles: ["ADMIN"],
    },
];
