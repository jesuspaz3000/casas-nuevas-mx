package com.casasnuevas.backend.client.service;

import com.casasnuevas.backend.client.dto.ClientCreateDTO;
import com.casasnuevas.backend.client.dto.ClientDTO;
import com.casasnuevas.backend.client.dto.ClientUpdateDTO;
import com.casasnuevas.backend.client.model.Client;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ClientService {
    List<ClientDTO> findAll();
    Page<ClientDTO> findAll(Pageable pageable);
    List<ClientDTO> findByAgent(UUID agentId);
    List<ClientDTO> findByStatus(Client.ClientStatus status);
    ClientDTO findById(UUID id);
    ClientDTO create(ClientCreateDTO dto);
    ClientDTO update(UUID id, ClientUpdateDTO dto);
    void delete(UUID id);
}
