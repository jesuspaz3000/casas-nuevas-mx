package com.casasnuevas.backend;

import com.casasnuevas.backend.config.CookieProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import java.util.TimeZone;

@SpringBootApplication
@EnableConfigurationProperties(CookieProperties.class)
public class BackendApplication {

    public static void main(String[] args) {
        String tzId = System.getenv().getOrDefault("APP_TIMEZONE", "America/Mexico_City");
        TimeZone.setDefault(TimeZone.getTimeZone(tzId));
        SpringApplication.run(BackendApplication.class, args);
    }
}
