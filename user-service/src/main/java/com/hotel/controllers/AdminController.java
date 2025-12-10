package com.hotel.controllers;

import com.hotel.entities.Utilisateur;
import com.hotel.entities.Role;
import com.hotel.services.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
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
                Map<String, String> error = new HashMap<>();
                error.put("message", "❌ Cet email est déjà utilisé");
                return ResponseEntity.badRequest().body(error);
            }

            // Encoder le mot de passe
            utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));

            // Définir actif par défaut
            utilisateur.setActif(true);

            Utilisateur saved = utilisateurService.save(utilisateur);

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur création utilisateur: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // PUT modifier un utilisateur
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Utilisateur utilisateur) {
        try {
            Optional<Utilisateur> existing = utilisateurService.findById(id);
            if (existing.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "❌ Utilisateur introuvable");
                return ResponseEntity.status(404).body(error);
            }

            Utilisateur userToUpdate = existing.get();

            // Vérifier si l'email est déjà utilisé par un autre utilisateur
            if (!userToUpdate.getEmail().equals(utilisateur.getEmail())) {
                Optional<Utilisateur> emailExists = utilisateurService.findByEmail(utilisateur.getEmail());
                if (emailExists.isPresent()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "❌ Cet email est déjà utilisé");
                    return ResponseEntity.badRequest().body(error);
                }
            }

            // Mettre à jour les champs
            userToUpdate.setNom(utilisateur.getNom());
            userToUpdate.setPrenom(utilisateur.getPrenom());
            userToUpdate.setEmail(utilisateur.getEmail());
            userToUpdate.setTelephone(utilisateur.getTelephone());
            userToUpdate.setRole(utilisateur.getRole());

            // Mettre à jour le mot de passe seulement si fourni
            if (utilisateur.getMotDePasse() != null && !utilisateur.getMotDePasse().trim().isEmpty()) {
                userToUpdate.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
            }

            Utilisateur updated = utilisateurService.save(userToUpdate);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur modification utilisateur: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // PUT changer le statut (actif/inactif)
    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> changeUserStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request
    ) {
        try {
            Optional<Utilisateur> existing = utilisateurService.findById(id);
            if (existing.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "❌ Utilisateur introuvable");
                return ResponseEntity.status(404).body(error);
            }

            Utilisateur user = existing.get();
            user.setActif(request.isActif());

            Utilisateur updated = utilisateurService.save(user);

            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur changement statut: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // DELETE supprimer un utilisateur (désactivé - on préfère désactiver)
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<Utilisateur> user = utilisateurService.findById(id);
            if (user.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "❌ Utilisateur introuvable");
                return ResponseEntity.status(404).body(error);
            }

            // Empêcher la suppression des ADMIN et RECEPTIONNISTE
            Role userRole = user.get().getRole();
            if (userRole == Role.ADMIN || userRole == Role.RECEPTIONNISTE) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Impossible de supprimer un administrateur ou réceptionniste");
                return ResponseEntity.badRequest().body(error);
            }

            utilisateurService.deleteById(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Utilisateur supprimé avec succès");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur suppression: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET statistiques admin
    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats() {
        try {
            List<Utilisateur> allUsers = utilisateurService.findAll();

            long totalUsers = allUsers.size();
            long clients = allUsers.stream()
                    .filter(u -> u.getRole() == Role.CLIENT)
                    .count();
            long admins = allUsers.stream()
                    .filter(u -> u.getRole() == Role.ADMIN)
                    .count();
            long receptionnistes = allUsers.stream()
                    .filter(u -> u.getRole() == Role.RECEPTIONNISTE)
                    .count();
            long activeUsers = allUsers.stream()
                    .filter(Utilisateur::isActif)
                    .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("clients", clients);
            stats.put("admins", admins);
            stats.put("receptionnistes", receptionnistes);
            stats.put("activeUsers", activeUsers);
            stats.put("inactiveUsers", totalUsers - activeUsers);

            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur récupération stats: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Classe interne pour la requête de statut
    public static class StatusRequest {
        private boolean actif;

        public boolean isActif() {
            return actif;
        }

        public void setActif(boolean actif) {
            this.actif = actif;
        }
    }
}
