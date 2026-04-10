package com.casasnuevas.backend.contract.model;

import com.casasnuevas.backend.client.model.Client;
import com.casasnuevas.backend.common.model.BaseEntity;
import com.casasnuevas.backend.property.model.Property;
import com.casasnuevas.backend.user.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contracts")
public class Contract extends BaseEntity {

    @Column(name = "folio", unique = true, nullable = false, length = 30)
    private String folio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private User agent;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false)
    private ContractType contractType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ContractStatus status = ContractStatus.DRAFT;

    @Column(name = "reservation_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservationPrice;

    @Column(name = "sale_price", precision = 12, scale = 2)
    private BigDecimal salePrice;

    // Datos fiscales cliente
    @Column(name = "client_rfc", length = 13)
    private String clientRfc;

    @Column(name = "client_address", columnDefinition = "TEXT")
    private String clientAddress;

    @Column(name = "client_cfdi_use", length = 10)
    private String clientCfdiUse;

    // Datos fiscales empresa (valores por defecto vía @Builder.Default; sin esto el builder deja null en BD)
    @Builder.Default
    @Column(name = "company_rfc", length = 13)
    private String companyRfc = "CNMX8506269H50";

    @Builder.Default
    @Column(name = "company_name", length = 150)
    private String companyName = "Casas Nuevas MX";

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    public enum ContractType {
        RESERVATION, PURCHASE_AGREEMENT
    }

    public enum ContractStatus {
        DRAFT, PENDING_SIGNATURE, SIGNED, CANCELLED
    }
}