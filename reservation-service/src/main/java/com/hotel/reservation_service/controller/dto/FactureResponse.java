package com.hotel.reservation_service.controller.dto;

import com.hotel.reservation_service.model.EtatFacture;
import com.hotel.reservation_service.model.Facture;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FactureResponse {

    private Long idFacture;
    private LocalDateTime dateEmission;
    private BigDecimal montantTotal;
    private EtatFacture etat;
    private Long idReservation;

    public static FactureResponse fromEntity(Facture facture) {
        FactureResponse response = new FactureResponse();
        response.setIdFacture(facture.getIdFacture());
        response.setDateEmission(facture.getDateEmission());
        response.setMontantTotal(facture.getMontantTotal());
        response.setEtat(facture.getEtat());

        // Ajouter l'ID de la réservation si elle existe
        if (facture.getReservation() != null) {
            response.setIdReservation(facture.getReservation().getIdReservation());
        }

        return response;
    }
}
