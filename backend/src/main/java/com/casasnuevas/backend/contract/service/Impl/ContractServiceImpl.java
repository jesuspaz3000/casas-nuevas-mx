package com.casasnuevas.backend.contract.service.Impl;

import com.casasnuevas.backend.client.repository.ClientRepository;
import com.casasnuevas.backend.common.exception.ResourceNotFoundException;
import com.casasnuevas.backend.contract.dto.ContractCreateDTO;
import com.casasnuevas.backend.contract.dto.ContractDTO;
import com.casasnuevas.backend.contract.dto.ContractFilterDTO;
import com.casasnuevas.backend.contract.dto.ContractUpdateDTO;
import com.casasnuevas.backend.contract.model.Contract;
import com.casasnuevas.backend.contract.repository.ContractRepository;
import com.casasnuevas.backend.contract.repository.ContractSpecification;
import com.casasnuevas.backend.contract.service.ContractService;
import com.casasnuevas.backend.property.repository.PropertyRepository;
import com.casasnuevas.backend.user.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final PropertyRepository propertyRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public List<ContractDTO> findAll() {
        return contractRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    public List<ContractDTO> findAll(ContractFilterDTO filter) {
        return contractRepository.findAll(ContractSpecification.withFilters(filter))
                .stream().map(this::toDTO).toList();
    }

    @Override
    public Page<ContractDTO> findAll(Pageable pageable) {
        return contractRepository.findAll(pageable).map(this::toDTO);
    }

    @Override
    public Page<ContractDTO> findAll(ContractFilterDTO filter, Pageable pageable) {
        return contractRepository.findAll(ContractSpecification.withFilters(filter), pageable)
                .map(this::toDTO);
    }

    @Override
    public List<ContractDTO> findByAgent(UUID agentId) {
        return contractRepository.findByAgentId(agentId).stream().map(this::toDTO).toList();
    }

    @Override
    public ContractDTO findById(UUID id) {
        return toDTO(getOrThrow(id));
    }

    @Override
    @Transactional
    public ContractDTO create(ContractCreateDTO dto) {
        String folio = generateFolio();

        Contract contract = Contract.builder()
                .folio(folio)
                .property(propertyRepository.findById(dto.propertyId())
                        .orElseThrow(() -> new ResourceNotFoundException("Property", dto.propertyId())))
                .client(clientRepository.findById(dto.clientId())
                        .orElseThrow(() -> new ResourceNotFoundException("Client", dto.clientId())))
                .agent(userRepository.findById(dto.agentId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId())))
                .contractType(dto.contractType())
                .status(Contract.ContractStatus.DRAFT)
                .reservationPrice(dto.reservationPrice())
                .salePrice(dto.salePrice())
                .clientRfc(dto.clientRfc())
                .clientAddress(dto.clientAddress())
                .clientCfdiUse(dto.clientCfdiUse())
                .build();

        return toDTO(contractRepository.save(contract));
    }

    @Override
    @Transactional
    public ContractDTO update(UUID id, ContractUpdateDTO dto) {
        Contract contract = getOrThrow(id);
        if (dto.status() != null)       contract.setStatus(dto.status());
        if (dto.salePrice() != null)    contract.setSalePrice(dto.salePrice());
        if (dto.clientRfc() != null)    contract.setClientRfc(dto.clientRfc());
        if (dto.clientAddress() != null) contract.setClientAddress(dto.clientAddress());
        if (dto.clientCfdiUse() != null) contract.setClientCfdiUse(dto.clientCfdiUse());
        if (dto.pdfUrl() != null)       contract.setPdfUrl(dto.pdfUrl());
        return toDTO(contractRepository.save(contract));
    }

    @Override
    @Transactional
    public byte[] generatePdf(UUID id) {
        Contract c = getOrThrow(id);

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 50, 50, 60, 60);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font bodyFont   = FontFactory.getFont(FontFactory.HELVETICA, 10);

            doc.add(new Paragraph("CASAS NUEVAS MX", titleFont));
            doc.add(new Paragraph("Contrato de " + formatContractType(c.getContractType()), titleFont));
            doc.add(new Paragraph("Folio: " + c.getFolio(), bodyFont));
            doc.add(new Paragraph("Fecha: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), bodyFont));
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("DATOS DE LA PROPIEDAD", headerFont));
            doc.add(new Paragraph("Propiedad: " + c.getProperty().getTitle(), bodyFont));
            doc.add(new Paragraph("Precio de venta: $" + (c.getSalePrice() != null ? c.getSalePrice() : c.getReservationPrice()) + " MXN", bodyFont));
            doc.add(new Paragraph("Monto de reserva: $" + c.getReservationPrice() + " MXN", bodyFont));
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("DATOS DEL CLIENTE", headerFont));
            doc.add(new Paragraph("Nombre: " + c.getClient().getName(), bodyFont));
            doc.add(new Paragraph("RFC: " + nvl(c.getClientRfc()), bodyFont));
            doc.add(new Paragraph("Domicilio fiscal: " + nvl(c.getClientAddress()), bodyFont));
            doc.add(new Paragraph("Uso CFDI: " + nvl(c.getClientCfdiUse()), bodyFont));
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("DATOS DE LA EMPRESA", headerFont));
            doc.add(new Paragraph("Razón social: " + c.getCompanyName(), bodyFont));
            doc.add(new Paragraph("RFC: " + c.getCompanyRfc(), bodyFont));
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("Agente responsable: " + c.getAgent().getName(), bodyFont));
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("_______________________________          _______________________________", bodyFont));
            doc.add(new Paragraph("       Firma del cliente                          Firma del agente", bodyFont));

            doc.close();

            byte[] pdfBytes = out.toByteArray();

            // Save to disk and update pdfUrl
            Path contractsDir = Paths.get(uploadDir, "contracts");
            Files.createDirectories(contractsDir);
            String filename = c.getFolio() + ".pdf";
            Files.write(contractsDir.resolve(filename), pdfBytes);

            c.setPdfUrl("/uploads/contracts/" + filename);
            contractRepository.save(c);

            return pdfBytes;
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF for contract " + id, e);
        }
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String generateFolio() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = contractRepository.count() + 1;
        return String.format("CNMX-%s-%03d", date, count);
    }

    private String formatContractType(Contract.ContractType type) {
        return type == Contract.ContractType.RESERVATION ? "Reserva" : "Compraventa";
    }

    private String nvl(String value) {
        return value != null ? value : "N/A";
    }

    private Contract getOrThrow(UUID id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract", id));
    }

    private ContractDTO toDTO(Contract c) {
        return new ContractDTO(
                c.getId(), c.getFolio(),
                c.getProperty().getId(), c.getProperty().getTitle(),
                c.getClient().getId(),   c.getClient().getName(),
                c.getAgent().getId(),    c.getAgent().getName(),
                c.getContractType(), c.getStatus(),
                c.getReservationPrice(), c.getSalePrice(),
                c.getClientRfc(), c.getClientAddress(), c.getClientCfdiUse(),
                c.getCompanyRfc(), c.getCompanyName(),
                c.getPdfUrl(), c.getCreatedAt()
        );
    }
}
