package com.casasnuevas.backend.property.controller;

import com.casasnuevas.backend.common.dto.PaginatedResponse;
import com.casasnuevas.backend.common.util.PaginationUtils;
import com.casasnuevas.backend.property.dto.*;
import com.casasnuevas.backend.property.model.Property;
import com.casasnuevas.backend.property.service.PropertyService;
import com.casasnuevas.backend.user.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/properties")
@RequiredArgsConstructor
@Tag(name = "Propiedades", description = "Catálogo con filtros avanzados. Sin limit/offset devuelve array; con limit/offset devuelve objeto paginado.")
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    @Operation(summary = "Listar propiedades",
               description = "Sin `limit`/`offset` → array plano. Con ambos → `{ count, next, previous, results }`")
    public ResponseEntity<Object> findAll(
            @Parameter(description = "Buscar por título")  @RequestParam(required = false) String search,
            @Parameter(description = "Tipo de propiedad") @RequestParam(required = false) Property.PropertyType type,
            @Parameter(description = "Estatus")           @RequestParam(required = false) Property.PropertyStatus status,
            @Parameter(description = "Ciudad")            @RequestParam(required = false) String city,
            @Parameter(description = "Colonia")           @RequestParam(required = false) String neighborhood,
            @Parameter(description = "Precio mínimo")     @RequestParam(required = false) BigDecimal priceMin,
            @Parameter(description = "Precio máximo")     @RequestParam(required = false) BigDecimal priceMax,
            @Parameter(description = "Recámaras mínimo")  @RequestParam(required = false) Integer bedroomsMin,
            @Parameter(description = "Baños mínimo")      @RequestParam(required = false) Integer bathroomsMin,
            @Parameter(description = "M² mínimo")         @RequestParam(required = false) BigDecimal areaM2Min,
            @Parameter(description = "Resultados por página") @RequestParam(required = false) Integer limit,
            @Parameter(description = "Desplazamiento")        @RequestParam(required = false) Integer offset,
            HttpServletRequest request
    ) {
        PropertyFilterDTO filter = new PropertyFilterDTO(
                search, type, status, city, neighborhood, priceMin, priceMax, bedroomsMin, bathroomsMin, areaM2Min
        );

        if (limit != null && offset != null) {
            PaginationUtils.validate(limit, offset);
            var page = propertyService.findAll(filter, PaginationUtils.toPageable(limit, offset));
            return ResponseEntity.ok(PaginationUtils.build(page, limit, offset,
                    request.getRequestURL().toString(), request.getQueryString()));
        }

        return ResponseEntity.ok(propertyService.findAll(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener propiedad por ID")
    public ResponseEntity<PropertyDTO> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(propertyService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear propiedad",
               description = "AGENT: la propiedad queda asignada al usuario autenticado (no puede asignar otro agente).")
    public ResponseEntity<PropertyDTO> create(
            @Valid @RequestBody PropertyCreateDTO dto,
            @AuthenticationPrincipal User user) {
        PropertyCreateDTO toSave = dto;
        if (user.getRole() == User.Role.AGENT) {
            toSave = new PropertyCreateDTO(
                    dto.title(),
                    dto.description(),
                    dto.type(),
                    dto.status(),
                    dto.price(),
                    dto.currency(),
                    dto.street(),
                    dto.neighborhood(),
                    dto.city(),
                    dto.state(),
                    dto.zipCode(),
                    dto.bedrooms(),
                    dto.bathrooms(),
                    dto.areaM2(),
                    user.getId()
            );
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(propertyService.create(toSave));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Actualizar propiedad",
               description = "AGENT: no puede reasignar la propiedad a otro agente (campo `agentId`).")
    public ResponseEntity<PropertyDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody PropertyUpdateDTO dto,
            @AuthenticationPrincipal User user) {
        if (user.getRole() == User.Role.AGENT
                && dto.agentId() != null
                && !dto.agentId().equals(user.getId())) {
            throw new AccessDeniedException("Agent cannot reassign property");
        }
        return ResponseEntity.ok(propertyService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar propiedad (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        propertyService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Subir fotos a una propiedad")
    public ResponseEntity<List<PropertyPhotoDTO>> addPhotos(
            @PathVariable UUID id,
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam(required = false) UUID coverId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(propertyService.addPhotos(id, files, coverId));
    }

    @DeleteMapping("/photos/{photoId}")
    @Operation(summary = "Eliminar foto de propiedad")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID photoId) {
        propertyService.deletePhoto(photoId);
        return ResponseEntity.noContent().build();
    }
}
