package com.hotel.paiement_service.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements")
@Data
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_paiement")
    private Long idPaiement;

    @Column(name = "id_facture", nullable = false)
    private Long idFacture;

    @Column(name = "id_reservation", nullable = false)
    private Long idReservation;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_paiement", nullable = false)
    private ModePaiement modePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPaiement statut = StatutPaiement.COMPLETE;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "effectue_par")
    private Long effectuePar; // NULL pour client, ID réceptionniste sinon

    @Column(name = "date_paiement")
    private LocalDateTime datePaiement = LocalDateTime.now();

    // Énumérations
    public enum ModePaiement {
        STRIPE, PAYPAL, CASH
    }

    public enum StatutPaiement {
        COMPLETE, ECHOUE
    }
}
