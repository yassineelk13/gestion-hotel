package com.hotel.reservation_service.controller.dto;

import com.hotel.reservation_service.model.Reservation;
import com.hotel.reservation_service.model.StatutReservation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    private StatutReservation statut;
    private FactureResponse facture;  // ← AJOUTER CE CHAMP

    public static ReservationResponse fromEntity(Reservation reservation) {
        ReservationResponse response = new ReservationResponse();
        response.setIdReservation(reservation.getIdReservation());
        response.setIdClient(reservation.getIdClient());
        response.setIdChambre(reservation.getIdChambre());
        response.setDateDebut(reservation.getDateDebut());
        response.setDateFin(reservation.getDateFin());
        response.setDateCreation(reservation.getDateCreation());
        response.setDateModification(reservation.getDateModification());
        response.setStatut(reservation.getStatut());

        // Inclure la facture si elle existe
        if (reservation.getFacture() != null) {
            response.setFacture(FactureResponse.fromEntity(reservation.getFacture()));
        }

        return response;
    }
}
