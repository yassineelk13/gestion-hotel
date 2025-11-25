package com.hotel.reservation_service.repository;

import com.hotel.reservation_service.model.EtatFacture;
import com.hotel.reservation_service.model.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {
    Optional<Facture> findByReservation_IdReservation(Long idReservation);
    List<Facture> findByEtat(EtatFacture etat);
}