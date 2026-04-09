package com.casasnuevas.backend.client.service.Impl;

import com.casasnuevas.backend.client.dto.ClientCreateDTO;
import com.casasnuevas.backend.client.dto.ClientDTO;
import com.casasnuevas.backend.client.dto.ClientUpdateDTO;
import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.client.repository.ClientRepository;
import com.casasnuevas.backend.client.service.ClientService;
import com.casasnuevas.backend.common.exception.ResourceNotFoundException;
import com.casasnuevas.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Override
    public List<ClientDTO> findAll() {
        return clientRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    public Page<ClientDTO> findAll(Pageable pageable) {
        return clientRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    public List<ClientDTO> findByAgent(UUID agentId) {
        return clientRepository.findByAgentId(agentId).stream().map(this::toDTO).toList();
    }

    @Override
    public List<ClientDTO> findByStatus(Client.ClientStatus status) {
        return clientRepository.findByStatus(status).stream().map(this::toDTO).toList();
    }

    @Override
    public ClientDTO findById(UUID id) {
        return toDTO(getOrThrow(id));
    }

    @Override
    @Transactional
    public ClientDTO create(ClientCreateDTO dto) {
        Client client = Client.builder()
                .name(dto.name())
                .email(dto.email())
                .phone(dto.phone())
                .budgetMin(dto.budgetMin())
                .budgetMax(dto.budgetMax())
                .interestedType(dto.interestedType())
                .interestedCity(dto.interestedCity())
                .status(dto.status())
                .notes(dto.notes())
                .build();

        if (dto.agentId() != null) {
            client.setAgent(userRepository.findById(dto.agentId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId())));
        }

        return toDTO(clientRepository.save(client));
    }

    @Override
    @Transactional
    public ClientDTO update(UUID id, ClientUpdateDTO dto) {
        Client client = getOrThrow(id);
        if (dto.name() != null)           client.setName(dto.name());
        if (dto.email() != null)          client.setEmail(dto.email());
        if (dto.phone() != null)          client.setPhone(dto.phone());
        if (dto.budgetMin() != null)      client.setBudgetMin(dto.budgetMin());
        if (dto.budgetMax() != null)      client.setBudgetMax(dto.budgetMax());
        if (dto.interestedType() != null) client.setInterestedType(dto.interestedType());
        if (dto.interestedCity() != null) client.setInterestedCity(dto.interestedCity());
        if (dto.status() != null)         client.setStatus(dto.status());
        if (dto.notes() != null)          client.setNotes(dto.notes());
        if (dto.agentId() != null) {
            client.setAgent(userRepository.findById(dto.agentId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId())));
        }
        return toDTO(clientRepository.save(client));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Client client = getOrThrow(id);
        client.setDeletedAt(LocalDateTime.now());
        clientRepository.save(client);
    }

    private Client getOrThrow(UUID id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", id));
    }

    private ClientDTO toDTO(Client c) {
        return new ClientDTO(
                c.getId(), c.getName(), c.getEmail(), c.getPhone(),
                c.getBudgetMin(), c.getBudgetMax(), c.getInterestedType(), c.getInterestedCity(),
                c.getStatus(), c.getNotes(),
                c.getAgent() != null ? c.getAgent().getId() : null,
                c.getAgent() != null ? c.getAgent().getName() : null,
                c.getCreatedAt()
        );
    }
}
