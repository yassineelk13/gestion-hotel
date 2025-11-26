package com.hotel.controllers;

import com.hotel.entities.Utilisateur;
import com.hotel.services.UtilisateurService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UtilisateurService utilisateurService;

    public UserController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    /**
     * Endpoint public pour vérifier si un utilisateur existe
     * Utilisé par le service de réservations
     */
    @GetMapping("/exists/{id}")
    public ResponseEntity<Boolean> userExists(@PathVariable Long id) {
        boolean exists = utilisateurService.findById(id).isPresent();
        return ResponseEntity.ok(exists);
    }

    /**
     * Endpoint public pour récupérer les infos d'un utilisateur
     * Sans données sensibles
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<Utilisateur> user = utilisateurService.findById(id);

        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Utilisateur utilisateur = user.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", utilisateur.getId());
        response.put("nom", utilisateur.getNom());
        response.put("prenom", utilisateur.getPrenom());
        response.put("email", utilisateur.getEmail());
        response.put("role", utilisateur.getRole().name());

        return ResponseEntity.ok(response);
    }
}
