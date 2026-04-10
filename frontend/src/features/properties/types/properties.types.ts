export type PropertyType = "HOUSE" | "APARTMENT" | "LAND" | "COMMERCIAL";
export type PropertyStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export interface PropertyPhoto {
    id: string;
    url: string;
    isCover: boolean;
    sortOrder: number;
}

export interface Property {
    id: string;
    title: string;
    description?: string;
    type: PropertyType;
    status: PropertyStatus;
    price: number;
    currency: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaM2?: number;
    agentId?: string;
    agentName?: string;
    photos: PropertyPhoto[];
    createdAt: string;
}

export interface PropertyCreateDTO {
    title: string;
    description?: string;
    type: PropertyType;
    status: PropertyStatus;
    price: number;
    currency?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaM2?: number;
    agentId?: string;
}

export interface PropertyUpdateDTO {
    title?: string;
    description?: string;
    type?: PropertyType;
    status?: PropertyStatus;
    price?: number;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaM2?: number;
    agentId?: string;
}

export interface PropertyFilterParams {
    search?: string;
    type?: PropertyType;
    status?: PropertyStatus;
    city?: string;
    limit: number;
    offset: number;
}

export interface PropertiesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Property[];
}
