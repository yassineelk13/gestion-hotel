package com.hotel.paiement_service.repository;

import com.hotel.paiement_service.model.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    // Trouver un paiement par facture
    Optional<Paiement> findByIdFacture(Long idFacture);

    // Trouver tous les paiements d'une réservation
    List<Paiement> findByIdReservation(Long idReservation);

    // Trouver par mode de paiement
    List<Paiement> findByModePaiement(Paiement.ModePaiement modePaiement);
}
