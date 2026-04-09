package com.casasnuevas.backend.property.repository;

import com.casasnuevas.backend.property.model.PropertyPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyPhotoRepository extends JpaRepository<PropertyPhoto, UUID> {

    List<PropertyPhoto> findByPropertyIdOrderBySortOrderAsc(UUID propertyId);
}
