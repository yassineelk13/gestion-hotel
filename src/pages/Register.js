import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Register() {
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        motDePasse: "",
        confirmPassword: ""
    });
    const [erreur, setErreur] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur("");
        setSuccess("");

        // Validation
        if (formData.motDePasse !== formData.confirmPassword) {
            setErreur("Les mots de passe ne correspondent pas");
            setLoading(false);
            return;
        }

        if (formData.motDePasse.length < 6) {
            setErreur("Le mot de passe doit contenir au moins 6 caractères");
            setLoading(false);
            return;
        }

        try {
            const response = await api.post("/auth/register", {
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                motDePasse: formData.motDePasse
            });

            setSuccess("Compte créé avec succès! Redirection...");

            // Redirection automatique après 2 secondes
            setTimeout(() => {
                navigate("/");
            }, 2000);

        } catch (err) {
            console.error("Erreur d'inscription:", err);
            setErreur(err.response?.data || "Erreur lors de la création du compte");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-image">
                    <div className="auth-image-content">
                        <div className="hotel-icon">🔐</div>
                        <h1>Créer un compte</h1>
                        <p>Rejoignez notre système de gestion hôtelière</p>
                    </div>
                </div>

                <div className="auth-form">
                    <div className="form-header">
                        <div className="logo">HotelMS</div>
                        <div className="subtitle">Créez votre compte</div>
                    </div>

                    <form onSubmit={handleRegister} className="auth-form-content">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="prenom">Prénom</label>
                                <input
                                    type="text"
                                    id="prenom"
                                    name="prenom"
                                    placeholder="Votre prénom"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="nom">Nom</label>
                                <input
                                    type="text"
                                    id="nom"
                                    name="nom"
                                    placeholder="Votre nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="votre@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="motDePasse">Mot de passe</label>
                            <input
                                type="password"
                                id="motDePasse"
                                name="motDePasse"
                                placeholder="••••••••"
                                value={formData.motDePasse}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="form-input"
                                minLength="6"
                            />
                            <div className="password-hint">
                                Au moins 6 caractères
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        {erreur && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                {erreur}
                            </div>
                        )}

                        {success && (
                            <div className="success-message">
                                <span className="success-icon">✅</span>
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-auth"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Création du compte...
                                </>
                            ) : (
                                "Créer mon compte"
                            )}
                        </button>

                        <div className="auth-link">
                            <span>Vous avez déjà un compte?</span>
                            <Link to="/">Se connecter</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;