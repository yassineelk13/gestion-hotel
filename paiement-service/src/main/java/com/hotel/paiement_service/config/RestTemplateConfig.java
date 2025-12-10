package com.hotel.paiement_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.support.BasicAuthenticationInterceptor;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Value("${services.reservation.username:admin}")
    private String reservationUsername;

    @Value("${services.reservation.password:admin123}")
    private String reservationPassword;

    /**
     * ✅ RestTemplate avec Basic Authentication
     * pour communiquer avec le service Réservation
     */
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();

        // ✅ Ajouter Basic Auth (admin:admin123)
        restTemplate.getInterceptors().add(
                new BasicAuthenticationInterceptor(reservationUsername, reservationPassword)
        );

        return restTemplate;
    }
}