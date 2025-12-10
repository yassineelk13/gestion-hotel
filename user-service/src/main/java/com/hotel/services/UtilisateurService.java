package com.hotel.services;

import com.hotel.entities.Utilisateur;
import com.hotel.entities.Role;
import com.hotel.repositories.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    // Injection par constructeur
    public UtilisateurService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    /**
     * Inscription d'un nouvel utilisateur (CLIENT par défaut)
     */
    public Utilisateur register(Utilisateur utilisateur) throws Exception {
        // Vérifier si l'email existe déjà
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new Exception("❌ Email déjà utilisé");
        }

        // Définir un rôle par défaut si non spécifié
        if (utilisateur.getRole() == null) {
            utilisateur.setRole(Role.CLIENT);
        }

        // Définir comme actif par défaut
        utilisateur.setActif(true);

        // Définir la date de création
        if (utilisateur.getCreatedAt() == null) {
            utilisateur.setCreatedAt(LocalDateTime.now());
        }

        return utilisateurRepository.save(utilisateur);
    }

    /**
     * Trouver un utilisateur par email
     */
    public Optional<Utilisateur> findByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }

    /**
     * Trouver tous les utilisateurs
     */
    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    /**
     * Trouver un utilisateur par ID
     */
    public Optional<Utilisateur> findById(Long id) {
        return utilisateurRepository.findById(id);
    }

    /**
     * Supprimer un utilisateur par ID
     */
    public void deleteById(Long id) {
        utilisateurRepository.deleteById(id);
    }

    /**
     * Sauvegarder ou mettre à jour un utilisateur
     */
    public Utilisateur save(Utilisateur utilisateur) {
        return utilisateurRepository.save(utilisateur);
    }

    /**
     * Vérifier si un email existe déjà
     */
    public boolean existsByEmail(String email) {
        return utilisateurRepository.existsByEmail(email);
    }

    /**
     * Créer un utilisateur (Admin)
     */
    public Utilisateur createUser(Utilisateur utilisateur) throws Exception {
        // Vérifier si l'email existe déjà
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new Exception("❌ Cet email est déjà utilisé");
        }

        // Le mot de passe doit être encodé par le contrôleur avant d'appeler cette méthode

        // Définir comme actif par défaut
        utilisateur.setActif(true);

        // Définir la date de création
        if (utilisateur.getCreatedAt() == null) {
            utilisateur.setCreatedAt(LocalDateTime.now());
        }

        return utilisateurRepository.save(utilisateur);
    }

    /**
     * Mettre à jour un utilisateur (Admin)
     */
    public Utilisateur updateUser(Long id, Utilisateur utilisateurDTO) throws Exception {
        // Trouver l'utilisateur existant
        Utilisateur existingUser = utilisateurRepository.findById(id)
                .orElseThrow(() -> new Exception("❌ Utilisateur introuvable"));

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (!existingUser.getEmail().equals(utilisateurDTO.getEmail())) {
            if (utilisateurRepository.existsByEmail(utilisateurDTO.getEmail())) {
                throw new Exception("❌ Cet email est déjà utilisé");
            }
        }

        // Mettre à jour les champs
        existingUser.setNom(utilisateurDTO.getNom());
        existingUser.setPrenom(utilisateurDTO.getPrenom());
        existingUser.setEmail(utilisateurDTO.getEmail());
        existingUser.setTelephone(utilisateurDTO.getTelephone());
        existingUser.setRole(utilisateurDTO.getRole());

        // Le mot de passe est mis à jour dans le contrôleur si fourni

        return utilisateurRepository.save(existingUser);
    }

    /**
     * Activer ou désactiver un utilisateur
     */
    public Utilisateur toggleStatus(Long id, boolean actif) throws Exception {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new Exception("❌ Utilisateur introuvable"));

        user.setActif(actif);

        return utilisateurRepository.save(user);
    }

    /**
     * Compter le nombre total d'utilisateurs
     */
    public long count() {
        return utilisateurRepository.count();
    }

    /**
     * Trouver les utilisateurs par rôle
     */
    public List<Utilisateur> findByRole(Role role) {
        return utilisateurRepository.findByRole(role);
    }

    /**
     * Trouver les utilisateurs actifs
     */
    public List<Utilisateur> findByActif(boolean actif) {
        return utilisateurRepository.findByActif(actif);
    }
}
