package com.casasnuevas.backend.common.util;

import com.casasnuevas.backend.common.dto.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class PaginationUtils {

    private PaginationUtils() {
        throw new InstantiationError("Utility class");
    }

    public static void validate(Integer limit, Integer offset) {
        if (limit != null && limit <= 0) {
            throw new IllegalArgumentException("El parámetro 'limit' debe ser mayor que 0");
        }
        if (offset != null && offset < 0) {
            throw new IllegalArgumentException("El parámetro 'offset' no puede ser negativo");
        }
    }

    public static Pageable toPageable(int limit, int offset, String sortBy, Sort.Direction direction) {
        int page = (offset + limit - 1) / limit;
        return PageRequest.of(page, limit, Sort.by(direction, sortBy));
    }

    public static Pageable toPageable(int limit, int offset) {
        return toPageable(limit, offset, "createdAt", Sort.Direction.DESC);
    }

    public static <T> PaginatedResponse<T> build(Page<T> page, int limit, int offset, String baseUrl, String queryString) {
        String cleanBase = baseUrl.split("\\?")[0];

        String next = page.hasNext()
                ? buildUrl(cleanBase, limit, offset + limit, queryString)
                : null;

        String previous = page.hasPrevious()
                ? buildUrl(cleanBase, limit, Math.max(0, offset - limit), queryString)
                : null;

        return PaginatedResponse.<T>builder()
                .count(page.getTotalElements())
                .next(next)
                .previous(previous)
                .results(page.getContent())
                .build();
    }

    private static String buildUrl(String base, int limit, int offset, String queryString) {
        StringBuilder url = new StringBuilder(base)
                .append("?limit=").append(limit)
                .append("&offset=").append(offset);

        if (queryString != null && !queryString.isBlank()) {
            for (String param : queryString.split("&")) {
                if (!param.startsWith("limit=") && !param.startsWith("offset=")) {
                    url.append("&").append(param);
                }
            }
        }
        return url.toString();
    }
}
