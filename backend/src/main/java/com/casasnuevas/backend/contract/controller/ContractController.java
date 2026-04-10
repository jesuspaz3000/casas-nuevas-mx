package com.casasnuevas.backend.contract.controller;

import com.casasnuevas.backend.common.util.PaginationUtils;
import com.casasnuevas.backend.contract.dto.ContractCreateDTO;
import com.casasnuevas.backend.contract.dto.ContractDTO;
import com.casasnuevas.backend.contract.dto.ContractFilterDTO;
import com.casasnuevas.backend.contract.dto.ContractUpdateDTO;
import com.casasnuevas.backend.contract.model.Contract;
import com.casasnuevas.backend.contract.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
@Tag(name = "Contratos", description = "Gestión de contratos y generación de PDF. Sin limit/offset devuelve array; con ambos devuelve objeto paginado.")
public class ContractController {

    private final ContractService contractService;

    @GetMapping
    @Operation(summary = "Listar contratos",
               description = "Sin `limit`/`offset` → array plano. Con ambos → `{ count, next, previous, results }`. "
                       + "Parámetros `search`, `status` y `contractType` aplican filtros.")
    public ResponseEntity<Object> findAll(
            @Parameter(description = "Búsqueda por folio, título de propiedad o nombre de cliente")
            @RequestParam(required = false) String search,
            @Parameter(description = "Filtro por estatus del contrato") @RequestParam(required = false) Contract.ContractStatus status,
            @Parameter(description = "Filtro por tipo de contrato") @RequestParam(required = false) Contract.ContractType contractType,
            @Parameter(description = "Resultados por página") @RequestParam(required = false) Integer limit,
            @Parameter(description = "Desplazamiento")        @RequestParam(required = false) Integer offset,
            HttpServletRequest request
    ) {
        ContractFilterDTO filter = new ContractFilterDTO(search, status, contractType);
        if (limit != null && offset != null) {
            PaginationUtils.validate(limit, offset);
            var page = contractService.findAll(filter, PaginationUtils.toPageable(limit, offset));
            return ResponseEntity.ok(PaginationUtils.build(page, limit, offset,
                    request.getRequestURL().toString(), request.getQueryString()));
        }
        return ResponseEntity.ok(contractService.findAll(filter));
    }

    @GetMapping("/agent/{agentId}")
    @Operation(summary = "Contratos por agente")
    public ResponseEntity<List<ContractDTO>> findByAgent(@PathVariable UUID agentId) {
        return ResponseEntity.ok(contractService.findByAgent(agentId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener contrato por ID")
    public ResponseEntity<ContractDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(contractService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear contrato")
    public ResponseEntity<ContractDTO> create(@Valid @RequestBody ContractCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contractService.create(dto));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar contrato")
    public ResponseEntity<ContractDTO> update(@PathVariable UUID id, @Valid @RequestBody ContractUpdateDTO dto) {
        return ResponseEntity.ok(contractService.update(id, dto));
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Descargar PDF del contrato")
    public ResponseEntity<byte[]> generatePdf(@PathVariable UUID id) {
        byte[] pdf = contractService.generatePdf(id);
        ContractDTO contract = contractService.findById(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"contrato-" + contract.folio() + ".pdf\"")
                .body(pdf);
    }
}
