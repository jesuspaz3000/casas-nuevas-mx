package com.casasnuevas.backend.contract.dto;

import com.casasnuevas.backend.contract.model.Contract;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ContractDTO(
        UUID id,
        String folio,
        UUID propertyId,
        String propertyTitle,
        UUID clientId,
        String clientName,
        UUID agentId,
        String agentName,
        Contract.ContractType contractType,
        Contract.ContractStatus status,
        BigDecimal reservationPrice,
        BigDecimal salePrice,
        String clientRfc,
        String clientAddress,
        String clientCfdiUse,
        String companyRfc,
        String companyName,
        String pdfUrl,
        LocalDateTime createdAt
) {}
