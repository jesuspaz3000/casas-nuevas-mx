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
        if (params.search)  query.search  = params.search;
        if (params.type)    query.type    = params.type;
        if (params.status)  query.status  = params.status;
        if (params.city)    query.city    = params.city;
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

    addPhotos: async (propertyId: string, files: File[]): Promise<PropertyPhoto[]> => {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        const res = await ApiService.post<PropertyPhoto[]>(`/properties/${propertyId}/photos`, formData);
        return res.data;
    },

    deletePhoto: async (photoId: string): Promise<void> => {
        await ApiService.delete(`/properties/photos/${photoId}`);
    },
};
