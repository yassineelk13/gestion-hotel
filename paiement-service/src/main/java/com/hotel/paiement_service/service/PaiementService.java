package com.hotel.paiement_service.service;

import com.hotel.paiement_service.model.Paiement;
import com.hotel.paiement_service.repository.PaiementRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class PaiementService {

    @Autowired
    private PaiementRepository paiementRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${services.reservation.url}")
    private String reservationServiceUrl;

    /**
     * 💵 PAIEMENT CASH - Pour réceptionniste
     */
    public Paiement enregistrerPaiementCash(Long idFacture, Long idReservation,
                                            BigDecimal montant, Long idReceptionniste) {
        log.info("💵 Enregistrement paiement CASH - Facture: {}, Montant: {}", idFacture, montant);

        // 1. Créer le paiement
        Paiement paiement = new Paiement();
        paiement.setIdFacture(idFacture);
        paiement.setIdReservation(idReservation);
        paiement.setMontant(montant);
        paiement.setModePaiement(Paiement.ModePaiement.CASH);
        paiement.setStatut(Paiement.StatutPaiement.COMPLETE);
        paiement.setEffectuePar(idReceptionniste);

        paiement = paiementRepository.save(paiement);
        log.info("✅ Paiement enregistré - ID: {}", paiement.getIdPaiement());

        // 2. Appeler reservation-service pour marquer la facture PAYEE
        marquerFacturePayee(idFacture);

        return paiement;
    }

    /**
     * 💳 PAIEMENT STRIPE - Pour client
     */
    public Paiement enregistrerPaiementStripe(Long idFacture, Long idReservation,
                                              BigDecimal montant, String paymentIntentId) {
        log.info("💳 Enregistrement paiement STRIPE - Facture: {}, PaymentIntent: {}",
                idFacture, paymentIntentId);

        Paiement paiement = new Paiement();
        paiement.setIdFacture(idFacture);
        paiement.setIdReservation(idReservation);
        paiement.setMontant(montant);
        paiement.setModePaiement(Paiement.ModePaiement.STRIPE);
        paiement.setStatut(Paiement.StatutPaiement.COMPLETE);
        paiement.setTransactionId(paymentIntentId);
        paiement.setEffectuePar(null); // Client en ligne

        paiement = paiementRepository.save(paiement);
        log.info("✅ Paiement Stripe enregistré - ID: {}", paiement.getIdPaiement());

        // Marquer facture payée
        marquerFacturePayee(idFacture);

        return paiement;
    }

    /**
     * 📞 Appeler reservation-service pour marquer la facture PAYEE
     */
    private void marquerFacturePayee(Long idFacture) {
        try {
            // ✅ Utilise l'endpoint EXISTANT dans ton FactureController
            String url = reservationServiceUrl + "/factures/" + idFacture + "/payer";

            log.info("📞 Appel à reservation-service: {}", url);

            restTemplate.put(url, null);

            log.info("✅ Facture {} marquée comme PAYEE", idFacture);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la mise à jour de la facture : {}", e.getMessage());
            // On ne bloque pas le paiement même si la mise à jour échoue
        }
    }
}
