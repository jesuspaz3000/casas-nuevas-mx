package com.casasnuevas.backend.contract.service;

import com.casasnuevas.backend.contract.dto.ContractCreateDTO;
import com.casasnuevas.backend.contract.dto.ContractDTO;
import com.casasnuevas.backend.contract.dto.ContractUpdateDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ContractService {
    List<ContractDTO> findAll();
    Page<ContractDTO> findAll(Pageable pageable);
    List<ContractDTO> findByAgent(UUID agentId);
    ContractDTO findById(UUID id);
    ContractDTO create(ContractCreateDTO dto);
    ContractDTO update(UUID id, ContractUpdateDTO dto);
    byte[] generatePdf(UUID id);
}
