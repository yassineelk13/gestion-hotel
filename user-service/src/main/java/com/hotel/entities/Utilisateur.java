package com.hotel.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "utilisateur")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String prenom;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    private Role role;

    // NOUVEAUX CHAMPS POUR RÉINITIALISATION
    private String resetToken;
    private Long tokenExpiry;

    public Utilisateur() {}

    public Utilisateur(String nom, String prenom, String email, String motDePasse, Role role) {
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.motDePasse = motDePasse;
        this.role = role;
    }

    // GETTERS & SETTERS
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotDePasse() { return motDePasse; }
    public void setMotDePasse(String motDePasse) { this.motDePasse = motDePasse; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    // NOUVEAUX GETTERS & SETTERS
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public Long getTokenExpiry() { return tokenExpiry; }
    public void setTokenExpiry(Long tokenExpiry) { this.tokenExpiry = tokenExpiry; }

    @Override
    public String toString() {
        return "Utilisateur{" + "id=" + id + ", email='" + email + '\'' + ", role=" + role + '}';
    }
}