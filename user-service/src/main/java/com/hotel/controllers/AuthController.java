package com.hotel.controllers;

import com.hotel.entities.Role;
import com.hotel.entities.Utilisateur;
import com.hotel.security.JwtUtil;
import com.hotel.services.UtilisateurService;
import com.hotel.services.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.Random;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UtilisateurService service;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthController(UtilisateurService service, PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil, EmailService emailService) {
        this.service = service;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Utilisateur utilisateur) {
        try {
            // FORCER le rôle CLIENT pour les inscriptions publiques
            utilisateur.setRole(Role.CLIENT);

            // Chiffrer le mot de passe
            utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
            Utilisateur saved = service.register(utilisateur);

            // Générer le token JWT
            String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole().name());

            Map<String, Object> response = new HashMap<>();
            response.put("user", mapUserToResponse(saved));
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/test")
    public String test() {
        return "API Spring Boot is working!";
    }

    // GET profil de l'utilisateur connecté
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<Utilisateur> user = service.findByEmail(email);

            if (user.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(mapUserToResponse(user.get()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }

    // PUT modifier le profil de l'utilisateur connecté
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String, String> updates, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<Utilisateur> existing = service.findByEmail(email);

            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Utilisateur userToUpdate = existing.get();

            // Mettre à jour les champs autorisés
            if (updates.containsKey("nom")) {
                userToUpdate.setNom(updates.get("nom"));
            }
            if (updates.containsKey("prenom")) {
                userToUpdate.setPrenom(updates.get("prenom"));
            }
            if (updates.containsKey("email")) {
                String newEmail = updates.get("email");
                // Vérifier si le nouvel email n'est pas déjà utilisé par un autre utilisateur
                Optional<Utilisateur> emailUser = service.findByEmail(newEmail);
                if (emailUser.isPresent() && !emailUser.get().getId().equals(userToUpdate.getId())) {
                    return ResponseEntity.badRequest().body("Email déjà utilisé");
                }
                userToUpdate.setEmail(newEmail);
            }
            if (updates.containsKey("motDePasse") && updates.get("motDePasse") != null
                    && !updates.get("motDePasse").trim().isEmpty()) {
                userToUpdate.setMotDePasse(passwordEncoder.encode(updates.get("motDePasse")));
            }

            Utilisateur updated = service.save(userToUpdate);
            return ResponseEntity.ok(mapUserToResponse(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur modification profil: " + e.getMessage());
        }
    }

    // GET tous les clients (pour réceptionniste)
    @GetMapping("/clients")
    @PreAuthorize("hasAuthority('RECEPTIONNISTE')")
    public ResponseEntity<?> getAllClients() {
        try {
            List<Utilisateur> allUsers = service.findAll();
            List<Map<String, Object>> clients = allUsers.stream()
                    .filter(user -> user.getRole() == Role.CLIENT)
                    .map(this::mapUserToResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(clients);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }

    // GET un client spécifique (pour réceptionniste)
    @GetMapping("/clients/{id}")
    @PreAuthorize("hasAuthority('RECEPTIONNISTE')")
    public ResponseEntity<?> getClientById(@PathVariable Long id) {
        try {
            Optional<Utilisateur> client = service.findById(id);
            if (client.isEmpty() || client.get().getRole() != Role.CLIENT) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(mapUserToResponse(client.get()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Utilisateur loginReq) {
        Optional<Utilisateur> u = service.findByEmail(loginReq.getEmail());

        if (u.isPresent()) {
            Utilisateur user = u.get();

            if (passwordEncoder.matches(loginReq.getMotDePasse(), user.getMotDePasse())) {
                // Générer le token JWT
                String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

                Map<String, Object> response = new HashMap<>();
                response.put("user", mapUserToResponse(user));
                response.put("token", token);

                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).body("Email ou mot de passe incorrect");
    }

    // NOUVELLES MÉTHODES POUR RÉINITIALISATION MOT DE PASSE

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            System.out.println("Demande réinitialisation pour: " + email);

            Optional<Utilisateur> userOpt = service.findByEmail(email);
            if (userOpt.isEmpty()) {
                // Pour la sécurité, on ne révèle pas si l'email existe ou non
                return ResponseEntity.ok().body(Map.of(
                        "message", "Si l'email existe, un code de réinitialisation a été envoyé"
                ));
            }

            Utilisateur user = userOpt.get();

            // Générer un code de 6 chiffres
            String resetToken = generateResetToken();

            // Envoyer l'email
            emailService.sendPasswordResetEmail(email, resetToken, user.getNom(), user.getPrenom());

            // Stocker temporairement le token
            user.setResetToken(resetToken);
            user.setTokenExpiry(LocalDateTime.now().plusHours(1)); // ✅ LocalDateTime
            service.save(user);

            return ResponseEntity.ok().body(Map.of(
                    "message", "Si l'email existe, un code de réinitialisation a été envoyé"
            ));

        } catch (Exception e) {
            System.err.println("Erreur forgot-password: " + e.getMessage());
            return ResponseEntity.badRequest().body("Erreur lors du traitement de la demande");
        }
    }


    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            Optional<Utilisateur> userOpt = service.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Utilisateur non trouvé");
            }

            Utilisateur user = userOpt.get();

            // Vérifier le token et son expiration
            if (user.getResetToken() == null || !user.getResetToken().equals(token)) {
                return ResponseEntity.badRequest().body("Code de réinitialisation invalide");
            }

            if (user.getTokenExpiry() == null || user.getTokenExpiry().isBefore(LocalDateTime.now())) { // ✅ LocalDateTime
                return ResponseEntity.badRequest().body("Le code a expiré");
            }

            // Mettre à jour le mot de passe
            user.setMotDePasse(passwordEncoder.encode(newPassword));
            user.setResetToken(null);
            user.setTokenExpiry(null);
            service.save(user);

            return ResponseEntity.ok().body(Map.of(
                    "message", "Mot de passe réinitialisé avec succès"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la réinitialisation");
        }
    }


    @PostMapping("/send-password")
    public ResponseEntity<?> sendPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            Optional<Utilisateur> userOpt = service.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Email non trouvé");
            }

            Utilisateur user = userOpt.get();

            // Générer un nouveau mot de passe temporaire
            String tempPassword = generateTempPassword();

            // Mettre à jour le mot de passe dans la base
            user.setMotDePasse(passwordEncoder.encode(tempPassword));
            service.save(user);

            // Envoyer le mot de passe par email
            emailService.sendPasswordEmail(email, tempPassword, user.getNom(), user.getPrenom());

            return ResponseEntity.ok().body(Map.of(
                    "message", "Mot de passe envoyé par email"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de l'envoi du mot de passe");
        }
    }

    // MÉTHODES UTILITAIRES

    private Map<String, Object> mapUserToResponse(Utilisateur user) {
        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("id", user.getId());
        userResponse.put("nom", user.getNom());
        userResponse.put("prenom", user.getPrenom());
        userResponse.put("email", user.getEmail());
        userResponse.put("role", user.getRole());
        return userResponse;
    }

    private String generateResetToken() {
        Random random = new Random();
        int token = 100000 + random.nextInt(900000);
        return String.valueOf(token);
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
    // PUT modifier le mot de passe avec vérification de l'ancien
    // PUT modifier le mot de passe avec vérification de l'ancien
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> passwordData, Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<Utilisateur> existing = service.findByEmail(email);

            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Utilisateur user = existing.get();

            // Vérifier l'ancien mot de passe
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");

            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getMotDePasse())) {
                return ResponseEntity.badRequest().body("Mot de passe actuel incorrect");
            }

            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Le nouveau mot de passe est requis");
            }

            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body("Le nouveau mot de passe doit contenir au moins 6 caractères");
            }

            // Mettre à jour le mot de passe
            user.setMotDePasse(passwordEncoder.encode(newPassword));
            service.save(user);

            return ResponseEntity.ok().body("Mot de passe modifié avec succès");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur modification mot de passe: " + e.getMessage());
        }
    }
    @PostMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String token = request.get("token");

            System.out.println("🔍 Validation token pour: " + email);
            System.out.println("🔍 Token reçu: " + token);

            Optional<Utilisateur> userOpt = service.findByEmail(email);
            if (userOpt.isEmpty()) {
                System.err.println("❌ Utilisateur non trouvé");
                return ResponseEntity.status(403).body(Map.of("message", "Utilisateur non trouvé"));
            }

            Utilisateur user = userOpt.get();

            System.out.println("🔍 Token en DB: " + user.getResetToken());
            System.out.println("🔍 Expiration: " + user.getTokenExpiry());

            // Vérifier le token
            if (user.getResetToken() == null || !user.getResetToken().equals(token)) {
                System.err.println("❌ Token invalide");
                return ResponseEntity.status(403).body(Map.of("message", "Code de réinitialisation invalide"));
            }

            // Vérifier l'expiration
            if (user.getTokenExpiry() == null || user.getTokenExpiry().isBefore(LocalDateTime.now())) {
                System.err.println("❌ Token expiré");
                return ResponseEntity.status(403).body(Map.of("message", "Le code a expiré"));
            }

            System.out.println("✅ Token valide !");
            return ResponseEntity.ok(Map.of(
                    "message", "Token valide",
                    "email", email
            ));

        } catch (Exception e) {
            System.err.println("❌ Erreur validation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(403).body(Map.of("message", "Erreur lors de la validation"));
        }
    }


}
