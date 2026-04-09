package com.casasnuevas.backend.auth.service;

import com.casasnuevas.backend.auth.dto.AuthResponse;
import com.casasnuevas.backend.auth.dto.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request, HttpServletResponse response);

    void logout(HttpServletRequest request, HttpServletResponse response);

    AuthResponse me(HttpServletRequest request);
}
