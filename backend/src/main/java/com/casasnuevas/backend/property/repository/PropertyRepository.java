package com.casasnuevas.backend.property.repository;

import com.casasnuevas.backend.property.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID>, JpaSpecificationExecutor<Property> {

    long countByAgentIdAndStatus(UUID agentId, Property.PropertyStatus status);
}
