package com.casasnuevas.backend.contract.repository;

import com.casasnuevas.backend.contract.dto.ContractFilterDTO;
import com.casasnuevas.backend.contract.model.Contract;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ContractSpecification {

    private ContractSpecification() {}

    public static Specification<Contract> withFilters(ContractFilterDTO filter) {
        return (root, query, cb) -> {
            if (query != null) {
                query.distinct(true);
            }
            List<Predicate> predicates = new ArrayList<>();

            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + filter.search().trim().toLowerCase() + "%";
                var propertyJoin = root.join("property", JoinType.INNER);
                var clientJoin = root.join("client", JoinType.INNER);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("folio")), pattern),
                        cb.like(cb.lower(propertyJoin.get("title")), pattern),
                        cb.like(cb.lower(clientJoin.get("name")), pattern)
                ));
            }

            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }

            if (filter.contractType() != null) {
                predicates.add(cb.equal(root.get("contractType"), filter.contractType()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
