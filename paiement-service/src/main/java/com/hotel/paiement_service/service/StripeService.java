package com.hotel.paiement_service.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Service
public class StripeService {

    @Value("${stripe.api.key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
        System.out.println("✅ Stripe initialisé avec succès");
    }

    /**
     * Créer un PaymentIntent Stripe
     */
    public Map<String, String> createPaymentIntent(Double montant) throws StripeException {
        System.out.println("💳 Création PaymentIntent Stripe pour montant: " + montant + " DH");

        // Stripe utilise les centimes (1500 DH = 150000 centimes)
        Long montantCentimes = (long) (montant * 100);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(montantCentimes)
                .setCurrency("mad") // Dirham marocain
                .addPaymentMethodType("card")
                .setDescription("Paiement réservation hôtel")
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());
        response.put("paymentIntentId", intent.getId());

        System.out.println("✅ PaymentIntent créé: " + intent.getId());
        return response;
    }

    /**
     * Vérifier le statut d'un paiement Stripe
     */
    public PaymentIntent retrievePaymentIntent(String paymentIntentId) throws StripeException {
        System.out.println("🔍 Récupération PaymentIntent: " + paymentIntentId);
        return PaymentIntent.retrieve(paymentIntentId);
    }

    /**
     * Annuler un paiement Stripe
     */
    public PaymentIntent cancelPaymentIntent(String paymentIntentId) throws StripeException {
        System.out.println("❌ Annulation PaymentIntent: " + paymentIntentId);
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        return intent.cancel();
    }
}