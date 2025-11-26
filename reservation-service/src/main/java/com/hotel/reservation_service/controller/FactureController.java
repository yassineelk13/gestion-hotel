package com.hotel.reservation_service.controller;

import com.hotel.reservation_service.controller.dto.FactureResponse;
import com.hotel.reservation_service.model.Facture;
import com.hotel.reservation_service.repository.FactureRepository;
import com.hotel.reservation_service.service.EmailService;
import com.hotel.reservation_service.service.PdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
@Slf4j
public class FactureController {

    private final FactureRepository factureRepository;
    private final PdfService pdfService;
    private final EmailService emailService;
    private final RestTemplate restTemplate;

    @Value("${services.utilisateurs.url}")
    private String utilisateursServiceUrl;

    @GetMapping
    public ResponseEntity<List<FactureResponse>> getAllFactures() {
        log.info("Récupération de toutes les factures");
        List<Facture> factures = factureRepository.findAll();
        List<FactureResponse> responses = factures.stream()
                .map(FactureResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FactureResponse> getFactureById(@PathVariable Long id) {
        log.info("Récupération de la facture {}", id);
        return factureRepository.findById(id)
                .map(FactureResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reservation/{idReservation}")
    public ResponseEntity<FactureResponse> getFactureByReservation(@PathVariable Long idReservation) {
        log.info("Récupération de la facture pour la réservation {}", idReservation);
        return factureRepository.findByReservation_IdReservation(idReservation)
                .map(FactureResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/payer")
    public ResponseEntity<FactureResponse> payerFacture(@PathVariable Long id) {
        log.info("Paiement de la facture {}", id);

        return factureRepository.findById(id)
                .map(facture -> {
                    // Changer le statut en PAYEE
                    facture.setEtat(com.hotel.reservation_service.model.EtatFacture.PAYEE);
                    Facture saved = factureRepository.save(facture);

                    // Récupérer l'email du client
                    try {
                        Long idClient = saved.getReservation().getIdClient();
                        String userUrl = utilisateursServiceUrl + "/api/users/" + idClient;

                        log.info("📧 Récupération email du client {}", idClient);

                        // Appeler l'API utilisateurs pour récupérer l'email
                        Map<String, Object> userResponse = restTemplate.getForObject(userUrl, Map.class);

                        if (userResponse != null && userResponse.containsKey("email")) {
                            String emailClient = (String) userResponse.get("email");
                            log.info("✅ Email récupéré : {}", emailClient);

                            // Envoyer l'email avec facture
                            emailService.sendFactureEmail(saved, emailClient);
                        } else {
                            log.warn("⚠️ Email non trouvé pour le client {}", idClient);
                        }

                    } catch (Exception e) {
                        log.error("❌ Erreur lors de la récupération de l'email ou envoi", e);
                        // On continue même si l'email échoue
                    }

                    return ResponseEntity.ok(FactureResponse.fromEntity(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadFacturePdf(@PathVariable Long id) {
        log.info("📄 Téléchargement PDF facture {}", id);

        return factureRepository.findById(id)
                .map(facture -> {
                    try {
                        byte[] pdfBytes = pdfService.generateFacturePdf(facture);

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_PDF);
                        headers.setContentDispositionFormData("attachment", "facture-" + id + ".pdf");

                        log.info("✅ PDF généré et envoyé");
                        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

                    } catch (Exception e) {
                        log.error("❌ Erreur génération PDF", e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).<byte[]>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint de test pour envoyer un email manuellement
     */
    @PostMapping("/{id}/test-email")
    public ResponseEntity<String> testEmail(@PathVariable Long id, @RequestParam String email) {
        log.info("Test d'envoi email pour facture {} à {}", id, email);

        return factureRepository.findById(id)
                .map(facture -> {
                    try {
                        emailService.sendFactureEmail(facture, email);
                        return ResponseEntity.ok("✅ Email envoyé avec succès à " + email);
                    } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("❌ Erreur : " + e.getMessage());
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
