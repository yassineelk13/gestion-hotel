package com.hotel.reservation_service.controller;

import com.hotel.reservation_service.controller.dto.ReservationRequest;
import com.hotel.reservation_service.controller.dto.ReservationResponse;
import com.hotel.reservation_service.model.Reservation;
import com.hotel.reservation_service.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Slf4j
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
            @Valid @RequestBody ReservationRequest request) {
        log.info("Requête reçue pour créer une réservation");
        Reservation reservation = reservationService.createReservation(request);
        return new ResponseEntity<>(ReservationResponse.fromEntity(reservation), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        log.info("Requête reçue pour récupérer la réservation {}", id);
        Reservation reservation = reservationService.getReservationById(id);
        return ResponseEntity.ok(ReservationResponse.fromEntity(reservation));
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getAllReservations(
            @RequestParam(required = false) Long idClient) {
        log.info("Requête reçue pour récupérer les réservations");

        List<Reservation> reservations;
        if (idClient != null) {
            reservations = reservationService.getReservationsByClient(idClient);
        } else {
            reservations = reservationService.getAllReservations();
        }

        List<ReservationResponse> responses = reservations.stream()
                .map(ReservationResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReservationResponse> updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody ReservationRequest request) {
        log.info("Requête reçue pour mettre à jour la réservation {}", id);
        Reservation reservation = reservationService.updateReservation(id, request);
        return ResponseEntity.ok(ReservationResponse.fromEntity(reservation));
    }

    @PostMapping("/{id}/annuler")
    public ResponseEntity<Void> cancelReservation(@PathVariable Long id) {
        log.info("Requête reçue pour annuler la réservation {}", id);
        reservationService.cancelReservation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/terminer")
    public ResponseEntity<Void> completeReservation(@PathVariable Long id) {
        log.info("Requête reçue pour terminer la réservation {}", id);
        reservationService.completeReservation(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id) {
        log.info("Requête reçue pour supprimer la réservation {}", id);
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }


}