package com.hotel.paiement_service.dto;

import com.hotel.paiement_service.model.MethodePaiement;
import lombok.Data;

@Data
public class PaiementRequest {
    private Long idReservation;
    private Long idFacture;
    private Double montant;
    private MethodePaiement methode;
}