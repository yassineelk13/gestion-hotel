package com.hotel.services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken, String nom, String prenom) {
        try {
            System.out.println("🚀 TENTATIVE D'ENVOI EMAIL À: " + toEmail);

            // Version SIMPLE sans template HTML (plus fiable)
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Réinitialisation de votre mot de passe - HotelMS");

            String text = "Bonjour " + prenom + " " + nom + ",\n\n" +
                    "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                    "Votre code de réinitialisation est : " + resetToken + "\n\n" +
                    "Ce code expirera dans 1 heure.\n\n" +
                    "Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.\n\n" +
                    "Cordialement,\nL'équipe Hotel Management System";

            message.setText(text);

            mailSender.send(message);
            System.out.println("✅ EMAIL ENVOYÉ AVEC SUCCÈS À: " + toEmail);
            System.out.println("📧 CODE ENVOYÉ: " + resetToken);

        } catch (Exception e) {
            System.err.println("❌ ERREUR ENVOI EMAIL: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de l'envoi de l'email: " + e.getMessage());
        }
    }

    public void sendPasswordEmail(String toEmail, String password, String nom, String prenom) {
        try {
            System.out.println("🚀 TENTATIVE D'ENVOI MOT DE PASSE À: " + toEmail);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Votre mot de passe - HotelMS");

            String text = "Bonjour " + prenom + " " + nom + ",\n\n" +
                    "Voici votre mot de passe pour accéder à votre compte :\n\n" +
                    "Mot de passe : " + password + "\n\n" +
                    "Conseil de sécurité : Après votre première connexion, nous vous recommandons de changer votre mot de passe.\n\n" +
                    "Cordialement,\nL'équipe Hotel Management System";

            message.setText(text);

            mailSender.send(message);
            System.out.println("✅ MOT DE PASSE ENVOYÉ À: " + toEmail);

        } catch (Exception e) {
            System.err.println("❌ ERREUR ENVOI MOT DE PASSE: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de l'envoi du mot de passe: " + e.getMessage());
        }
    }
}