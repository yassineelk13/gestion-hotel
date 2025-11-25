package com.hotel.reservation_service.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/mock/api/utilisateurs")
public class MockUtilisateurController {

    @GetMapping("/{id}")
    public MockUtilisateur getUtilisateur(@PathVariable Long id) {
        System.out.println("🔵 Mock Utilisateur appelé pour ID: " + id);

        MockUtilisateur user = new MockUtilisateur();
        user.setId(id);
        user.setNom("TestNom");
        user.setPrenom("TestPrenom");
        user.setEmail("test" + id + "@hotel.com");
        user.setRole("CLIENT");
        return user;
    }

    public static class MockUtilisateur {
        private Long id;
        private String nom;
        private String prenom;
        private String email;
        private String role;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public String getPrenom() { return prenom; }
        public void setPrenom(String prenom) { this.prenom = prenom; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}
