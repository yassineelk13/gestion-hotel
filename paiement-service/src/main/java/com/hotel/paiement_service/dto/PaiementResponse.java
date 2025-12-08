package com.hotel.paiement_service.dto;

import com.hotel.paiement_service.model.MethodePaiement;
import com.hotel.paiement_service.model.StatutPaiement;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PaiementResponse {
    private Long id;
    private Long idReservation;
    private Long idFacture;
    private Double montant;
    private MethodePaiement methode;
    private StatutPaiement statut;
    private String referenceTransaction;
    private LocalDateTime datePaiement;
    private String messageErreur;
}