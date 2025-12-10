import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import paiementApi from '../api/paiementApi';
import './ModalPaiement.css';

// ✅ Charger Stripe avec la clé depuis .env
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function ModalPaiement({ facture, onSuccess, onCancel }) {
    return (
        <div className="modal-overlay-paiement" onClick={onCancel}>
            <div className="modal-paiement" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-paiement">
                    <h3>💳 Payer votre facture</h3>
                    <button className="close-btn" onClick={onCancel}>✕</button>
                </div>

                <div className="facture-info">
                    <div className="facture-detail">
                        <span>Facture N°:</span>
                        <strong>#{facture.idFacture}</strong>
                    </div>
                    <div className="facture-detail">
                        <span>Réservation N°:</span>
                        <strong>#{facture.idReservation}</strong>
                    </div>
                    <div className="facture-montant">
                        <span>Montant à payer:</span>
                        <strong className="montant-total">{facture.montantTotal} MAD</strong>
                    </div>
                </div>

                <Elements stripe={stripePromise}>
                    <CheckoutForm
                        facture={facture}
                        onSuccess={onSuccess}
                        onCancel={onCancel}
                    />
                </Elements>
            </div>
        </div>
    );
}

function CheckoutForm({ facture, onSuccess, onCancel }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Étape 1: Création Payment Intent...');

            // ÉTAPE 1: Créer un Payment Intent
            const intentResponse = await paiementApi.post('/paiements/stripe/create-payment-intent', {
                idFacture: facture.idFacture,
                idReservation: facture.idReservation,
                montant: facture.montantTotal
            });

            const { clientSecret, paymentIntentId } = intentResponse.data;
            console.log('✅ Payment Intent créé:', paymentIntentId);

            console.log('🔄 Étape 2: Confirmation avec Stripe...');

            // ÉTAPE 2: Confirmer le paiement avec Stripe
            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                }
            });

            if (stripeError) {
                console.error('❌ Erreur Stripe:', stripeError);
                setError(stripeError.message);
                setLoading(false);
                return;
            }

            console.log('✅ Paiement Stripe confirmé');
            console.log('🔄 Étape 3: Enregistrement du paiement...');

            // ÉTAPE 3: Enregistrer le paiement dans notre base
            await paiementApi.post('/paiements/stripe/confirm', {
                idFacture: facture.idFacture,
                idReservation: facture.idReservation,
                montant: facture.montantTotal,
                paymentIntentId: paymentIntentId
            });

            // ✅ AMÉLIORER LE MESSAGE
            console.log('✅ Paiement enregistré avec succès');

// 🔔 Afficher une notification visuelle (optionnel)
            alert('✅ Paiement effectué avec succès ! Votre facture sera mise à jour automatiquement.');

            onSuccess();

        } catch (err) {
            console.error('❌ Erreur lors du paiement:', err);
            setError(err.response?.data?.message || 'Erreur lors du paiement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            <div className="card-element-container">
                <label>Informations de carte bancaire</label>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                                padding: '10px',
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            {error && (
                <div className="alert alert-error">
                    ❌ {error}
                </div>
            )}

            <div className="payment-info">
                <p>🔒 Paiement sécurisé par Stripe</p>
                <p>💳 Cartes de test Stripe :</p>
                <ul>
                    <li><code>4242 4242 4242 4242</code> - Succès</li>
                    <li>Date: Futur (ex: 12/30)</li>
                    <li>CVC: 123</li>
                </ul>
            </div>

            <div className="modal-actions">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!stripe || loading}
                >
                    {loading ? '⏳ Traitement...' : `💳 Payer ${facture.montantTotal} MAD`}
                </button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Annuler
                </button>
            </div>
        </form>
    );
}

export default ModalPaiement;
