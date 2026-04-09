package com.casasnuevas.backend.property.model;

import com.casasnuevas.backend.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "property_photos")
public class PropertyPhoto extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Column(name = "is_cover", nullable = false)
    private boolean isCover = false;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}