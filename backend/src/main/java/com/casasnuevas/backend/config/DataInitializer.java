package com.casasnuevas.backend.config;

import com.casasnuevas.backend.user.model.User;
import com.casasnuevas.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Initializing seed data...");
        try {
            initAdminUser();
            log.info("Seed data initialized successfully");
        } catch (Exception e) {
            log.error("Failed to initialize seed data: {}", e.getMessage(), e);
        }
    }

    private void initAdminUser() {
        String email = System.getenv().getOrDefault("SUPERADMIN_EMAIL", "admin@casasnuevas.mx");
        String password = System.getenv().getOrDefault("SUPERADMIN_PASSWORD", "admin123");

        if (!userRepository.existsByEmail(email)) {
            User admin = User.builder()
                    .name("Administrador")
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(User.Role.ADMIN)
                    .isActive(true)
                    .build();

            userRepository.save(admin);
            log.info("Admin user created: {}", email);
        } else {
            log.info("Admin user already exists: {}", email);
        }
    }
}
