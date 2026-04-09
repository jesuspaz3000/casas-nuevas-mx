package com.casasnuevas.backend.contract.repository;

import com.casasnuevas.backend.contract.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    Optional<Contract> findByFolio(String folio);

    List<Contract> findByAgentId(UUID agentId);

    List<Contract> findByClientId(UUID clientId);

    List<Contract> findByAgentIdAndStatus(UUID agentId, Contract.ContractStatus status);

    @Query("SELECT COALESCE(SUM(c.salePrice), 0) FROM Contract c WHERE c.agent.id = :agentId AND c.status = 'SIGNED'")
    BigDecimal sumSalePriceByAgentId(@Param("agentId") UUID agentId);
}
