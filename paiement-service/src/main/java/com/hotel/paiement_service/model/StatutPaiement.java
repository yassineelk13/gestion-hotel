package com.hotel.paiement_service.model;

public enum StatutPaiement {
    EN_ATTENTE,    // Paiement initié
    EN_COURS,      // Paiement en cours de traitement
    VALIDE,        // Paiement réussi
    ECHEC,         // Paiement échoué
    ANNULE,        // Paiement annulé
    REMBOURSE      // Paiement remboursé
}