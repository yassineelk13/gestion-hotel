package com.hotel.reservation_service.controller;

import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/mock/api/chambres")
public class MockChambreController {

    @GetMapping("/{id}")
    public MockChambre getChambre(@PathVariable Long id) {
        System.out.println("🟢 Mock Chambre appelé pour ID: " + id);

        MockChambre chambre = new MockChambre();
        chambre.setIdChambre(id);
        chambre.setNumero(String.valueOf(100 + id));
        chambre.setStatut("libre");
        chambre.setPrixParNuit(BigDecimal.valueOf(150.00));
        chambre.setType("double");
        chambre.setCapacitePersonnes(2);
        chambre.setNbLits(1);
        chambre.setSuperficie(25.5);
        chambre.setEtage(1);
        chambre.setVue("mer");
        chambre.setDescription("Chambre test mock");
        chambre.setPhotoUrl("http://example.com/photo.jpg");
        return chambre;
    }

    @PutMapping("/{id}/statut")
    public void updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        System.out.println("🟡 Mock: Mise à jour statut chambre " + id + " -> " + body.get("statut"));
    }

    public static class MockChambre {
        private Long idChambre;
        private Integer capacitePersonnes;
        private String description;
        private Integer etage;
        private Integer nbLits;
        private String numero;
        private String photoUrl;
        private BigDecimal prixParNuit;
        private String statut;
        private Double superficie;
        private String type;
        private String vue;

        // Getters et Setters
        public Long getIdChambre() { return idChambre; }
        public void setIdChambre(Long idChambre) { this.idChambre = idChambre; }
        public Integer getCapacitePersonnes() { return capacitePersonnes; }
        public void setCapacitePersonnes(Integer capacitePersonnes) { this.capacitePersonnes = capacitePersonnes; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Integer getEtage() { return etage; }
        public void setEtage(Integer etage) { this.etage = etage; }
        public Integer getNbLits() { return nbLits; }
        public void setNbLits(Integer nbLits) { this.nbLits = nbLits; }
        public String getNumero() { return numero; }
        public void setNumero(String numero) { this.numero = numero; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
        public BigDecimal getPrixParNuit() { return prixParNuit; }
        public void setPrixParNuit(BigDecimal prixParNuit) { this.prixParNuit = prixParNuit; }
        public String getStatut() { return statut; }
        public void setStatut(String statut) { this.statut = statut; }
        public Double getSuperficie() { return superficie; }
        public void setSuperficie(Double superficie) { this.superficie = superficie; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getVue() { return vue; }
        public void setVue(String vue) { this.vue = vue; }
    }
}
