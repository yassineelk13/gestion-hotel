package com.hotel.reservation_service.service;

import com.hotel.reservation_service.controller.dto.ReservationRequest;
import com.hotel.reservation_service.exception.NotFoundException;
import com.hotel.reservation_service.model.*;
import com.hotel.reservation_service.repository.FactureRepository;
import com.hotel.reservation_service.repository.ReservationRepository;
import com.hotel.reservation_service.service.dto.ChambreResponse;
import com.hotel.reservation_service.service.dto.UtilisateurResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final FactureRepository factureRepository;
    private final RestTemplate restTemplate;

    @Value("${services.utilisateurs.url:http://localhost:8081}")
    private String utilisateursServiceUrl;

    @Value("${services.chambres.url:http://localhost:8083}")
    private String chambresServiceUrl;

    @Value("${services.chambres.jwt-token:}")
    private String chambresJwtToken;

    public Reservation createReservation(ReservationRequest request) {
        log.info("Création d'une réservation pour le client {} et chambre {}",
                request.getIdClient(), request.getIdChambre());

        // 1. Vérifier que l'utilisateur existe
        // 1. Vérifier que l'utilisateur existe
        try {
            String userExistsUrl = utilisateursServiceUrl + "/api/users/exists/" + request.getIdClient();
            log.info("🔍 Vérification utilisateur : {}", userExistsUrl);

            Boolean userExists = restTemplate.getForObject(userExistsUrl, Boolean.class);

            if (userExists == null || !userExists) {
                throw new NotFoundException("Client avec l'ID " + request.getIdClient() + " introuvable");
            }

            log.info("✅ Utilisateur {} existe", request.getIdClient());
        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification de l'utilisateur : {}", e.getMessage());
            throw new NotFoundException("Client avec l'ID " + request.getIdClient() + " introuvable");
        }


        // 2. Vérifier que la chambre existe et est disponible (commenté pour l'instant)
        ChambreResponse.ChambreData chambre;
        try {
            String chambreUrl = chambresServiceUrl + "/api/chambres/" + request.getIdChambre();
            log.info("🔍 Appel API Chambre : {}", chambreUrl);

            ChambreResponse response = restTemplate.getForObject(chambreUrl, ChambreResponse.class);

            // Vérifier que la réponse est valide
            if (response == null || !response.isSuccess() || response.getData() == null) {
                throw new NotFoundException("Chambre avec l'ID " + request.getIdChambre() + " introuvable");
            }

            // Extraire les données
            chambre = response.getData();
            log.info("✅ Chambre trouvée : {} - Statut : {}", chambre.getNumero(), chambre.getStatut());

            // Vérifier le statut
            if (!"libre".equalsIgnoreCase(chambre.getStatut())) {
                throw new IllegalStateException("La chambre " + chambre.getNumero() + " n'est pas disponible");
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification de la chambre : {}", e.getMessage());
            throw new NotFoundException("Chambre avec l'ID " + request.getIdChambre() + " introuvable ou indisponible");
        }

        // Calculer le montant total
        long nombreNuits = ChronoUnit.DAYS.between(request.getDateDebut(), request.getDateFin());

        // Utiliser le prix de la chambre (convertir Double en BigDecimal)
        BigDecimal prixParNuit = chambre.getPrixParNuit() != null ?
                BigDecimal.valueOf(chambre.getPrixParNuit()) : BigDecimal.valueOf(100.00);
//        BigDecimal prixParNuit = BigDecimal.valueOf(100.00);

        BigDecimal montantTotal = prixParNuit.multiply(BigDecimal.valueOf(nombreNuits));

        log.info("💰 Calcul : {} nuits × {} DH = {} DH", nombreNuits, prixParNuit, montantTotal);

        // Créer la réservation
        Reservation reservation = new Reservation();
        reservation.setIdClient(request.getIdClient());
        reservation.setIdChambre(request.getIdChambre());
        reservation.setDateDebut(request.getDateDebut());
        reservation.setDateFin(request.getDateFin());
        reservation.setStatut(StatutReservation.CONFIRMEE);

        // Créer la facture
        Facture facture = new Facture();
        facture.setMontantTotal(montantTotal);
        facture.setEtat(EtatFacture.EMISE);
        facture.setReservation(reservation);

        reservation.setFacture(facture);

        Reservation saved = reservationRepository.save(reservation);
        log.info("✅ Réservation créée avec succès - ID: {}", saved.getIdReservation());

        // 3. Mettre à jour le statut de la chambre à "occupee" avec JWT
        updateChambreStatut(request.getIdChambre(), "occupee");

        return saved;
    }

    private void updateChambreStatut(Long idChambre, String statut) {
        try {
            String updateChambreUrl = chambresServiceUrl + "/api/chambres/" + idChambre + "/statut";

            Map<String, String> statutUpdate = new HashMap<>();
            statutUpdate.put("statut", statut);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Ajouter le token JWT si disponible
            if (chambresJwtToken != null && !chambresJwtToken.isEmpty()) {
                headers.set("Authorization", "Bearer " + chambresJwtToken);
                log.info("🔑 Utilisation du token JWT pour mise à jour statut");
            } else {
                log.warn("⚠️ Aucun token JWT configuré - la mise à jour peut échouer");
            }

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(statutUpdate, headers);

            restTemplate.exchange(updateChambreUrl, HttpMethod.PUT, entity, String.class);

            log.info("✅ Statut de la chambre {} mis à jour à '{}'", idChambre, statut);
        } catch (Exception e) {
            log.error("❌ Impossible de mettre à jour le statut de la chambre : {}", e.getMessage());
        }
    }

    public Reservation getReservationById(Long id) {
        log.info("Récupération de la réservation {}", id);
        return reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Réservation introuvable avec l'ID: " + id));
    }

    public List<Reservation> getAllReservations() {
        log.info("Récupération de toutes les réservations");
        return reservationRepository.findAll();
    }

    public List<Reservation> getReservationsByClient(Long idClient) {
        log.info("Récupération des réservations pour le client {}", idClient);
        return reservationRepository.findByIdClient(idClient);
    }

    public Reservation updateReservation(Long id, ReservationRequest request) {
        log.info("Mise à jour de la réservation {}", id);

        Reservation existing = getReservationById(id);

        existing.setIdClient(request.getIdClient());
        existing.setIdChambre(request.getIdChambre());
        existing.setDateDebut(request.getDateDebut());
        existing.setDateFin(request.getDateFin());

        // Recalculer le montant de la facture
        if (existing.getFacture() != null) {
            long nombreNuits = ChronoUnit.DAYS.between(request.getDateDebut(), request.getDateFin());
            BigDecimal prixParNuit = request.getPrixParNuit() != null ?
                    request.getPrixParNuit() : BigDecimal.valueOf(100.00);
            BigDecimal montantTotal = prixParNuit.multiply(BigDecimal.valueOf(nombreNuits));
            existing.getFacture().setMontantTotal(montantTotal);
        }

        return reservationRepository.save(existing);
    }

    public void cancelReservation(Long id) {
        log.info("Annulation de la réservation {}", id);

        Reservation reservation = getReservationById(id);
        Long idChambre = reservation.getIdChambre();

        reservation.setStatut(StatutReservation.ANNULEE);
        reservationRepository.save(reservation);

        // Remettre la chambre à "libre" avec JWT
        updateChambreStatut(idChambre, "libre");

        log.info("Réservation {} annulée avec succès", id);
    }

    public void completeReservation(Long id) {
        log.info("Finalisation de la réservation {}", id);

        Reservation reservation = getReservationById(id);
        Long idChambre = reservation.getIdChambre();

        reservation.setStatut(StatutReservation.TERMINEE);
        reservationRepository.save(reservation);

        // Remettre la chambre à "libre" après checkout avec JWT
        updateChambreStatut(idChambre, "libre");

        log.info("Réservation {} terminée avec succès", id);
    }

    public void deleteReservation(Long id) {
        log.info("Suppression de la réservation {}", id);

        if (!reservationRepository.existsById(id)) {
            throw new NotFoundException("Réservation introuvable avec l'ID: " + id);
        }

        reservationRepository.deleteById(id);
        log.info("Réservation {} supprimée avec succès", id);
    }
}
