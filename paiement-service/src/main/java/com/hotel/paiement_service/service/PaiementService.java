package com.hotel.paiement_service.service;

import com.hotel.paiement_service.dto.PaiementRequest;
import com.hotel.paiement_service.dto.PaiementResponse;
import com.hotel.paiement_service.model.MethodePaiement;
import com.hotel.paiement_service.model.Paiement;
import com.hotel.paiement_service.model.StatutPaiement;
import com.hotel.paiement_service.repository.PaiementRepository;
import com.paypal.api.payments.Payment;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class PaiementService {

    @Autowired
    private PaiementRepository paiementRepository;

    @Autowired
    private StripeService stripeService;

    @Autowired
    private PayPalService paypalService;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.reservation.url}")
    private String reservationServiceUrl;

    /**
     * Créer un PaymentIntent Stripe
     */
    public Map<String, Object> creerIntentionPaiementStripe(PaiementRequest request) {
        try {
            System.out.println("🔵 Création intention paiement Stripe");

            // Créer le paiement en base
            Paiement paiement = new Paiement(
                    request.getIdReservation(),
                    request.getIdFacture(),
                    request.getMontant(),
                    MethodePaiement.STRIPE_CARTE
            );
            paiement.setStatut(StatutPaiement.EN_COURS);
            paiement = paiementRepository.save(paiement);

            // Créer le PaymentIntent Stripe
            Map<String, String> stripeResponse = stripeService.createPaymentIntent(request.getMontant());

            // Mettre à jour le paiement avec l'ID Stripe
            paiement.setStripePaymentIntentId(stripeResponse.get("paymentIntentId"));
            paiement.setReferenceTransaction("STRIPE-" + paiement.getId());
            paiementRepository.save(paiement);

            return Map.of(
                    "success", true,
                    "clientSecret", stripeResponse.get("clientSecret"),
                    "paiementId", paiement.getId()
            );

        } catch (Exception e) {
            System.err.println("❌ Erreur création PaymentIntent Stripe: " + e.getMessage());
            return Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }

    /**
     * Confirmer un paiement Stripe
     */
    public PaiementResponse confirmerPaiementStripe(String paymentIntentId) {
        try {
            System.out.println("✅ Confirmation paiement Stripe: " + paymentIntentId);

            // Récupérer le PaymentIntent depuis Stripe
            PaymentIntent intent = stripeService.retrievePaymentIntent(paymentIntentId);

            // Trouver le paiement en base
            Paiement paiement = paiementRepository.findByStripePaymentIntentId(paymentIntentId)
                    .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));

            if ("succeeded".equals(intent.getStatus())) {
                paiement.setStatut(StatutPaiement.VALIDE);
                paiement.setDatePaiement(LocalDateTime.now());
                paiementRepository.save(paiement);

                // Notifier le service de réservation
                notifierReservationPaiementValide(paiement.getIdFacture());

                System.out.println("✅ Paiement Stripe confirmé avec succès");
            } else {
                paiement.setStatut(StatutPaiement.ECHEC);
                paiement.setMessageErreur("Paiement non abouti: " + intent.getStatus());
                paiementRepository.save(paiement);
            }

            return convertToResponse(paiement);

        } catch (Exception e) {
            System.err.println("❌ Erreur confirmation Stripe: " + e.getMessage());
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }

    /**
     * Créer un paiement PayPal
     */
    public Map<String, Object> creerPaiementPayPal(PaiementRequest request) {
        try {
            System.out.println("💙 Création paiement PayPal");

            // Créer le paiement en base
            Paiement paiement = new Paiement(
                    request.getIdReservation(),
                    request.getIdFacture(),
                    request.getMontant(),
                    MethodePaiement.PAYPAL
            );
            paiement.setStatut(StatutPaiement.EN_COURS);
            paiement = paiementRepository.save(paiement);

            // URLs de retour
            String cancelUrl = "http://localhost:3000/paiement/cancel";
            String successUrl = "http://localhost:3000/paiement/success?paiementId=" + paiement.getId();

            // Créer le paiement PayPal
            Payment payment = paypalService.createPayment(
                    request.getMontant(),
                    "USD", // PayPal Sandbox n'accepte pas MAD, utilise USD
                    "Paiement réservation hôtel #" + request.getIdReservation(),
                    cancelUrl,
                    successUrl
            );

            // Mettre à jour le paiement avec l'ID PayPal
            paiement.setPaypalOrderId(payment.getId());
            paiement.setReferenceTransaction("PAYPAL-" + paiement.getId());
            paiementRepository.save(paiement);

            // Trouver l'URL d'approbation
            String approvalUrl = payment.getLinks().stream()
                    .filter(link -> "approval_url".equals(link.getRel()))
                    .findFirst()
                    .map(com.paypal.api.payments.Links::getHref)
                    .orElse("");

            return Map.of(
                    "success", true,
                    "approvalUrl", approvalUrl,
                    "paymentId", payment.getId(),
                    "paiementId", paiement.getId()
            );

        } catch (Exception e) {
            System.err.println("❌ Erreur création PayPal: " + e.getMessage());
            return Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()
            );
        }
    }

    /**
     * Confirmer un paiement PayPal
     */
    public PaiementResponse confirmerPaiementPayPal(String paymentId, String payerId) {
        try {
            System.out.println("✅ Confirmation paiement PayPal: " + paymentId);

            // Exécuter le paiement PayPal
            Payment payment = paypalService.executePayment(paymentId, payerId);

            // Trouver le paiement en base
            Paiement paiement = paiementRepository.findByPaypalOrderId(paymentId)
                    .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));

            if ("approved".equals(payment.getState())) {
                paiement.setStatut(StatutPaiement.VALIDE);
                paiement.setDatePaiement(LocalDateTime.now());
                paiement.setPaypalPayerEmail(payment.getPayer().getPayerInfo().getEmail());
                paiementRepository.save(paiement);

                // Notifier le service de réservation
                notifierReservationPaiementValide(paiement.getIdFacture());

                System.out.println("✅ Paiement PayPal confirmé avec succès");
            } else {
                paiement.setStatut(StatutPaiement.ECHEC);
                paiement.setMessageErreur("Paiement non approuvé: " + payment.getState());
                paiementRepository.save(paiement);
            }

            return convertToResponse(paiement);

        } catch (Exception e) {
            System.err.println("❌ Erreur confirmation PayPal: " + e.getMessage());
            throw new RuntimeException("Erreur: " + e.getMessage());
        }
    }

    /**
     * Enregistrer un paiement sur place (réceptionniste)
     */
    public PaiementResponse enregistrerPaiementSurPlace(PaiementRequest request) {
        System.out.println("🏨 Enregistrement paiement sur place");

        Paiement paiement = new Paiement(
                request.getIdReservation(),
                request.getIdFacture(),
                request.getMontant(),
                request.getMethode()
        );

        paiement.setStatut(StatutPaiement.VALIDE);
        paiement.setDatePaiement(LocalDateTime.now());
        paiement.setReferenceTransaction("PLACE-" + System.currentTimeMillis());

        paiement = paiementRepository.save(paiement);
        System.out.println("✅ Paiement sur place enregistré");

        // Notifier le service de réservation
        notifierReservationPaiementValide(paiement.getIdFacture());

        return convertToResponse(paiement);
    }

    /**
     * Récupérer les paiements d'une réservation
     */
    public List<PaiementResponse> getPaiementsParReservation(Long idReservation) {
        return paiementRepository.findByIdReservation(idReservation)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un paiement par ID
     */
    public PaiementResponse getPaiementById(Long id) {
        Paiement paiement = paiementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        return convertToResponse(paiement);
    }

    /**
     * Notifier le service de réservation
     */
    private void notifierReservationPaiementValide(Long idFacture) {
        try {
            String url = reservationServiceUrl + "/factures/" + idFacture + "/payer";
            System.out.println("📞 Notification reservation-service: " + url);
            restTemplate.put(url, null);
            System.out.println("✅ Facture marquée comme payée");
        } catch (Exception e) {
            System.err.println("❌ Erreur notification: " + e.getMessage());
        }
    }

    /**
     * Convertir Paiement en PaiementResponse
     */
    private PaiementResponse convertToResponse(Paiement paiement) {
        return new PaiementResponse(
                paiement.getId(),
                paiement.getIdReservation(),
                paiement.getIdFacture(),
                paiement.getMontant(),
                paiement.getMethode(),
                paiement.getStatut(),
                paiement.getReferenceTransaction(),
                paiement.getDatePaiement(),
                paiement.getMessageErreur()
        );
    }
}