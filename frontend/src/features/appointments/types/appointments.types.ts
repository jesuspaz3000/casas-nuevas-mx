export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "DONE";

export interface Appointment {
    id: string;
    propertyId: string;
    propertyTitle: string;
    clientId: string;
    clientName: string;
    agentId: string;
    agentName: string;
    scheduledAt: string;
    /** Minutos; por defecto 60 si el backend aún no lo envía. */
    durationMinutes?: number;
    status: AppointmentStatus;
    notes: string | null;
    createdAt: string;
    /** Presente en la respuesta de `POST /appointments` (crear): si se envió el correo al cliente. */
    confirmationEmailSent?: boolean;
}

export interface AppointmentCreateDTO {
    propertyId: string;
    clientId: string;
    agentId: string;
    scheduledAt: string;
    durationMinutes?: number;
    status: AppointmentStatus;
    notes?: string;
}

export interface AppointmentUpdateDTO {
    scheduledAt?: string;
    durationMinutes?: number;
    status?: AppointmentStatus;
    notes?: string;
}

export interface AppointmentsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Appointment[];
}

export interface AppointmentFilterParams {
    limit: number;
    offset: number;
    search?: string;
    status?: AppointmentStatus | "";
}
