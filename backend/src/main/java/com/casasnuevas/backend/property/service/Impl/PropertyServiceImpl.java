package com.casasnuevas.backend.property.service.Impl;

import com.casasnuevas.backend.common.exception.ResourceNotFoundException;
import com.casasnuevas.backend.property.dto.*;
import com.casasnuevas.backend.property.model.Property;
import com.casasnuevas.backend.property.model.PropertyPhoto;
import com.casasnuevas.backend.property.repository.PropertyPhotoRepository;
import com.casasnuevas.backend.property.repository.PropertyRepository;
import com.casasnuevas.backend.property.repository.PropertySpecification;
import com.casasnuevas.backend.property.service.PropertyService;
import com.casasnuevas.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyPhotoRepository photoRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public Page<PropertyDTO> findAll(PropertyFilterDTO filter, Pageable pageable) {
        return propertyRepository
                .findAll(PropertySpecification.withFilters(filter), pageable)
                .map(this::toDTO);
    }

    @Override
    public List<PropertyDTO> findAll(PropertyFilterDTO filter) {
        Specification<Property> spec = PropertySpecification.withFilters(filter);
        return propertyRepository.findAll(spec).stream().map(this::toDTO).toList();
    }

    @Override
    public PropertyDTO findById(UUID id) {
        return toDTO(getOrThrow(id));
    }

    @Override
    @Transactional
    public PropertyDTO create(PropertyCreateDTO dto) {
        Property property = Property.builder()
                .title(dto.title())
                .description(dto.description())
                .type(dto.type())
                .status(dto.status())
                .price(dto.price())
                .currency(dto.currency() != null ? dto.currency() : "MXN")
                .street(dto.street())
                .neighborhood(dto.neighborhood())
                .city(dto.city())
                .state(dto.state())
                .zipCode(dto.zipCode())
                .bedrooms(dto.bedrooms())
                .bathrooms(dto.bathrooms())
                .areaM2(dto.areaM2())
                .build();

        if (dto.agentId() != null) {
            property.setAgent(userRepository.findById(dto.agentId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId())));
        }

        return toDTO(propertyRepository.save(property));
    }

    @Override
    @Transactional
    public PropertyDTO update(UUID id, PropertyUpdateDTO dto) {
        Property property = getOrThrow(id);
        if (dto.title() != null)        property.setTitle(dto.title());
        if (dto.description() != null)  property.setDescription(dto.description());
        if (dto.type() != null)         property.setType(dto.type());
        if (dto.status() != null)       property.setStatus(dto.status());
        if (dto.price() != null)        property.setPrice(dto.price());
        if (dto.street() != null)       property.setStreet(dto.street());
        if (dto.neighborhood() != null) property.setNeighborhood(dto.neighborhood());
        if (dto.city() != null)         property.setCity(dto.city());
        if (dto.state() != null)        property.setState(dto.state());
        if (dto.zipCode() != null)      property.setZipCode(dto.zipCode());
        if (dto.bedrooms() != null)     property.setBedrooms(dto.bedrooms());
        if (dto.bathrooms() != null)    property.setBathrooms(dto.bathrooms());
        if (dto.areaM2() != null)       property.setAreaM2(dto.areaM2());
        if (dto.agentId() != null) {
            property.setAgent(userRepository.findById(dto.agentId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId())));
        }
        return toDTO(propertyRepository.save(property));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        Property property = getOrThrow(id);
        property.setDeletedAt(LocalDateTime.now());
        propertyRepository.save(property);
    }

    @Override
    @Transactional
    public List<PropertyPhotoDTO> addPhotos(UUID propertyId, List<MultipartFile> files, UUID coverId) {
        Property property = getOrThrow(propertyId);
        int currentMax = property.getPhotos().size();

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            String url = saveFile(file, propertyId);

            PropertyPhoto photo = PropertyPhoto.builder()
                    .property(property)
                    .url(url)
                    .sortOrder(currentMax + i)
                    .isCover(false)
                    .build();
            photoRepository.save(photo);
            property.getPhotos().add(photo);
        }

        // Marcar portada
        if (coverId != null) {
            property.getPhotos().forEach(p -> p.setCover(p.getId().equals(coverId)));
        } else if (!property.getPhotos().isEmpty() && property.getPhotos().stream().noneMatch(PropertyPhoto::isCover)) {
            property.getPhotos().getFirst().setCover(true);
        }

        propertyRepository.save(property);
        return property.getPhotos().stream().map(this::toPhotoDTO).toList();
    }

    @Override
    @Transactional
    public void deletePhoto(UUID photoId) {
        PropertyPhoto photo = photoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("PropertyPhoto", photoId));
        photoRepository.delete(photo);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String saveFile(MultipartFile file, UUID propertyId) {
        try {
            Path dir = Paths.get(uploadDir, "properties", propertyId.toString());
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), dir.resolve(filename));
            return "/uploads/properties/" + propertyId + "/" + filename;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to save file", e);
        }
    }

    private Property getOrThrow(UUID id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property", id));
    }

    private PropertyDTO toDTO(Property p) {
        return new PropertyDTO(
                p.getId(), p.getTitle(), p.getDescription(), p.getType(), p.getStatus(),
                p.getPrice(), p.getCurrency(), p.getStreet(), p.getNeighborhood(),
                p.getCity(), p.getState(), p.getZipCode(), p.getBedrooms(), p.getBathrooms(),
                p.getAreaM2(),
                p.getAgent() != null ? p.getAgent().getId() : null,
                p.getAgent() != null ? p.getAgent().getName() : null,
                p.getPhotos().stream().map(this::toPhotoDTO).toList(),
                p.getCreatedAt()
        );
    }

    private PropertyPhotoDTO toPhotoDTO(PropertyPhoto ph) {
        return new PropertyPhotoDTO(ph.getId(), ph.getUrl(), ph.isCover(), ph.getSortOrder());
    }
}
