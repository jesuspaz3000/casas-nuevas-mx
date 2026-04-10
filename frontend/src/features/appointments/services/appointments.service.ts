import { ApiService } from "@/shared/services/api.service";
import {
    Appointment,
    AppointmentCreateDTO,
    AppointmentUpdateDTO,
    AppointmentFilterParams,
    AppointmentsResponse,
} from "@/features/appointments/types/appointments.types";

export const AppointmentsService = {
    findPaginated: async (params: AppointmentFilterParams): Promise<AppointmentsResponse> => {
        const query: Record<string, unknown> = { limit: params.limit, offset: params.offset };
        if (params.search)  query.search  = params.search;
        if (params.status)  query.status  = params.status;
        const res = await ApiService.get<AppointmentsResponse>("/appointments", { params: query });
        return res.data;
    },

    findCalendar: async (agentId: string, from: string, to: string): Promise<Appointment[]> => {
        const res = await ApiService.get<Appointment[]>("/appointments/calendar", {
            params: { agentId, from, to },
        });
        return res.data;
    },

    findById: async (id: string): Promise<Appointment> => {
        const res = await ApiService.get<Appointment>(`/appointments/${id}`);
        return res.data;
    },

    create: async (dto: AppointmentCreateDTO): Promise<Appointment> => {
        const res = await ApiService.post<Appointment>("/appointments", dto);
        return res.data;
    },

    update: async (id: string, dto: AppointmentUpdateDTO): Promise<Appointment> => {
        const res = await ApiService.patch<Appointment>(`/appointments/${id}`, dto);
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await ApiService.delete(`/appointments/${id}`);
    },

    /** Reenvía al cliente el correo de confirmación de cita (mismo texto que al crear). */
    sendConfirmationEmail: async (id: string): Promise<{ message: string }> => {
        const res = await ApiService.post<{ message: string }>(`/appointments/${id}/send-confirmation`, {});
        return res.data;
    },
};
