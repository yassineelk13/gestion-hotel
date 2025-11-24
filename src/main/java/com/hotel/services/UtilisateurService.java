package com.hotel.services;

import com.hotel.entities.Utilisateur;
import com.hotel.entities.Role;
import com.hotel.repositories.UtilisateurRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;

    // Injection par constructeur
    public UtilisateurService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    public Utilisateur register(Utilisateur utilisateur) throws Exception {
        // Vérifier si l'email existe déjà
        if (utilisateurRepository.findByEmail(utilisateur.getEmail()).isPresent()) {
            throw new Exception("Email déjà utilisé");
        }

        // Définir un rôle par défaut si non spécifié
        if (utilisateur.getRole() == null) {
            utilisateur.setRole(Role.CLIENT);
        }

        return utilisateurRepository.save(utilisateur);
    }

    public Optional<Utilisateur> findByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }

    // Nouvelles méthodes pour l'admin
    public List<Utilisateur> findAll() {
        return utilisateurRepository.findAll();
    }

    public Optional<Utilisateur> findById(Long id) {
        return utilisateurRepository.findById(id);
    }

    public void deleteById(Long id) {
        utilisateurRepository.deleteById(id);
    }

    public Utilisateur save(Utilisateur utilisateur) {
        return utilisateurRepository.save(utilisateur);
    }
    public Optional<Utilisateur> findByResetToken(String resetToken) {
        return utilisateurRepository.findByResetToken(resetToken);
    }
}