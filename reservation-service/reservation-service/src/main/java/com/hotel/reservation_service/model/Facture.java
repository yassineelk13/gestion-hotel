package com.hotel.reservation_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "factures")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_facture")
    private Long idFacture;

    @Column(name = "date_emission")
    @CreationTimestamp
    private LocalDateTime dateEmission;

    @Column(name = "montant_total", nullable = false)
    private BigDecimal montantTotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat", nullable = false)
    private EtatFacture etat = EtatFacture.EMISE;

    @OneToOne
    @JoinColumn(name = "id_reservation", nullable = false, unique = true)
    @JsonIgnore
    private Reservation reservation;
}