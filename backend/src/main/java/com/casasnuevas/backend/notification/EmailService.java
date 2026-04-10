package com.casasnuevas.backend.notification;

public interface EmailService {

    /**
     * @return {@code true} si el mensaje se envió; {@code false} si no hay SMTP, destino vacío o falló el envío.
     */
    boolean sendAppointmentConfirmation(String toEmail, String clientName,
                                        String propertyTitle, String agentName,
                                        String scheduledAt);

    /**
     * Resumen del contrato para el cliente (no adjunta PDF; puede descargarlo con su agente).
     */
    boolean sendContractSummaryToClient(String toEmail, String clientName, String folio,
                                        String propertyTitle, String contractTypeLabel,
                                        String contractStatusLabel, String agentName);
}
