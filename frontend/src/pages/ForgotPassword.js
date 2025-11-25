import React, { useState } from 'react';
import api from '../api';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Nouveau mot de passe
    const [emailSent, setEmailSent] = useState(false);

    // Étape 1: Demander le code
    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            console.log('Envoi de la demande pour:', email);

            const response = await api.post('/auth/forgot-password', {
                email: email
            });

            console.log('Réponse reçue:', response);
            setMessage("Si l'email existe, un code de réinitialisation a été envoyé");
            setEmailSent(true);
            setStep(2); // Passer à l'étape du code
        } catch (err) {
            console.error('Erreur détaillée:', err);

            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err.message === 'Network Error') {
                setError('Erreur de connexion au serveur. Vérifiez que le serveur est démarré.');
            } else {
                setError('Erreur lors de l\'envoi de la demande: ' + (err.message || 'Erreur inconnue'));
            }
        } finally {
            setLoading(false);
        }
    };

    // Étape 2: Valider le code
    const handleValidateCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/validate-reset-token', {
                email: email,
                token: token
            });

            if (response.data.valid) {
                setMessage("✅ Code validé avec succès");
                setStep(3); // Passer à l'étape du nouveau mot de passe
            } else {
                setError("❌ Code invalide ou expiré");
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur de validation du code');
        } finally {
            setLoading(false);
        }
    };

    // Étape 3: Réinitialiser le mot de passe
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/reset-password', {
                email: email,
                token: token,
                newPassword: newPassword
            });

            setMessage("✅ Mot de passe réinitialisé avec succès !");

            // Redirection après 3 secondes
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la réinitialisation');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <>
            <div className="forgot-password-info">
                🔒 Entrez votre adresse email. Nous vous enverrons un code de réinitialisation.
            </div>

            <form onSubmit={handleSendCode}>
                <div className="form-group">
                    <label>Adresse email</label>
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="success-message">
                        <span className="success-icon">✅</span>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-auth"
                    disabled={loading}
                >
                    {loading && <div className="spinner"></div>}
                    {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                </button>
            </form>

            <div className="auth-link">
                <span>Vous souvenez-vous de votre mot de passe?</span>
                <a href="/">Se connecter</a>
            </div>
        </>
    );

    const renderStep2 = () => (
        <>
            <div className="forgot-password-info">
                📧 Nous avons envoyé un code à 6 chiffres à l'adresse :<br />
                <strong>{email}</strong><br />
                Entrez le code ci-dessous pour vérifier votre identité.
            </div>

            <form onSubmit={handleValidateCode}>
                <div className="form-group">
                    <label>Code de vérification</label>
                    <input
                        type="text"
                        className="form-input"
                        value={token}
                        onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        required
                        maxLength="6"
                        disabled={loading}
                        style={{textAlign: 'center', letterSpacing: '2px', fontSize: '18px'}}
                    />
                    <div className="password-hint">
                        Code à 6 chiffres reçu par email
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="success-message">
                        <span className="success-icon">✅</span>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-auth"
                    disabled={loading}
                >
                    {loading && <div className="spinner"></div>}
                    {loading ? 'Vérification...' : 'Valider le code'}
                </button>
            </form>

            <div className="auth-link">
                <span>Vous n'avez pas reçu le code?</span>
                <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                        setStep(1);
                        setError('');
                        setMessage('');
                    }}
                >
                    Renvoyer le code
                </button>
            </div>
        </>
    );

    const renderStep3 = () => (
        <>
            <div className="forgot-password-info">
                🔒 Créez votre nouveau mot de passe
            </div>

            <form onSubmit={handleResetPassword}>
                <div className="form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                        type="password"
                        className="form-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 caractères"
                        required
                        minLength="6"
                        disabled={loading}
                    />
                    <div className="password-hint">Minimum 6 caractères</div>
                </div>

                <div className="form-group">
                    <label>Confirmer le mot de passe</label>
                    <input
                        type="password"
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retapez votre mot de passe"
                        required
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="success-message">
                        <span className="success-icon">✅</span>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-auth"
                    disabled={loading}
                >
                    {loading && <div className="spinner"></div>}
                    {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
            </form>

            <div className="auth-link">
                <span>Vous souvenez-vous de votre mot de passe?</span>
                <a href="/">Se connecter</a>
            </div>
        </>
    );

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Section Image */}
                <div className="auth-image">
                    <div className="auth-image-content">
                        <span className="hotel-icon">🏨</span>
                        <h1>Réinitialisation</h1>
                        <p>
                            {step === 1 && "Recevez un code pour réinitialiser votre mot de passe"}
                            {step === 2 && "Entrez le code de vérification"}
                            {step === 3 && "Créez votre nouveau mot de passe"}
                        </p>

                        {/* Indicateur de progression */}
                        <div className="progress-steps">
                            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
                            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
                            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
                        </div>
                    </div>
                </div>

                {/* Section Formulaire */}
                <div className="auth-form">
                    <div className="form-header">
                        <div className="logo">HotelMS</div>
                        <p className="subtitle">
                            {step === 1 && "Mot de passe oublié"}
                            {step === 2 && "Vérification du code"}
                            {step === 3 && "Nouveau mot de passe"}
                        </p>
                    </div>

                    <div className="auth-form-content">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;