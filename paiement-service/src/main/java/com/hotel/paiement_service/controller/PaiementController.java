package com.hotel.paiement_service.controller;

import com.hotel.paiement_service.dto.PaiementRequest;
import com.hotel.paiement_service.dto.PaiementResponse;
import com.hotel.paiement_service.service.PaiementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
@CrossOrigin(origins = "*")
public class PaiementController {

    @Autowired
    private PaiementService paiementService;

    @Value("${stripe.publishable.key}")
    private String stripePublishableKey;

    /**
     * Test endpoint
     * GET /api/paiements/test
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("✅ Paiement Service is running with Stripe + PayPal!");
    }

    /**
     * Obtenir la clé publique Stripe
     * GET /api/paiements/stripe/config
     */
    @GetMapping("/stripe/config")
    public ResponseEntity<?> getStripeConfig() {
        return ResponseEntity.ok(Map.of(
                "publishableKey", stripePublishableKey
        ));
    }

    /**
     * Créer un PaymentIntent Stripe
     * POST /api/paiements/stripe/create-intent
     */
    @PostMapping("/stripe/create-intent")
    public ResponseEntity<?> createStripeIntent(@RequestBody PaiementRequest request) {
        try {
            System.out.println("📥 Demande création PaymentIntent Stripe: " + request);
            Map<String, Object> response = paiementService.creerIntentionPaiementStripe(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Confirmer un paiement Stripe
     * POST /api/paiements/stripe/confirm
     */
    @PostMapping("/stripe/confirm")
    public ResponseEntity<?> confirmStripePayment(@RequestBody Map<String, String> request) {
        try {
            String paymentIntentId = request.get("paymentIntentId");
            System.out.println("✅ Confirmation paiement Stripe: " + paymentIntentId);

            PaiementResponse response = paiementService.confirmerPaiementStripe(paymentIntentId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Paiement confirmé avec succès",
                    "paiement", response
            ));
        } catch (Exception e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Créer un paiement PayPal
     * POST /api/paiements/paypal/create
     */
    @PostMapping("/paypal/create")
    public ResponseEntity<?> createPayPalPayment(@RequestBody PaiementRequest request) {
        try {
            System.out.println("📥 Demande création paiement PayPal: " + request);
            Map<String, Object> response = paiementService.creerPaiementPayPal(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Confirmer un paiement PayPal (callback après approbation)
     * POST /api/paiements/paypal/execute
     */
    @PostMapping("/paypal/execute")
    public ResponseEntity<?> executePayPalPayment(@RequestBody Map<String, String> request) {
        try {
            String paymentId = request.get("paymentId");
            String payerId = request.get("payerId");

            System.out.println("✅ Exécution paiement PayPal: " + paymentId);

            PaiementResponse response = paiementService.confirmerPaiementPayPal(paymentId, payerId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Paiement PayPal confirmé avec succès",
                    "paiement", response
            ));
        } catch (Exception e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Enregistrer un paiement sur place (RÉCEPTIONNISTE)
     * POST /api/paiements/sur-place
     */
    @PostMapping("/sur-place")
    public ResponseEntity<?> enregistrerPaiementSurPlace(@RequestBody PaiementRequest request) {
        try {
            System.out.println("📥 Enregistrement paiement sur place: " + request);
            PaiementResponse response = paiementService.enregistrerPaiementSurPlace(request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Paiement enregistré avec succès",
                    "paiement", response
            ));
        } catch (Exception e) {
            System.err.println("❌ Erreur: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Récupérer tous les paiements d'une réservation
     * GET /api/paiements/reservation/{idReservation}
     */
    @GetMapping("/reservation/{idReservation}")
    public ResponseEntity<?> getPaiementsParReservation(@PathVariable Long idReservation) {
        try {
            List<PaiementResponse> paiements = paiementService.getPaiementsParReservation(idReservation);
            return ResponseEntity.ok(paiements);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }

    /**
     * Récupérer un paiement par ID
     * GET /api/paiements/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPaiementById(@PathVariable Long id) {
        try {
            PaiementResponse paiement = paiementService.getPaiementById(id);
            return ResponseEntity.ok(paiement);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}