import api from "@/lib/axios";
import { AxiosResponse, AxiosRequestConfig } from "axios";

type BodyData = object | FormData;

/** Subidas multipart deben usar `fetch` (p. ej. `PropertiesService.addPhotos`): el cliente axios fija JSON por defecto. */
function resolveConfig(_data?: BodyData, config?: AxiosRequestConfig): AxiosRequestConfig {
    return config ?? {};
}

export const ApiService = {
    get: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        api.get<T>(url, config),

    post: <T>(url: string, data?: BodyData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        api.post<T>(url, data, resolveConfig(data, config)),

    put: <T>(url: string, data?: BodyData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        api.put<T>(url, data, resolveConfig(data, config)),

    patch: <T>(url: string, data?: BodyData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        api.patch<T>(url, data, resolveConfig(data, config)),

    delete: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
        api.delete<T>(url, config),
};
