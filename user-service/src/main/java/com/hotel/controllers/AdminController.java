package com.hotel.controllers;

import com.hotel.entities.Utilisateur;
import com.hotel.entities.Role;
import com.hotel.services.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminController {

    private final UtilisateurService utilisateurService;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UtilisateurService utilisateurService, PasswordEncoder passwordEncoder) {
        this.utilisateurService = utilisateurService;
        this.passwordEncoder = passwordEncoder;
    }

    // GET tous les utilisateurs
    @GetMapping("/users")
    public ResponseEntity<List<Utilisateur>> getAllUsers() {
        List<Utilisateur> users = utilisateurService.findAll();
        return ResponseEntity.ok(users);
    }

    // POST créer un utilisateur
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Utilisateur utilisateur) {
        try {
            // Vérifier si l'email existe déjà
            Optional<Utilisateur> existing = utilisateurService.findByEmail(utilisateur.getEmail());
            if (existing.isPresent()) {
                return ResponseEntity.badRequest().body("Email déjà utilisé");
            }

            // L'admin peut définir n'importe quel rôle
            // Pas de restriction ici - l'admin a tous les droits
            utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
            Utilisateur saved = utilisateurService.save(utilisateur);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur création utilisateur: " + e.getMessage());
        }
    }
    // PUT modifier un utilisateur
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Utilisateur utilisateur) {
        try {
            Optional<Utilisateur> existing = utilisateurService.findById(id);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Utilisateur userToUpdate = existing.get();

            // Mettre à jour les champs
            userToUpdate.setNom(utilisateur.getNom());
            userToUpdate.setPrenom(utilisateur.getPrenom());
            userToUpdate.setEmail(utilisateur.getEmail());
            userToUpdate.setRole(utilisateur.getRole());

            // Mettre à jour le mot de passe seulement si fourni
            if (utilisateur.getMotDePasse() != null && !utilisateur.getMotDePasse().trim().isEmpty()) {
                userToUpdate.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
            }

            Utilisateur updated = utilisateurService.save(userToUpdate);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur modification utilisateur: " + e.getMessage());
        }
    }
    // DELETE supprimer un utilisateur
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<Utilisateur> user = utilisateurService.findById(id);
            if (user.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Empêcher la suppression des ADMIN et RECEPTIONNISTE
            Role userRole = user.get().getRole();
            if (userRole == Role.ADMIN || userRole == Role.RECEPTIONNISTE) {
                return ResponseEntity.badRequest().body("Impossible de supprimer un administrateur ou réceptionniste");
            }

            utilisateurService.deleteById(id);
            return ResponseEntity.ok("Utilisateur supprimé");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur suppression: " + e.getMessage());
        }
    }
}