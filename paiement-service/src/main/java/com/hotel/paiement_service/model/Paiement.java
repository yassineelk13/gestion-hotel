package com.hotel.paiement_service.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements")
@Data
@NoArgsConstructor
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_reservation", nullable = false)
    private Long idReservation;

    @Column(name = "id_facture")
    private Long idFacture;

    @Column(nullable = false)
    private Double montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MethodePaiement methode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPaiement statut;

    @Column(name = "date_paiement")
    private LocalDateTime datePaiement;

    @Column(name = "reference_transaction")
    private String referenceTransaction;

    // Pour Stripe
    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    // Pour PayPal
    @Column(name = "paypal_order_id")
    private String paypalOrderId;

    @Column(name = "paypal_payer_email")
    private String paypalPayerEmail;

    @Column(name = "message_erreur", length = 1000)
    private String messageErreur;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
        if (datePaiement == null) {
            datePaiement = LocalDateTime.now();
        }
        if (statut == null) {
            statut = StatutPaiement.EN_ATTENTE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }

    public Paiement(Long idReservation, Long idFacture, Double montant, MethodePaiement methode) {
        this.idReservation = idReservation;
        this.idFacture = idFacture;
        this.montant = montant;
        this.methode = methode;
        this.statut = StatutPaiement.EN_ATTENTE;
        this.datePaiement = LocalDateTime.now();
    }
}