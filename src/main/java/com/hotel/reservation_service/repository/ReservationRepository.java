package com.hotel.reservation_service.repository;

import com.hotel.reservation_service.model.Reservation;
import com.hotel.reservation_service.model.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByIdClient(Long idClient);
    List<Reservation> findByStatut(StatutReservation statut);
    List<Reservation> findByIdChambre(Long idChambre);
}