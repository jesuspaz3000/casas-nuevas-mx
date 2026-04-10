import { PropertyType } from "@/features/properties/types/properties.types";

export type ClientStatus = "LEAD" | "INTERESTED" | "NEGOTIATING" | "CLOSED" | "LOST";

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    budgetMin?: number;
    budgetMax?: number;
    interestedType?: PropertyType;
    interestedCity?: string;
    status: ClientStatus;
    notes?: string;
    agentId?: string;
    agentName?: string;
    createdAt: string;
}

export interface ClientCreateDTO {
    name: string;
    email?: string;
    phone?: string;
    budgetMin?: number;
    budgetMax?: number;
    interestedType?: PropertyType;
    interestedCity?: string;
    status: ClientStatus;
    notes?: string;
    agentId?: string;
}

export interface ClientUpdateDTO {
    name?: string;
    email?: string;
    phone?: string;
    budgetMin?: number;
    budgetMax?: number;
    interestedType?: PropertyType;
    interestedCity?: string;
    status?: ClientStatus;
    notes?: string;
    agentId?: string;
}

export interface ClientFilterParams {
    search?: string;
    status?: ClientStatus;
    limit: number;
    offset: number;
}

export interface ClientsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Client[];
}
