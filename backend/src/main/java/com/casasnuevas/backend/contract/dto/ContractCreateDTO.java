package com.casasnuevas.backend.contract.dto;

import com.casasnuevas.backend.contract.model.Contract;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record ContractCreateDTO(
        @NotNull UUID propertyId,
        @NotNull UUID clientId,
        @NotNull UUID agentId,
        @NotNull Contract.ContractType contractType,
        @NotNull @DecimalMin("0.0") BigDecimal reservationPrice,
        @DecimalMin("0.0") BigDecimal salePrice,
        @Size(max = 13) String clientRfc,
        String clientAddress,
        @Size(max = 10) String clientCfdiUse
) {}
