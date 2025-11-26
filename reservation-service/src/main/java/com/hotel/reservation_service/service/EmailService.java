package com.hotel.reservation_service.service;

import com.hotel.reservation_service.model.Facture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final PdfService pdfService;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.mail.from-name}")
    private String mailFromName;

    /**
     * Envoyer la facture par email avec PDF en pièce jointe
     */
    public void sendFactureEmail(Facture facture, String email) {
        try {
            log.info("📧 Préparation de l'email pour facture {} à {}", facture.getIdFacture(), email);

            // Générer le PDF
            byte[] pdfBytes = pdfService.generateFacturePdf(facture);

            // Créer le message
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Destinataire et sujet
            helper.setTo(email);
            helper.setFrom(mailFrom, mailFromName);
            helper.setSubject("Facture #" + facture.getIdFacture() + " - HotelMS");

            // Contenu HTML
            String htmlContent = buildEmailContent(facture);
            helper.setText(htmlContent, true);

            // Ajouter le PDF en pièce jointe
            helper.addAttachment(
                    "facture-" + facture.getIdFacture() + ".pdf",
                    new ByteArrayResource(pdfBytes),
                    "application/pdf"
            );

            // Envoyer
            mailSender.send(message);
            log.info("✅ Email envoyé avec succès pour facture {}", facture.getIdFacture());

        } catch (MessagingException e) {
            log.error("❌ Erreur lors de l'envoi de l'email", e);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération du PDF pour email", e);
        }
    }

    /**
     * Construire le contenu HTML de l'email
     */
    private String buildEmailContent(Facture facture) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", java.util.Locale.FRANCE);

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background-color: #2C5AA0; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }\n" +
                "        .content { background-color: #f5f5f5; padding: 20px; }\n" +
                "        .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #E74C3C; }\n" +
                "        .total { font-size: 24px; font-weight: bold; color: #E74C3C; text-align: right; }\n" +
                "        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }\n" +
                "        table { width: 100%; border-collapse: collapse; }\n" +
                "        th { background-color: #2C5AA0; color: white; padding: 10px; text-align: left; }\n" +
                "        td { padding: 10px; border-bottom: 1px solid #ddd; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>🏨 HotelMS</h1>\n" +
                "            <p>Votre facture d'hébergement</p>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Bonjour,</h2>\n" +
                "            <p>Veuillez trouver ci-jointe votre facture pour votre séjour à HotelMS.</p>\n" +
                "\n" +
                "            <div class='info-box'>\n" +
                "                <strong>Détails de votre réservation :</strong><br>\n" +
                "                Réservation: #" + facture.getReservation().getIdReservation() + "<br>\n" +
                "                Chambre: #" + facture.getReservation().getIdChambre() + "<br>\n" +
                "                Du: " + facture.getReservation().getDateDebut().format(dateFormatter) + "<br>\n" +
                "                Au: " + facture.getReservation().getDateFin().format(dateFormatter) + "<br>\n" +
                "            </div>\n" +
                "\n" +
                "            <table>\n" +
                "                <tr>\n" +
                "                    <th>Description</th>\n" +
                "                    <th style='text-align: right;'>Montant</th>\n" +
                "                </tr>\n" +
                "                <tr>\n" +
                "                    <td>Séjour à l'hôtel</td>\n" +
                "                    <td style='text-align: right;'><strong>" + facture.getMontantTotal() + " MAD</strong></td>\n" +
                "                </tr>\n" +
                "            </table>\n" +
                "\n" +
                "            <div style='margin-top: 20px; text-align: right;'>\n" +
                "                <p>Montant Total:</p>\n" +
                "                <div class='total'>" + facture.getMontantTotal() + " MAD</div>\n" +
                "            </div>\n" +
                "\n" +
                "            <div class='info-box'>\n" +
                "                <strong>État de la facture :</strong><br>\n" +
                "                <span style='color: " + (facture.getEtat().toString().equals("PAYEE") ? "#27AE60" : "#E74C3C") + "; font-weight: bold;'>\n" +
                "                    " + facture.getEtat() + "\n" +
                "                </span>\n" +
                "            </div>\n" +
                "\n" +
                "            <p style='margin-top: 20px;'>\n" +
                "                Si vous avez des questions, contactez-nous à <strong>contact@hotelms.com</strong>\n" +
                "            </p>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2025 HotelMS - Tous droits réservés</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
