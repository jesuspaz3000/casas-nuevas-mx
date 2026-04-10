package com.casasnuevas.backend.client.controller;

import com.casasnuevas.backend.client.dto.ClientCreateDTO;
import com.casasnuevas.backend.client.dto.ClientDTO;
import com.casasnuevas.backend.client.dto.ClientFilterDTO;
import com.casasnuevas.backend.client.dto.ClientUpdateDTO;
import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.client.service.ClientService;
import com.casasnuevas.backend.common.util.PaginationUtils;
import com.casasnuevas.backend.user.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
@Tag(name = "Clientes CRM", description = "Gestión de prospectos. Sin limit/offset devuelve array; con ambos devuelve objeto paginado.")
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @Operation(summary = "Listar clientes",
               description = "Sin `limit`/`offset` → array plano. Con ambos → `{ count, next, previous, results }`. Parámetros `search` y `status` aplican filtros.")
    public ResponseEntity<Object> findAll(
            @Parameter(description = "Búsqueda por nombre, email o teléfono") @RequestParam(required = false) String search,
            @Parameter(description = "Filtro por estatus CRM") @RequestParam(required = false) Client.ClientStatus status,
            @Parameter(description = "Resultados por página") @RequestParam(required = false) Integer limit,
            @Parameter(description = "Desplazamiento")        @RequestParam(required = false) Integer offset,
            HttpServletRequest request
    ) {
        ClientFilterDTO filter = new ClientFilterDTO(search, status);
        if (limit != null && offset != null) {
            PaginationUtils.validate(limit, offset);
            var page = clientService.findAll(filter, PaginationUtils.toPageable(limit, offset));
            return ResponseEntity.ok(PaginationUtils.build(page, limit, offset,
                    request.getRequestURL().toString(), request.getQueryString()));
        }
        return ResponseEntity.ok(clientService.findAll(filter));
    }

    @GetMapping("/agent/{agentId}")
    @Operation(summary = "Clientes por agente")
    public ResponseEntity<List<ClientDTO>> findByAgent(@PathVariable UUID agentId) {
        return ResponseEntity.ok(clientService.findByAgent(agentId));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Clientes por estatus CRM")
    public ResponseEntity<List<ClientDTO>> findByStatus(@PathVariable Client.ClientStatus status) {
        return ResponseEntity.ok(clientService.findByStatus(status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cliente por ID")
    public ResponseEntity<ClientDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(clientService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Registrar cliente",
               description = "AGENT: el cliente queda asignado al usuario autenticado (no puede asignar otro agente).")
    public ResponseEntity<ClientDTO> create(
            @Valid @RequestBody ClientCreateDTO dto,
            @AuthenticationPrincipal User user) {
        ClientCreateDTO toSave = dto;
        if (user.getRole() == User.Role.AGENT) {
            toSave = new ClientCreateDTO(
                    dto.name(),
                    dto.email(),
                    dto.phone(),
                    dto.budgetMin(),
                    dto.budgetMax(),
                    dto.interestedType(),
                    dto.interestedCity(),
                    dto.status(),
                    dto.notes(),
                    user.getId()
            );
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.create(toSave));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar cliente",
               description = "AGENT: no puede reasignar el cliente a otro agente (campo `agentId`).")
    public ResponseEntity<ClientDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody ClientUpdateDTO dto,
            @AuthenticationPrincipal User user) {
        if (user.getRole() == User.Role.AGENT
                && dto.agentId() != null
                && !dto.agentId().equals(user.getId())) {
            throw new AccessDeniedException("Agent cannot reassign client");
        }
        return ResponseEntity.ok(clientService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cliente (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
