export type Role = "ADMIN" | "AGENT";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface AuthResponse {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface LoginRequest {
    email: string;
    password: string;
}
