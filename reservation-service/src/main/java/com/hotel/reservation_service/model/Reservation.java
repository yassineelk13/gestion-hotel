package com.hotel.reservation_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reservation")
    private Long idReservation;

    @Column(name = "id_client", nullable = false)
    private Long idClient;

    @Column(name = "id_chambre", nullable = false)
    private Long idChambre;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    private StatutReservation statut = StatutReservation.CONFIRMEE;

    @Column(name = "date_creation")
    @CreationTimestamp
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    @UpdateTimestamp
    private LocalDateTime dateModification;

    @OneToOne(mappedBy = "reservation", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Facture facture;
}