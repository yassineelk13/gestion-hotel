package com.hotel.repositories;

import com.hotel.entities.Utilisateur;
import com.hotel.entities.Role;  // ✅ IMPORTANT
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;  // ✅ IMPORTANT
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    // Filtrer par rôle
    List<Utilisateur> findByRole(Role role);

    // Filtrer par statut actif
    List<Utilisateur> findByActif(boolean actif);
}
