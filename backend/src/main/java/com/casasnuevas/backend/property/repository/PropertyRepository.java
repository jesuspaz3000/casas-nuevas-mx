package com.casasnuevas.backend.property.repository;

import com.casasnuevas.backend.property.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID>, JpaSpecificationExecutor<Property> {

    long countByStatus(Property.PropertyStatus status);

    long countByAgentIdAndStatus(UUID agentId, Property.PropertyStatus status);

    /**
     * Ventas reflejadas solo en catálogo (SOLD) sin contrato firmado — evita duplicar cuando el cierre fue vía contrato.
     */
    @Query("""
            SELECT COUNT(p) FROM Property p
            WHERE p.agent.id = :agentId AND p.status = 'SOLD'
              AND p.updatedAt BETWEEN :from AND :to
              AND NOT EXISTS (
                  SELECT 1 FROM Contract c
                  WHERE c.property.id = p.id AND c.status = 'SIGNED'
              )
            """)
    long countSoldWithoutSignedContractByAgentAndUpdatedAtBetween(@Param("agentId") UUID agentId,
                                                                  @Param("from") LocalDateTime from,
                                                                  @Param("to") LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(p.price), 0) FROM Property p
            WHERE p.agent.id = :agentId AND p.status = 'SOLD'
              AND p.updatedAt BETWEEN :from AND :to
              AND NOT EXISTS (
                  SELECT 1 FROM Contract c
                  WHERE c.property.id = p.id AND c.status = 'SIGNED'
              )
            """)
    BigDecimal sumSoldWithoutSignedContractPriceByAgentAndUpdatedAtBetween(@Param("agentId") UUID agentId,
                                                                           @Param("from") LocalDateTime from,
                                                                           @Param("to") LocalDateTime to);

    @Query("""
            SELECT COUNT(p) FROM Property p
            WHERE p.status = 'SOLD' AND p.updatedAt BETWEEN :from AND :to
              AND NOT EXISTS (
                  SELECT 1 FROM Contract c
                  WHERE c.property.id = p.id AND c.status = 'SIGNED'
              )
            """)
    long countSoldWithoutSignedContractByUpdatedAtBetween(@Param("from") LocalDateTime from,
                                                          @Param("to") LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(p.price), 0) FROM Property p
            WHERE p.status = 'SOLD' AND p.updatedAt BETWEEN :from AND :to
              AND NOT EXISTS (
                  SELECT 1 FROM Contract c
                  WHERE c.property.id = p.id AND c.status = 'SIGNED'
              )
            """)
    BigDecimal sumSoldWithoutSignedContractPriceByUpdatedAtBetween(@Param("from") LocalDateTime from,
                                                                   @Param("to") LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(p.price), 0) FROM Property p
            WHERE p.agent.id = :agentId AND p.status = 'SOLD'
              AND NOT EXISTS (
                  SELECT 1 FROM Contract c
                  WHERE c.property.id = p.id AND c.status = 'SIGNED'
              )
            """)
    BigDecimal sumSoldWithoutSignedContractPriceAllByAgent(@Param("agentId") UUID agentId);

    @Query("""
            SELECT COALESCE(SUM(p.price), 0) FROM Property p
            WHERE p.status = 'SOLD'
              AND NOT EXISTS (
                  SELECT 1 FROM Contract c
                  WHERE c.property.id = p.id AND c.status = 'SIGNED'
              )
            """)
    BigDecimal sumSoldWithoutSignedContractPriceAll();
}
