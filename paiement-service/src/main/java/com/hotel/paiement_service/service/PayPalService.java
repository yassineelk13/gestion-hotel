package com.hotel.paiement_service.service;

import com.paypal.api.payments.*;
import com.paypal.base.rest.APIContext;
import com.paypal.base.rest.PayPalRESTException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class PayPalService {

    @Value("${paypal.client.id}")
    private String clientId;

    @Value("${paypal.client.secret}")
    private String clientSecret;

    @Value("${paypal.mode}")
    private String mode;

    private APIContext apiContext;

    @PostConstruct
    public void init() {
        this.apiContext = new APIContext(clientId, clientSecret, mode);
        System.out.println("✅ PayPal initialisé en mode: " + mode);
    }

    /**
     * Créer un paiement PayPal
     */
    public Payment createPayment(
            Double montant,
            String currency,
            String description,
            String cancelUrl,
            String successUrl
    ) throws PayPalRESTException {

        System.out.println("💙 Création paiement PayPal pour montant: " + montant + " " + currency);

        Amount amount = new Amount();
        amount.setCurrency(currency);
        amount.setTotal(String.format(Locale.US, "%.2f", montant));

        Transaction transaction = new Transaction();
        transaction.setDescription(description);
        transaction.setAmount(amount);

        List<Transaction> transactions = new ArrayList<>();
        transactions.add(transaction);

        Payer payer = new Payer();
        payer.setPaymentMethod("paypal");

        Payment payment = new Payment();
        payment.setIntent("sale");
        payment.setPayer(payer);
        payment.setTransactions(transactions);

        RedirectUrls redirectUrls = new RedirectUrls();
        redirectUrls.setCancelUrl(cancelUrl);
        redirectUrls.setReturnUrl(successUrl);
        payment.setRedirectUrls(redirectUrls);

        Payment createdPayment = payment.create(apiContext);
        System.out.println("✅ Paiement PayPal créé: " + createdPayment.getId());

        return createdPayment;
    }

    /**
     * Exécuter un paiement PayPal après approbation
     */
    public Payment executePayment(String paymentId, String payerId) throws PayPalRESTException {
        System.out.println("🔄 Exécution paiement PayPal: " + paymentId);

        Payment payment = new Payment();
        payment.setId(paymentId);

        PaymentExecution paymentExecution = new PaymentExecution();
        paymentExecution.setPayerId(payerId);

        Payment executedPayment = payment.execute(apiContext, paymentExecution);
        System.out.println("✅ Paiement PayPal exécuté avec succès");

        return executedPayment;
    }

    /**
     * Récupérer les détails d'un paiement PayPal
     */
    public Payment getPaymentDetails(String paymentId) throws PayPalRESTException {
        System.out.println("🔍 Récupération détails paiement PayPal: " + paymentId);
        return Payment.get(apiContext, paymentId);
    }
}