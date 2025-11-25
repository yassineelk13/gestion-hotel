package com.hotel.reservation_service.controller.dto;

import com.hotel.reservation_service.model.EtatFacture;
import com.hotel.reservation_service.model.Reservation;
import com.hotel.reservation_service.model.StatutReservation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private Long idReservation;
    private Long idClient;
    private Long idChambre;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private StatutReservation statut;
    private LocalDateTime dateCreation;

    // Facture info
    private Long idFacture;
    private BigDecimal montantTotal;
    private EtatFacture etatFacture;
    private LocalDateTime dateEmissionFacture;

    public static ReservationResponse fromEntity(Reservation reservation) {
        ReservationResponse response = new ReservationResponse();
        response.setIdReservation(reservation.getIdReservation());
        response.setIdClient(reservation.getIdClient());
        response.setIdChambre(reservation.getIdChambre());
        response.setDateDebut(reservation.getDateDebut());
        response.setDateFin(reservation.getDateFin());
        response.setStatut(reservation.getStatut());
        response.setDateCreation(reservation.getDateCreation());

        if (reservation.getFacture() != null) {
            response.setIdFacture(reservation.getFacture().getIdFacture());
            response.setMontantTotal(reservation.getFacture().getMontantTotal());
            response.setEtatFacture(reservation.getFacture().getEtat());
            response.setDateEmissionFacture(reservation.getFacture().getDateEmission());
        }

        return response;
    }
}