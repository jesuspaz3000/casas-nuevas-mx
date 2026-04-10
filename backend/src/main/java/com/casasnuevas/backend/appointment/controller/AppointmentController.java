package com.casasnuevas.backend.appointment.controller;

import com.casasnuevas.backend.appointment.dto.AppointmentCreateDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentFilterDTO;
import com.casasnuevas.backend.appointment.dto.AppointmentUpdateDTO;
import com.casasnuevas.backend.appointment.model.Appointment;
import com.casasnuevas.backend.appointment.service.AppointmentService;
import com.casasnuevas.backend.common.util.PaginationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Tag(name = "Citas", description = "Agenda de visitas. Sin limit/offset devuelve array; con ambos devuelve objeto paginado.")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    @Operation(summary = "Listar citas",
               description = "Sin `limit`/`offset` → array plano. Con ambos → `{ count, next, previous, results }`")
    public ResponseEntity<Object> findAll(
            @Parameter(description = "Resultados por página") @RequestParam(required = false) Integer limit,
            @Parameter(description = "Desplazamiento")        @RequestParam(required = false) Integer offset,
            @Parameter(description = "Búsqueda por nombre de cliente o título de propiedad") @RequestParam(required = false) String search,
            @Parameter(description = "Filtrar por estado")   @RequestParam(required = false) Appointment.AppointmentStatus status,
            HttpServletRequest request
    ) {
        AppointmentFilterDTO filter = new AppointmentFilterDTO(search, status);
        if (limit != null && offset != null) {
            PaginationUtils.validate(limit, offset);
            var page = appointmentService.findAll(filter, PaginationUtils.toPageable(limit, offset));
            return ResponseEntity.ok(PaginationUtils.build(page, limit, offset,
                    request.getRequestURL().toString(), request.getQueryString()));
        }
        return ResponseEntity.ok(appointmentService.findAll(filter));
    }

    @GetMapping("/agent/{agentId}")
    @Operation(summary = "Citas por agente")
    public ResponseEntity<List<AppointmentDTO>> findByAgent(@PathVariable UUID agentId) {
        return ResponseEntity.ok(appointmentService.findByAgent(agentId));
    }

    @GetMapping("/client/{clientId}")
    @Operation(summary = "Citas por cliente")
    public ResponseEntity<List<AppointmentDTO>> findByClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(appointmentService.findByClient(clientId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cita por ID")
    public ResponseEntity<AppointmentDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Agendar cita")
    public ResponseEntity<AppointmentDTO> create(@Valid @RequestBody AppointmentCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.create(dto));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar cita")
    public ResponseEntity<AppointmentDTO> update(@PathVariable UUID id, @Valid @RequestBody AppointmentUpdateDTO dto) {
        return ResponseEntity.ok(appointmentService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar cita (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
