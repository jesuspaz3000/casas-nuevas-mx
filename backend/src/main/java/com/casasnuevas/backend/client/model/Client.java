package com.casasnuevas.backend.client.model;

import com.casasnuevas.backend.common.model.BaseEntity;
import com.casasnuevas.backend.property.model.Property;
import com.casasnuevas.backend.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "clients")
@SQLRestriction("deleted_at IS NULL")
public class Client extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "budget_min", precision = 12, scale = 2)
    private BigDecimal budgetMin;

    @Column(name = "budget_max", precision = 12, scale = 2)
    private BigDecimal budgetMax;

    @Enumerated(EnumType.STRING)
    @Column(name = "interested_type")
    private Property.PropertyType interestedType;

    @Column(name = "interested_city", length = 100)
    private String interestedCity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ClientStatus status;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public enum ClientStatus {
        LEAD, INTERESTED, NEGOTIATING, CLOSED, LOST
    }
}