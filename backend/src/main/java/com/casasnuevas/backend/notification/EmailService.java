package com.casasnuevas.backend.notification;

public interface EmailService {
    void sendAppointmentConfirmation(String toEmail, String clientName,
                                      String propertyTitle, String agentName,
                                      String scheduledAt);
}
