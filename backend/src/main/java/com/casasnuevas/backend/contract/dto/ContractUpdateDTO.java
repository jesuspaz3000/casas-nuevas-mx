package com.casasnuevas.backend.contract.dto;

import com.casasnuevas.backend.contract.model.Contract;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ContractUpdateDTO(
        Contract.ContractStatus status,
        @DecimalMin("0.0") BigDecimal salePrice,
        @Size(max = 13) String clientRfc,
        String clientAddress,
        @Size(max = 10) String clientCfdiUse,
        String pdfUrl
) {}
