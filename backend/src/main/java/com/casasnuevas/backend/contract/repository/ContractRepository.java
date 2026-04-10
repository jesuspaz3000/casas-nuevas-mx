package com.casasnuevas.backend.contract.repository;

import com.casasnuevas.backend.contract.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID>, JpaSpecificationExecutor<Contract> {

    Optional<Contract> findByFolio(String folio);

    boolean existsByProperty_IdAndStatusIn(UUID propertyId, Collection<Contract.ContractStatus> statuses);

    List<Contract> findByAgentId(UUID agentId);

    List<Contract> findByClientId(UUID clientId);

    List<Contract> findByAgentIdAndStatus(UUID agentId, Contract.ContractStatus status);

    @Query("SELECT COALESCE(SUM(COALESCE(c.salePrice, c.reservationPrice)), 0) FROM Contract c WHERE c.agent.id = :agentId AND c.status = 'SIGNED'")
    BigDecimal sumSalePriceByAgentId(@Param("agentId") UUID agentId);

    long countByAgentIdAndStatusAndCreatedAtBetween(UUID agentId, Contract.ContractStatus status,
                                                     java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Query("SELECT COALESCE(SUM(c.salePrice), 0) FROM Contract c WHERE c.agent.id = :agentId AND c.status = 'SIGNED' AND c.createdAt BETWEEN :from AND :to")
    BigDecimal sumSalePriceByAgentIdAndCreatedAtBetween(@Param("agentId") UUID agentId,
                                                        @Param("from") java.time.LocalDateTime from,
                                                        @Param("to") java.time.LocalDateTime to);

    /** Contratos firmados cuyo último cambio (p. ej. firma) cayó en el rango — alinea el mes con el cierre real. */
    long countByAgentIdAndStatusAndUpdatedAtBetween(UUID agentId, Contract.ContractStatus status,
                                                    java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(COALESCE(c.salePrice, c.reservationPrice)), 0) FROM Contract c
            WHERE c.agent.id = :agentId AND c.status = 'SIGNED'
              AND c.updatedAt BETWEEN :from AND :to
            """)
    BigDecimal sumSignedContractValueByAgentIdAndUpdatedAtBetween(@Param("agentId") UUID agentId,
                                                                  @Param("from") java.time.LocalDateTime from,
                                                                  @Param("to") java.time.LocalDateTime to);

    long countByStatus(Contract.ContractStatus status);

    long countByStatusAndUpdatedAtBetween(Contract.ContractStatus status,
                                          java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Query("""
            SELECT COALESCE(SUM(COALESCE(c.salePrice, c.reservationPrice)), 0) FROM Contract c
            WHERE c.status = 'SIGNED' AND c.updatedAt BETWEEN :from AND :to
            """)
    BigDecimal sumSignedContractValueByUpdatedAtBetween(@Param("from") java.time.LocalDateTime from,
                                                        @Param("to") java.time.LocalDateTime to);

    @Query("SELECT COALESCE(SUM(COALESCE(c.salePrice, c.reservationPrice)), 0) FROM Contract c WHERE c.status = 'SIGNED'")
    BigDecimal sumSignedContractValueAll();
}
