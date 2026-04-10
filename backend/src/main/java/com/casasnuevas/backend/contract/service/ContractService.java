package com.casasnuevas.backend.contract.service;

import com.casasnuevas.backend.contract.dto.ContractCreateDTO;
import com.casasnuevas.backend.contract.dto.ContractDTO;
import com.casasnuevas.backend.contract.dto.ContractFilterDTO;
import com.casasnuevas.backend.contract.dto.ContractUpdateDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ContractService {
    List<ContractDTO> findAll();
    List<ContractDTO> findAll(ContractFilterDTO filter);
    Page<ContractDTO> findAll(Pageable pageable);
    Page<ContractDTO> findAll(ContractFilterDTO filter, Pageable pageable);
    List<ContractDTO> findByAgent(UUID agentId);
    ContractDTO findById(UUID id);
    ContractDTO create(ContractCreateDTO dto);
    ContractDTO update(UUID id, ContractUpdateDTO dto);
    byte[] generatePdf(UUID id);

    /** Envía al cliente un correo de texto con resumen del contrato (folio, tipo, estado). */
    void sendClientEmailNotification(UUID id);
}
