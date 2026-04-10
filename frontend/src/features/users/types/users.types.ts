import { Role } from "@/features/auth/types/auth.types";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    createdAt: string;
}

export interface UserCreateDTO {
    name: string;
    email: string;
    password: string;
    role: Role;
}

export interface UserUpdateDTO {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
}

export interface UsersResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: User[];
}
