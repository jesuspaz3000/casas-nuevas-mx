package com.casasnuevas.backend.property.repository;

import com.casasnuevas.backend.property.dto.PropertyFilterDTO;
import com.casasnuevas.backend.property.model.Property;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class PropertySpecification {

    private PropertySpecification() {}

    public static Specification<Property> withFilters(PropertyFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.search() != null && !filter.search().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + filter.search().trim().toLowerCase() + "%"));
            }
            if (filter.type() != null) {
                predicates.add(cb.equal(root.get("type"), filter.type()));
            }
            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }
            if (filter.city() != null && !filter.city().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + filter.city().toLowerCase() + "%"));
            }
            if (filter.neighborhood() != null && !filter.neighborhood().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("neighborhood")), "%" + filter.neighborhood().toLowerCase() + "%"));
            }
            if (filter.priceMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.priceMin()));
            }
            if (filter.priceMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.priceMax()));
            }
            if (filter.bedroomsMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("bedrooms"), filter.bedroomsMin()));
            }
            if (filter.bathroomsMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("bathrooms"), filter.bathroomsMin()));
            }
            if (filter.areaM2Min() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("areaM2"), filter.areaM2Min()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
