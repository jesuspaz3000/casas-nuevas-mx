package com.casasnuevas.backend.appointment.repository;

import com.casasnuevas.backend.appointment.dto.AppointmentFilterDTO;
import com.casasnuevas.backend.appointment.model.Appointment;
import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.property.model.Property;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class AppointmentSpecification {

    private AppointmentSpecification() {}

    public static Specification<Appointment> withFilters(AppointmentFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + filter.search().trim().toLowerCase() + "%";
                Join<Appointment, Client> client = root.join("client", JoinType.LEFT);
                Join<Appointment, Property> property = root.join("property", JoinType.LEFT);
                if (query != null) query.distinct(true);
                predicates.add(cb.or(
                        cb.like(cb.lower(client.get("name")),    pattern),
                        cb.like(cb.lower(property.get("title")), pattern)
                ));
            }

            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
