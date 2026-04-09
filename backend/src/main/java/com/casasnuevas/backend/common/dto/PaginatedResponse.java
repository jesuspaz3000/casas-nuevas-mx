package com.casasnuevas.backend.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Respuesta paginada genérica")
public class PaginatedResponse<T> {

    @Schema(description = "Total de elementos", example = "48")
    private Long count;

    @Schema(description = "URL siguiente página", example = "/api/properties?limit=12&offset=12")
    private String next;

    @Schema(description = "URL página anterior", example = "/api/properties?limit=12&offset=0")
    private String previous;

    @Schema(description = "Resultados de la página actual")
    private List<T> results;
}
