package com.casasnuevas.backend.client.repository;

import com.casasnuevas.backend.client.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    List<Client> findByAgentId(UUID agentId);

    List<Client> findByStatus(Client.ClientStatus status);

    long countByAgentIdAndStatus(UUID agentId, Client.ClientStatus status);

    long countByAgentIdAndCreatedAtBetween(UUID agentId, java.time.LocalDateTime from, java.time.LocalDateTime to);
}
