package com.hotel.paiement_service.controller;

import com.hotel.paiement_service.model.Paiement;
import com.hotel.paiement_service.service.PaiementService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
@RequiredArgsConstructor
@Slf4j
public class PaiementController {

    private final PaiementService paiementService;

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    /**
     * Initialiser Stripe avec la clé secrète au démarrage
     */
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        log.info("✅ Stripe initialisé avec succès");
    }

    // ==================== PAIEMENT CASH (RÉCEPTIONNISTE) ====================

    /**
     * 💵 Enregistrer un paiement en CASH (sur place)
     * POST /api/paiements/cash
     */
    @PostMapping("/cash")
    public ResponseEntity<?> payerCash(@RequestBody PaiementCashRequest request) {
        try {
            log.info("💵 Réception demande paiement CASH - Facture: {}", request.getIdFacture());

            Paiement paiement = paiementService.enregistrerPaiementCash(
                    request.getIdFacture(),
                    request.getIdReservation(),
                    request.getMontant(),
                    request.getIdReceptionniste()
            );

            log.info("✅ Paiement CASH enregistré avec succès - ID: {}", paiement.getIdPaiement());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Paiement cash enregistré avec succès",
                    "paiement", paiement
            ));

        } catch (Exception e) {
            log.error("❌ Erreur lors du paiement cash: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    // ==================== PAIEMENT STRIPE (CLIENT) ====================

    /**
     * 💳 ÉTAPE 1 : Créer un Payment Intent Stripe
     * POST /api/paiements/stripe/create-payment-intent
     */
    @PostMapping("/stripe/create-payment-intent")
    public ResponseEntity<?> createStripePaymentIntent(@RequestBody StripePaymentRequest request) {
        try {
            log.info("💳 Création Payment Intent Stripe - Facture: {}, Montant: {}",
                    request.getIdFacture(), request.getMontant());

            // Convertir le montant en centimes (Stripe utilise les centimes)
            long amountInCents = request.getMontant().multiply(new BigDecimal(100)).longValue();

            // Créer le Payment Intent
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("mad")  // Dirham marocain
                    .putMetadata("idFacture", String.valueOf(request.getIdFacture()))
                    .putMetadata("idReservation", String.valueOf(request.getIdReservation()))
                    .setDescription("Paiement Facture #" + request.getIdFacture())
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);

            log.info("✅ Payment Intent créé - ID: {}", intent.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("clientSecret", intent.getClientSecret());
            response.put("paymentIntentId", intent.getId());

            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            log.error("❌ Erreur Stripe: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Erreur Stripe: " + e.getMessage()
            ));
        } catch (Exception e) {
            log.error("❌ Erreur création Payment Intent: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * ✅ ÉTAPE 2 : Confirmer le paiement Stripe
     * POST /api/paiements/stripe/confirm
     */
    @PostMapping("/stripe/confirm")
    public ResponseEntity<?> confirmStripePayment(@RequestBody StripeConfirmRequest request) {
        try {
            log.info("✅ Confirmation paiement Stripe - Facture: {}, PaymentIntent: {}",
                    request.getIdFacture(), request.getPaymentIntentId());

            // Enregistrer le paiement dans la base de données
            Paiement paiement = paiementService.enregistrerPaiementStripe(
                    request.getIdFacture(),
                    request.getIdReservation(),
                    request.getMontant(),
                    request.getPaymentIntentId()
            );

            log.info("✅ Paiement Stripe confirmé et enregistré - ID: {}", paiement.getIdPaiement());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Paiement effectué avec succès",
                    "paiement", paiement
            ));

        } catch (Exception e) {
            log.error("❌ Erreur confirmation paiement: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    // ==================== ENDPOINTS UTILITAIRES ====================

    /**
     * 📋 Récupérer tous les paiements
     * GET /api/paiements
     */
    @GetMapping
    public ResponseEntity<?> getAllPaiements() {
        // À implémenter si besoin pour l'admin
        return ResponseEntity.ok(Map.of("message", "Endpoint à implémenter"));
    }

    /**
     * 🔍 Récupérer un paiement par facture
     * GET /api/paiements/facture/{idFacture}
     */
    @GetMapping("/facture/{idFacture}")
    public ResponseEntity<?> getPaiementByFacture(@PathVariable Long idFacture) {
        // À implémenter si besoin
        return ResponseEntity.ok(Map.of("message", "Endpoint à implémenter"));
    }

    // ==================== CLASSES DTO ====================

    /**
     * DTO pour paiement CASH
     */
    public static class PaiementCashRequest {
        private Long idFacture;
        private Long idReservation;
        private BigDecimal montant;
        private Long idReceptionniste;

        // Getters et Setters
        public Long getIdFacture() { return idFacture; }
        public void setIdFacture(Long idFacture) { this.idFacture = idFacture; }

        public Long getIdReservation() { return idReservation; }
        public void setIdReservation(Long idReservation) { this.idReservation = idReservation; }

        public BigDecimal getMontant() { return montant; }
        public void setMontant(BigDecimal montant) { this.montant = montant; }

        public Long getIdReceptionniste() { return idReceptionniste; }
        public void setIdReceptionniste(Long idReceptionniste) { this.idReceptionniste = idReceptionniste; }
    }

    /**
     * DTO pour créer Payment Intent Stripe
     */
    public static class StripePaymentRequest {
        private Long idFacture;
        private Long idReservation;
        private BigDecimal montant;

        // Getters et Setters
        public Long getIdFacture() { return idFacture; }
        public void setIdFacture(Long idFacture) { this.idFacture = idFacture; }

        public Long getIdReservation() { return idReservation; }
        public void setIdReservation(Long idReservation) { this.idReservation = idReservation; }

        public BigDecimal getMontant() { return montant; }
        public void setMontant(BigDecimal montant) { this.montant = montant; }
    }

    /**
     * DTO pour confirmer paiement Stripe
     */
    public static class StripeConfirmRequest {
        private Long idFacture;
        private Long idReservation;
        private BigDecimal montant;
        private String paymentIntentId;

        // Getters et Setters
        public Long getIdFacture() { return idFacture; }
        public void setIdFacture(Long idFacture) { this.idFacture = idFacture; }

        public Long getIdReservation() { return idReservation; }
        public void setIdReservation(Long idReservation) { this.idReservation = idReservation; }

        public BigDecimal getMontant() { return montant; }
        public void setMontant(BigDecimal montant) { this.montant = montant; }

        public String getPaymentIntentId() { return paymentIntentId; }
        public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }
    }
}
