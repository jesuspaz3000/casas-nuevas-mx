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
import com.casasnuevas.backend.notification.EmailService;
import com.casasnuevas.backend.property.model.Property;
import com.casasnuevas.backend.property.repository.PropertyRepository;
import com.casasnuevas.backend.user.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final PropertyRepository propertyRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private static final String DEFAULT_COMPANY_NAME = "Casas Nuevas MX";
    private static final String DEFAULT_COMPANY_RFC = "CNMX8506269H50";

    private static final Color BRAND = new Color(30, 64, 175);
    private static final Color TEXT_MUTED = new Color(107, 114, 128);
    private static final Color TEXT_BODY = new Color(17, 24, 39);
    private static final Color ROW_ALT = new Color(249, 250, 251);
    private static final Color BORDER = new Color(229, 231, 235);

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
        Property property = propertyRepository.findById(dto.propertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Property", dto.propertyId()));
        if (property.getStatus() == Property.PropertyStatus.SOLD) {
            throw new IllegalArgumentException("La propiedad está vendida y no admite nuevos contratos.");
        }

        if (contractRepository.existsByProperty_IdAndStatusIn(dto.propertyId(),
                EnumSet.of(Contract.ContractStatus.DRAFT, Contract.ContractStatus.PENDING_SIGNATURE))) {
            throw new IllegalArgumentException(
                    "Esta propiedad ya tiene un contrato en borrador o pendiente de firma. "
                            + "Fírmalo, cancélalo o edítalo antes de crear otro sobre la misma propiedad.");
        }

        var client = clientRepository.findById(dto.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", dto.clientId()));
        var agent = userRepository.findById(dto.agentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", dto.agentId()));

        for (int attempt = 0; attempt < 15; attempt++) {
            String folio = generateFolio();
            if (contractRepository.findByFolio(folio).isPresent()) {
                continue;
            }
            Contract contract = Contract.builder()
                    .folio(folio)
                    .property(property)
                    .client(client)
                    .agent(agent)
                    .contractType(dto.contractType())
                    .status(Contract.ContractStatus.PENDING_SIGNATURE)
                    .reservationPrice(dto.reservationPrice())
                    .salePrice(dto.salePrice())
                    .clientRfc(dto.clientRfc())
                    .clientAddress(dto.clientAddress())
                    .clientCfdiUse(dto.clientCfdiUse())
                    .build();
            try {
                return toDTO(contractRepository.save(contract));
            } catch (DataIntegrityViolationException ex) {
                if (!isUniqueConstraintViolation(ex)) {
                    throw ex;
                }
            }
        }
        throw new IllegalStateException("No se pudo generar un folio único. Intenta de nuevo.");
    }

    @Override
    @Transactional
    public ContractDTO update(UUID id, ContractUpdateDTO dto) {
        Contract contract = getOrThrow(id);
        Contract.ContractStatus previousStatus = contract.getStatus();
        if (dto.status() != null)       contract.setStatus(dto.status());
        if (dto.salePrice() != null)    contract.setSalePrice(dto.salePrice());
        if (dto.clientRfc() != null)    contract.setClientRfc(dto.clientRfc());
        if (dto.clientAddress() != null) contract.setClientAddress(dto.clientAddress());
        if (dto.clientCfdiUse() != null) contract.setClientCfdiUse(dto.clientCfdiUse());
        if (dto.pdfUrl() != null)       contract.setPdfUrl(dto.pdfUrl());

        if (dto.status() == Contract.ContractStatus.SIGNED && previousStatus != Contract.ContractStatus.SIGNED) {
            applyPropertyStatusWhenContractSigned(contract);
        }

        return toDTO(contractRepository.save(contract));
    }

    @Override
    @Transactional(readOnly = true)
    public void sendClientEmailNotification(UUID id) {
        Contract contract = getOrThrow(id);
        String to = contract.getClient().getEmail();
        if (to == null || to.isBlank()) {
            throw new IllegalArgumentException("El cliente no tiene correo electrónico registrado.");
        }
        boolean sent = emailService.sendContractSummaryToClient(
                to,
                contract.getClient().getName(),
                contract.getFolio(),
                contract.getProperty().getTitle(),
                formatContractType(contract.getContractType()),
                formatContractStatus(contract.getStatus()),
                contract.getAgent().getName());
        if (!sent) {
            throw new IllegalArgumentException(
                    "No se pudo enviar el correo. Comprueba la configuración SMTP del servidor (spring.mail.*).");
        }
    }

    /** Compraventa firmada → propiedad vendida; reserva firmada → propiedad reservada. */
    private void applyPropertyStatusWhenContractSigned(Contract contract) {
        Property property = contract.getProperty();
        if (contract.getContractType() == Contract.ContractType.PURCHASE_AGREEMENT) {
            property.setStatus(Property.PropertyStatus.SOLD);
        } else if (contract.getContractType() == Contract.ContractType.RESERVATION) {
            property.setStatus(Property.PropertyStatus.RESERVED);
        }
        propertyRepository.save(property);
    }

    @Override
    @Transactional
    public byte[] generatePdf(UUID id) {
        Contract c = getOrThrow(id);

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 48, 48, 48, 48);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font brandFont = new Font(Font.HELVETICA, 20, Font.BOLD, BRAND);
            Font docTitleFont = new Font(Font.HELVETICA, 14, Font.BOLD, TEXT_BODY);
            Font metaFont = new Font(Font.HELVETICA, 10, Font.NORMAL, TEXT_MUTED);
            Font sectionHeadFont = new Font(Font.HELVETICA, 11, Font.BOLD, Color.WHITE);
            Font labelFont = new Font(Font.HELVETICA, 9, Font.BOLD, TEXT_MUTED);
            Font valueFont = new Font(Font.HELVETICA, 10, Font.NORMAL, TEXT_BODY);
            Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, TEXT_MUTED);

            Paragraph brand = new Paragraph("CASAS NUEVAS MX", brandFont);
            brand.setAlignment(Element.ALIGN_CENTER);
            brand.setSpacingAfter(4);
            doc.add(brand);

            Paragraph docTitle = new Paragraph("Contrato de " + formatContractType(c.getContractType()), docTitleFont);
            docTitle.setAlignment(Element.ALIGN_CENTER);
            docTitle.setSpacingAfter(12);
            doc.add(docTitle);

            PdfPTable meta = new PdfPTable(2);
            meta.setWidthPercentage(55);
            meta.setHorizontalAlignment(Element.ALIGN_CENTER);
            meta.setSpacingAfter(8);
            meta.setWidths(new float[]{1f, 1f});
            addMetaCell(meta, "Folio", c.getFolio(), labelFont, valueFont);
            addMetaCell(meta, "Fecha de emisión", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), labelFont, valueFont);
            doc.add(meta);

            LineSeparator line = new LineSeparator(1f, 100f, BRAND, Element.ALIGN_CENTER, -2f);
            Paragraph sep = new Paragraph();
            sep.add(new Chunk(line));
            sep.setSpacingAfter(14);
            doc.add(sep);

            BigDecimal displaySale = c.getSalePrice() != null ? c.getSalePrice() : c.getReservationPrice();

            doc.add(buildSection("Datos de la propiedad", sectionHeadFont, labelFont, valueFont,
                    new String[][]{
                            {"Propiedad", c.getProperty().getTitle()},
                            {"Precio de venta", formatMoneyMx(displaySale)},
                            {"Monto de reserva", formatMoneyMx(c.getReservationPrice())}
                    }));

            doc.add(buildSection("Datos del cliente", sectionHeadFont, labelFont, valueFont,
                    new String[][]{
                            {"Nombre", c.getClient().getName()},
                            {"RFC", nvl(c.getClientRfc())},
                            {"Domicilio fiscal", nvl(c.getClientAddress())},
                            {"Uso CFDI", nvl(c.getClientCfdiUse())}
                    }));

            doc.add(buildSection("Datos de la empresa (emisora)", sectionHeadFont, labelFont, valueFont,
                    new String[][]{
                            {"Razón social", companyNameOrDefault(c)},
                            {"RFC", companyRfcOrDefault(c)}
                    }));

            PdfPTable agentTable = new PdfPTable(1);
            agentTable.setWidthPercentage(100);
            agentTable.setSpacingBefore(6);
            PdfPCell agentCell = new PdfPCell(new Phrase("Agente responsable: " + c.getAgent().getName(), valueFont));
            agentCell.setBorder(Rectangle.BOX);
            agentCell.setBorderColor(BORDER);
            agentCell.setBackgroundColor(ROW_ALT);
            agentCell.setPadding(10);
            agentTable.addCell(agentCell);
            doc.add(agentTable);

            doc.add(Chunk.NEWLINE);
            Paragraph sigHint = new Paragraph("Las partes firman de conformidad en la ciudad y fecha indicadas en el encabezado.", smallFont);
            sigHint.setAlignment(Element.ALIGN_CENTER);
            sigHint.setSpacingAfter(14);
            doc.add(sigHint);

            PdfPTable sig = new PdfPTable(2);
            sig.setWidthPercentage(100);
            sig.setWidths(new float[]{1f, 1f});
            sig.setSpacingBefore(4);
            sig.setSpacingAfter(8);
            sig.addCell(buildSignatureColumn("Firma del cliente", smallFont));
            sig.addCell(buildSignatureColumn("Firma del agente", smallFont));
            doc.add(sig);

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

    /**
     * Folio único: fecha + UUID sin guiones (32 hex). Cabe en columna 64 y evita colisiones del antiguo
     * sufijo de 6 caracteres o truncamientos si la columna en BD era más corta que el valor generado.
     */
    private String generateFolio() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String suffix = UUID.randomUUID().toString().replace("-", "").toUpperCase(Locale.ROOT);
        return String.format("CNMX-%s-%s", date, suffix);
    }

    /** Solo reintentar creación ante violación de unicidad (p. ej. folio duplicado), no ante FK u otros. */
    private static boolean isUniqueConstraintViolation(DataIntegrityViolationException ex) {
        String m = Optional.ofNullable(ex.getMostSpecificCause())
                .map(Throwable::getMessage)
                .map(String::toLowerCase)
                .orElse("");
        return m.contains("unique") || m.contains("duplicate key");
    }

    private String formatContractType(Contract.ContractType type) {
        return type == Contract.ContractType.RESERVATION ? "Reserva" : "Compraventa";
    }

    private String formatContractStatus(Contract.ContractStatus status) {
        return switch (status) {
            case DRAFT -> "Borrador";
            case PENDING_SIGNATURE -> "Pendiente de firma";
            case SIGNED -> "Firmado";
            case CANCELLED -> "Cancelado";
        };
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
                companyRfcOrDefault(c), companyNameOrDefault(c),
                c.getPdfUrl(), c.getCreatedAt()
        );
    }

    private void addMetaCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        Phrase phrase = new Phrase();
        phrase.add(new Chunk(label + "\n", labelFont));
        phrase.add(new Chunk(value, valueFont));
        PdfPCell cell = new PdfPCell(phrase);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_TOP);
        cell.setPadding(4);
        table.addCell(cell);
    }

    private PdfPTable buildSection(String title, Font headFont, Font labelFont, Font valueFont, String[][] rows) {
        PdfPTable table = new PdfPTable(2);
        try {
            table.setWidths(new float[]{30f, 70f});
        } catch (DocumentException ignored) {
            // widths are valid
        }
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setSpacingAfter(2);

        PdfPCell head = new PdfPCell(new Phrase(title.toUpperCase(Locale.ROOT), headFont));
        head.setColspan(2);
        head.setBackgroundColor(BRAND);
        head.setBorder(Rectangle.BOX);
        head.setBorderColor(BRAND);
        head.setPadding(10);
        head.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(head);

        boolean alt = false;
        for (String[] row : rows) {
            String val = row[1] == null ? "—" : row[1];
            PdfPCell lc = new PdfPCell(new Phrase(row[0], labelFont));
            lc.setPadding(8);
            lc.setBorder(Rectangle.BOX);
            lc.setBorderColor(BORDER);
            lc.setBackgroundColor(alt ? ROW_ALT : Color.WHITE);
            lc.setVerticalAlignment(Element.ALIGN_MIDDLE);

            PdfPCell vc = new PdfPCell(new Phrase(val, valueFont));
            vc.setPadding(8);
            vc.setBorder(Rectangle.BOX);
            vc.setBorderColor(BORDER);
            vc.setBackgroundColor(alt ? ROW_ALT : Color.WHITE);
            vc.setVerticalAlignment(Element.ALIGN_MIDDLE);

            table.addCell(lc);
            table.addCell(vc);
            alt = !alt;
        }
        return table;
    }

    /**
     * Columna de firma: espacio en blanco arriba y una línea horizontal propia (borde superior del pie),
     * para no fusionar una sola raya en todo el ancho del PdfPTable de 2 columnas.
     */
    private PdfPCell buildSignatureColumn(String caption, Font captionFont) {
        PdfPTable inner = new PdfPTable(1);
        inner.setWidthPercentage(100);

        PdfPCell signSpace = new PdfPCell(new Phrase(" "));
        signSpace.setMinimumHeight(44);
        signSpace.setBorder(Rectangle.NO_BORDER);
        signSpace.setPadding(0);
        inner.addCell(signSpace);

        Paragraph cap = new Paragraph(caption, captionFont);
        cap.setAlignment(Element.ALIGN_CENTER);
        PdfPCell captionCell = new PdfPCell(cap);
        captionCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        captionCell.setVerticalAlignment(Element.ALIGN_TOP);
        captionCell.setBorder(Rectangle.TOP);
        captionCell.setBorderWidthTop(0.75f);
        captionCell.setBorderColor(BORDER);
        captionCell.setPaddingTop(8);
        captionCell.setPaddingBottom(2);
        captionCell.setPaddingLeft(4);
        captionCell.setPaddingRight(4);
        inner.addCell(captionCell);

        PdfPCell outer = new PdfPCell(inner);
        outer.setBorder(Rectangle.NO_BORDER);
        outer.setPaddingLeft(16);
        outer.setPaddingRight(16);
        outer.setPaddingTop(4);
        outer.setPaddingBottom(4);
        return outer;
    }

    private String formatMoneyMx(BigDecimal amount) {
        if (amount == null) {
            return "—";
        }
        NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("es", "MX"));
        nf.setRoundingMode(RoundingMode.HALF_UP);
        return nf.format(amount);
    }

    private String companyNameOrDefault(Contract c) {
        String n = c.getCompanyName();
        return (n != null && !n.isBlank()) ? n : DEFAULT_COMPANY_NAME;
    }

    private String companyRfcOrDefault(Contract c) {
        String r = c.getCompanyRfc();
        return (r != null && !r.isBlank()) ? r : DEFAULT_COMPANY_RFC;
    }
}
