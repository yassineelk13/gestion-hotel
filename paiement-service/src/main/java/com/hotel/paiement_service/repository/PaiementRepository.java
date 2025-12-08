package com.hotel.paiement_service.repository;

import com.hotel.paiement_service.model.Paiement;
import com.hotel.paiement_service.model.StatutPaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    // Trouver tous les paiements d'une réservation
    List<Paiement> findByIdReservation(Long idReservation);

    // Trouver tous les paiements d'une facture
    List<Paiement> findByIdFacture(Long idFacture);

    // Trouver un paiement par référence
    Optional<Paiement> findByReferenceTransaction(String reference);

    // Trouver par Stripe Payment Intent ID
    Optional<Paiement> findByStripePaymentIntentId(String stripePaymentIntentId);

    // Trouver par PayPal Order ID
    Optional<Paiement> findByPaypalOrderId(String paypalOrderId);

    // Trouver les paiements par statut
    List<Paiement> findByStatut(StatutPaiement statut);
}