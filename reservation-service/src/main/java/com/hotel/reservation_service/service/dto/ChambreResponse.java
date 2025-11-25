package com.hotel.reservation_service.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ChambreResponse {
    private boolean success;

    private ChambreData data;

    private String message;

    @Data
    public static class ChambreData {
        @JsonProperty("id_chambre")
        private Long idChambre;

        @JsonProperty("capacite_personne")
        private Integer capacitePersonnes;

        private String description;

        private Integer etage;

        @JsonProperty("nb_lits")
        private Integer nbLits;

        private String numero;

        @JsonProperty("photo_url")
        private String photoUrl;

        @JsonProperty("prix_par_nuit")
        private Double prixParNuit;

        private String statut;

        private Double superficie;

        private String type;

        private String vue;
    }
}
