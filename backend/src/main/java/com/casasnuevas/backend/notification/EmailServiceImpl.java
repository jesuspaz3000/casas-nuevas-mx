package com.casasnuevas.backend.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    @Override
    public void sendAppointmentConfirmation(String toEmail, String clientName,
                                             String propertyTitle, String agentName,
                                             String scheduledAt) {
        if (mailSender == null || toEmail == null || toEmail.isBlank()) {
            log.debug("Email omitido: SMTP no configurado o email de cliente vacío");
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject("Confirmación de cita - Casas Nuevas MX");
            msg.setText("""
                    Hola %s,

                    Tu cita ha sido agendada exitosamente.

                    Propiedad : %s
                    Agente    : %s
                    Fecha     : %s

                    Para cualquier duda, contacta a tu agente.

                    Casas Nuevas MX
                    """.formatted(clientName, propertyTitle, agentName, scheduledAt));
            mailSender.send(msg);
            log.info("Email de confirmación enviado a {}", toEmail);
        } catch (Exception e) {
            log.warn("No se pudo enviar email a {}: {}", toEmail, e.getMessage());
        }
    }
}
