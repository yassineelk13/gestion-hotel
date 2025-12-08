package com.hotel.paiement_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class PaiementServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaiementServiceApplication.class, args);
        System.out.println("✅ Paiement Service démarré sur le port 8084");
        System.out.println("💳 Stripe + PayPal intégrés");
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}