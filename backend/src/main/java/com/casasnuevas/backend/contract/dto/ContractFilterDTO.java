package com.casasnuevas.backend.contract.dto;

import com.casasnuevas.backend.contract.model.Contract;

public record ContractFilterDTO(
        String search,
        Contract.ContractStatus status,
        Contract.ContractType contractType
) {}
