import api from "@/lib/axios";
import { ApiService } from "@/shared/services/api.service";
import {
    Property,
    PropertyCreateDTO,
    PropertyUpdateDTO,
    PropertyFilterParams,
    PropertiesResponse,
    PropertyPhoto,
} from "@/features/properties/types/properties.types";

export const PropertiesService = {
    findAll: async (): Promise<Property[]> => {
        const res = await ApiService.get<Property[]>("/properties");
        return res.data;
    },

    findPaginated: async (params: PropertyFilterParams): Promise<PropertiesResponse> => {
        const query: Record<string, unknown> = { limit: params.limit, offset: params.offset };
        if (params.search) query.search = params.search;
        if (params.type) query.type = params.type;
        if (params.status) query.status = params.status;
        if (params.city) query.city = params.city;
        if (params.neighborhood) query.neighborhood = params.neighborhood;
        if (params.priceMin != null) query.priceMin = params.priceMin;
        if (params.priceMax != null) query.priceMax = params.priceMax;
        if (params.bedroomsMin != null) query.bedroomsMin = params.bedroomsMin;
        if (params.bathroomsMin != null) query.bathroomsMin = params.bathroomsMin;
        if (params.areaM2Min != null) query.areaM2Min = params.areaM2Min;
        const res = await ApiService.get<PropertiesResponse>("/properties", { params: query });
        return res.data;
    },

    findById: async (id: string): Promise<Property> => {
        const res = await ApiService.get<Property>(`/properties/${id}`);
        return res.data;
    },

    create: async (dto: PropertyCreateDTO): Promise<Property> => {
        const res = await ApiService.post<Property>("/properties", dto);
        return res.data;
    },

    update: async (id: string, dto: PropertyUpdateDTO): Promise<Property> => {
        const res = await ApiService.patch<Property>(`/properties/${id}`, dto);
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await ApiService.delete(`/properties/${id}`);
    },

    /**
     * Usa fetch para multipart: el cliente axios lleva `Content-Type: application/json` por defecto
     * y forzar multipart sin boundary rompe el parseo en Spring.
     */
    addPhotos: async (propertyId: string, files: File[], coverId?: string): Promise<PropertyPhoto[]> => {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        const path = `/properties/${propertyId}/photos`;
        const params = new URLSearchParams();
        if (coverId) params.set("coverId", coverId);
        const qs = params.toString();
        const url = `${api.defaults.baseURL?.replace(/\/$/, "") ?? ""}${path}${qs ? `?${qs}` : ""}`;
        const res = await fetch(url, {
            method: "POST",
            body: formData,
            credentials: "include",
        });
        if (!res.ok) {
            let message = "No se pudieron subir las fotos";
            try {
                const j = (await res.json()) as { message?: unknown };
                if (typeof j.message === "string" && j.message.trim()) message = j.message;
            } catch {
                /* cuerpo no JSON */
            }
            throw new Error(message);
        }
        return (await res.json()) as PropertyPhoto[];
    },

    deletePhoto: async (photoId: string): Promise<void> => {
        await ApiService.delete(`/properties/photos/${photoId}`);
    },

    setCoverPhoto: async (propertyId: string, photoId: string): Promise<PropertyPhoto[]> => {
        const res = await ApiService.patch<PropertyPhoto[]>(
            `/properties/${propertyId}/photos/cover`,
            {},
            { params: { photoId } },
        );
        return res.data;
    },
};
