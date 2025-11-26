package com.hotel.reservation_service.service;

import com.hotel.reservation_service.model.Facture;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class PdfService {

    // Couleurs
    private static final DeviceRgb COLOR_PRIMARY = new DeviceRgb(44, 90, 160);      // Bleu
    private static final DeviceRgb COLOR_ACCENT = new DeviceRgb(231, 76, 60);       // Rouge
    private static final DeviceRgb COLOR_GREY = new DeviceRgb(236, 240, 241);       // Gris clair
    private static final DeviceRgb COLOR_SUCCESS = new DeviceRgb(46, 204, 113);     // Vert
    private static final DeviceRgb COLOR_TEXT = new DeviceRgb(149, 165, 166);       // Gris texte

    public byte[] generateFacturePdf(Facture facture) throws Exception {
        log.info("Génération PDF premium pour facture {}", facture.getIdFacture());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        document.setMargins(20, 20, 20, 20);

        try {
            // ==================== EN-TÊTE ====================
            Table headerTable = new Table(2).useAllAvailableWidth();

            // Logo + Titre
            Cell logoCell = new Cell()
                    .add(new Paragraph("🏨 HotelMS")
                            .setFontSize(28)
                            .setBold()
                            .setFontColor(COLOR_PRIMARY))
                    .setBorder(null)
                    .setVerticalAlignment(VerticalAlignment.TOP);

            // Info entreprise
            Cell infoCell = new Cell()
                    .add(new Paragraph("Maroc | Casablanca\n📞 +212 5 22 98 76 54\n📧 contact@hotelms.com")
                            .setFontSize(10)
                            .setTextAlignment(TextAlignment.RIGHT))
                    .setBorder(null)
                    .setVerticalAlignment(VerticalAlignment.TOP);

            headerTable.addCell(logoCell);
            headerTable.addCell(infoCell);
            document.add(headerTable);

            document.add(new Paragraph("\n"));

            // ==================== TITRE FACTURE ====================
            Paragraph title = new Paragraph("FACTURE")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(COLOR_PRIMARY);
            document.add(title);

            // Ligne séparatrice
            Table separatorLine = new Table(1).useAllAvailableWidth();
            Cell separator = new Cell().setHeight(2).setBackgroundColor(COLOR_PRIMARY).setBorder(null);
            separatorLine.addCell(separator);
            document.add(separatorLine);

            document.add(new Paragraph("\n"));

            // ==================== INFOS FACTURE ====================
            Table infoTable = new Table(2).useAllAvailableWidth();
            infoTable.setMarginBottom(20);

            // Colonne gauche
            Cell leftInfo = new Cell()
                    .add(new Paragraph("INFORMATIONS FACTURE")
                            .setFontSize(12)
                            .setBold()
                            .setFontColor(COLOR_PRIMARY))
                    .add(new Paragraph("\n"))
                    .add(new Paragraph("N° Facture: " + facture.getIdFacture())
                            .setFontSize(11))
                    .add(new Paragraph("Date d'émission: " +
                            facture.getDateEmission().format(DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRANCE)))
                            .setFontSize(11))
                    .add(new Paragraph("État: " + facture.getEtat())
                            .setFontSize(11)
                            .setFontColor(facture.getEtat().toString().equals("PAYEE") ? COLOR_SUCCESS : COLOR_ACCENT))
                    .setBorder(null)
                    .setPadding(10)
                    .setBackgroundColor(COLOR_GREY);

            // Colonne droite
            Cell rightInfo = new Cell()
                    .add(new Paragraph("DÉTAILS RÉSERVATION")
                            .setFontSize(12)
                            .setBold()
                            .setFontColor(COLOR_PRIMARY))
                    .add(new Paragraph("\n"))
                    .add(new Paragraph("Réservation: #" + facture.getReservation().getIdReservation())
                            .setFontSize(11))
                    .add(new Paragraph("Chambre: #" + facture.getReservation().getIdChambre())
                            .setFontSize(11))
                    .add(new Paragraph("Durée: " + calculateNights(facture.getReservation().getDateDebut(),
                            facture.getReservation().getDateFin()) + " nuit(s)")
                            .setFontSize(11))
                    .setBorder(null)
                    .setPadding(10)
                    .setBackgroundColor(COLOR_GREY);

            infoTable.addCell(leftInfo);
            infoTable.addCell(rightInfo);
            document.add(infoTable);

            document.add(new Paragraph("\n"));

            // ==================== TABLEAU DÉTAILS ====================
            Table detailsTable = new Table(new float[]{2, 3, 2, 2}).useAllAvailableWidth();
            detailsTable.setMarginBottom(20);

            // En-têtes
            addTableHeader(detailsTable, "Description");
            addTableHeader(detailsTable, "Période");
            addTableHeader(detailsTable, "Nuits");
            addTableHeader(detailsTable, "Montant");

            // Données
            addTableRow(detailsTable, "Séjour à l'hôtel",
                    facture.getReservation().getDateDebut() + " au " + facture.getReservation().getDateFin(),
                    String.valueOf(calculateNights(facture.getReservation().getDateDebut(), facture.getReservation().getDateFin())),
                    facture.getMontantTotal() + " MAD");

            document.add(detailsTable);

            // ==================== TOTAL ====================
            Table totalTable = new Table(2).useAllAvailableWidth();
            totalTable.setMarginBottom(20);

            Cell emptyCell = new Cell().setBorder(null);
            Cell totalCell = new Cell()
                    .add(new Paragraph("MONTANT TOTAL TTC")
                            .setBold()
                            .setFontSize(14))
                    .add(new Paragraph(facture.getMontantTotal() + " MAD")
                            .setFontSize(18)
                            .setBold()
                            .setFontColor(COLOR_ACCENT))
                    .setBackgroundColor(COLOR_GREY)
                    .setPadding(15)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorder(null);

            totalTable.addCell(emptyCell);
            totalTable.addCell(totalCell);
            document.add(totalTable);

            document.add(new Paragraph("\n"));

            // ==================== CONDITIONS ====================
            document.add(new Paragraph("CONDITIONS GÉNÉRALES")
                    .setFontSize(12)
                    .setBold()
                    .setFontColor(COLOR_PRIMARY));

            document.add(new Paragraph("• Paiement à la réception ou avant le départ\n" +
                    "• Annulation jusqu'à 24h avant l'arrivée\n" +
                    "• TVA incluse dans le tarif\n" +
                    "• Merci de votre confiance !")
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.LEFT));

            document.add(new Paragraph("\n"));

            // ==================== FOOTER ====================
            document.add(new Paragraph("HotelMS - Gestion Hôtelière Moderne")
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(COLOR_TEXT));

            document.close();

            log.info("✅ PDF premium généré avec succès");
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération du PDF", e);
            throw e;
        }
    }

    // Méthodes utilitaires
    private void addTableHeader(Table table, String text) {
        Cell cell = new Cell()
                .add(new Paragraph(text).setBold().setFontSize(11))
                .setBackgroundColor(COLOR_PRIMARY)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(10)
                .setTextAlignment(TextAlignment.CENTER);
        table.addCell(cell);
    }

    private void addTableRow(Table table, String... values) {
        DeviceRgb rowColor = new DeviceRgb(245, 245, 245);
        for (String value : values) {
            Cell cell = new Cell()
                    .add(new Paragraph(value).setFontSize(10))
                    .setPadding(10)
                    .setBorderTop(null)
                    .setBackgroundColor(rowColor);
            table.addCell(cell);
        }
    }

    private long calculateNights(java.time.LocalDate start, java.time.LocalDate end) {
        return java.time.temporal.ChronoUnit.DAYS.between(start, end);
    }
}
