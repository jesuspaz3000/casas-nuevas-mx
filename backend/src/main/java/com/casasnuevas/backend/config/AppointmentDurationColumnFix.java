package com.casasnuevas.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate {@code ddl-auto: update} a veces emite {@code ADD COLUMN ... NOT NULL} sin DEFAULT,
 * lo que PostgreSQL rechaza si ya hay filas. Este paso idempotente asegura la columna
 * {@code duration_minutes} con valor por defecto 60.
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class AppointmentDurationColumnFix implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer count = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = 'appointments'
                      AND column_name = 'duration_minutes'
                    """, Integer.class);
            if (count != null && count == 0) {
                jdbcTemplate.execute(
                        "ALTER TABLE appointments ADD COLUMN duration_minutes integer NOT NULL DEFAULT 60");
                log.info("Columna appointments.duration_minutes creada (DEFAULT 60).");
                return;
            }
            jdbcTemplate.update("UPDATE appointments SET duration_minutes = 60 WHERE duration_minutes IS NULL");
            try {
                jdbcTemplate.execute("ALTER TABLE appointments ALTER COLUMN duration_minutes SET DEFAULT 60");
            } catch (Exception ignored) {
                /* ya tenía default */
            }
            try {
                jdbcTemplate.execute("ALTER TABLE appointments ALTER COLUMN duration_minutes SET NOT NULL");
            } catch (Exception ignored) {
                /* ya era NOT NULL */
            }
        } catch (Exception e) {
            log.warn("No se pudo verificar/crear appointments.duration_minutes: {}", e.getMessage());
        }
    }
}
