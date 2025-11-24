package com.hotel.reservation_service.service.dto;

import lombok.Data;

@Data
public class UtilisateurResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String role;
}