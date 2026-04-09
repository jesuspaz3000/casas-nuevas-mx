package com.casasnuevas.backend.property.service;

import com.casasnuevas.backend.property.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PropertyService {
    Page<PropertyDTO> findAll(PropertyFilterDTO filter, Pageable pageable);
    List<PropertyDTO> findAll(PropertyFilterDTO filter);
    PropertyDTO findById(UUID id);
    PropertyDTO create(PropertyCreateDTO dto);
    PropertyDTO update(UUID id, PropertyUpdateDTO dto);
    void delete(UUID id);
    List<PropertyPhotoDTO> addPhotos(UUID propertyId, List<MultipartFile> files, UUID coverId);
    void deletePhoto(UUID photoId);
}
