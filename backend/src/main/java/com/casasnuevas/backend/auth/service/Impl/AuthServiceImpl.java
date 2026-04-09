package com.casasnuevas.backend.auth.service.Impl;

import com.casasnuevas.backend.auth.dto.AuthResponse;
import com.casasnuevas.backend.auth.dto.LoginRequest;
import com.casasnuevas.backend.auth.service.AuthService;
import com.casasnuevas.backend.config.CookieProperties;
import com.casasnuevas.backend.config.JwtConfig;
import com.casasnuevas.backend.config.TokenBlacklistService;
import com.casasnuevas.backend.user.model.User;
import com.casasnuevas.backend.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String ACCESS_TOKEN_COOKIE  = "access_token";
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private final AuthenticationManager authenticationManager;
    private final JwtConfig jwtConfig;
    private final CookieProperties cookieProperties;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserRepository userRepository;

    @Override
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = (User) auth.getPrincipal();

        String accessToken  = jwtConfig.generateAccessToken(user);
        String refreshToken = jwtConfig.generateRefreshToken(user);

        addCookie(response, ACCESS_TOKEN_COOKIE,  accessToken,  jwtConfig.getAccessTokenExpiration());
        addCookie(response, REFRESH_TOKEN_COOKIE, refreshToken, jwtConfig.getRefreshTokenExpiration());

        return toAuthResponse(user);
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);

        if (accessToken != null) {
            try {
                tokenBlacklistService.blacklistToken(accessToken, jwtConfig.getAccessTokenExpiration());
            } catch (Exception e) {
                // Redis no disponible — igual limpiamos las cookies
            }
        }

        clearCookie(response, ACCESS_TOKEN_COOKIE);
        clearCookie(response, REFRESH_TOKEN_COOKIE);
    }

    @Override
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE);

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token no encontrado");
        }

        try {
            if (tokenBlacklistService.isTokenBlacklisted(refreshToken)) {
                throw new IllegalArgumentException("Refresh token revocado");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {
            // Redis no disponible — continuamos
        }

        String email = jwtConfig.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Cuenta desactivada");
        }

        if (!jwtConfig.isTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Refresh token inválido o expirado");
        }

        String newAccessToken = jwtConfig.generateAccessToken(user);
        addCookie(response, ACCESS_TOKEN_COOKIE, newAccessToken, jwtConfig.getAccessTokenExpiration());

        return toAuthResponse(user);
    }

    @Override
    public AuthResponse me(HttpServletRequest request) {
        // El usuario ya fue autenticado por JwtAuthenticationFilter;
        // se extrae del SecurityContext en el controller.
        throw new UnsupportedOperationException("Usar AuthController#me directamente");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void addCookie(HttpServletResponse response, String name, String value, long expirationMs) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite(cookieProperties.sameSite())
                .domain(cookieProperties.domain().isBlank() ? null : cookieProperties.domain())
                .path("/")
                .maxAge(Duration.ofMillis(expirationMs))
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite(cookieProperties.sameSite())
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader("Set-Cookie", cookie.toString());
    }

    private static String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private static AuthResponse toAuthResponse(User user) {
        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
