package com.casasnuevas.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.security.SecuritySchemes;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Casas Nuevas MX API",
                version = "1.0.0",
                description = "API REST para gestión inmobiliaria: propiedades, clientes, citas y contratos",
                contact = @Contact(
                        name = "Jesús Paz",
                        email = "veyito30000@gmail.com"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080/api", description = "Servidor local"),
        }
)
@SecuritySchemes({
        @SecurityScheme(
                name = "bearerAuth",
                type = SecuritySchemeType.HTTP,
                scheme = "bearer",
                bearerFormat = "JWT",
                in = SecuritySchemeIn.HEADER,
                description = "JWT en cabecera Authorization. En el navegador se usan cookies httpOnly."
        ),
        @SecurityScheme(
                name = "cookieAuth",
                type = SecuritySchemeType.APIKEY,
                in = SecuritySchemeIn.COOKIE,
                paramName = "access_token",
                description = "Cookie access_token (httpOnly) tras login"
        )
})
public class OpenApiConfig {}
