package com.casasnuevas.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Mapea app.auth.cookie.* del application.yaml.
 * Uso: inyectar en el AuthController para construir la cookie httpOnly.
 *
 * Ejemplo:
 *   ResponseCookie cookie = ResponseCookie.from("access_token", token)
 *       .httpOnly(true)
 *       .secure(cookieProperties.secure())
 *       .sameSite(cookieProperties.sameSite())
 *       .domain(cookieProperties.domain().isBlank() ? null : cookieProperties.domain())
 *       .path("/")
 *       .maxAge(Duration.ofMillis(jwtConfig.getAccessTokenExpiration()))
 *       .build();
 */
@ConfigurationProperties(prefix = "app.auth.cookie")
public record CookieProperties(
        boolean secure,
        String sameSite,
        String domain
) {}
