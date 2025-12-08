package com.hotel.paiement_service.model;

public enum MethodePaiement {
    STRIPE_CARTE,        // Carte via Stripe
    PAYPAL,              // PayPal
    ESPECES,             // Cash à l'hôtel
    CARTE_SUR_PLACE      // Carte à l'hôtel
}