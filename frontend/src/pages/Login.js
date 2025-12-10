import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [motDePasse, setMotDePasse] = useState("");
    const [erreur, setErreur] = useState("");
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    const redirectUser = useCallback((role) => {
        switch (role) {
            case "ADMIN":
                navigate("/admin");
                break;
            case "RECEPTIONNISTE":
                navigate("/reception");
                break;
            case "CLIENT":
                navigate("/client");
                break;
            default:
                navigate("/client");
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (token && user.user) {
            redirectUser(user.user.role);
        }
    }, [redirectUser]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErreur("");

        try {
            const response = await api.post("/auth/login", {
                email,
                motDePasse
            });

            const { user, token } = response.data;

            if (!token) {
                throw new Error("Token manquant dans la réponse");
            }

            localStorage.setItem("user", JSON.stringify({ user }));
            localStorage.setItem("token", token);

            if (rememberMe) {
                localStorage.setItem("rememberMe", "true");
                localStorage.setItem("savedEmail", email);
            } else {
                localStorage.removeItem("rememberMe");
                localStorage.removeItem("savedEmail");
            }

            redirectUser(user.role);

        } catch (err) {
            setErreur(err.response?.data || "Email ou mot de passe incorrect");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
    };

    useEffect(() => {
        const savedEmail = localStorage.getItem("savedEmail");
        const remember = localStorage.getItem("rememberMe");

        if (remember === "true" && savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-image">
                    <div className="login-image-content">
                        <div className="hotel-icon">🏨</div>
                        <h1>Bienvenue</h1>
                        <p>Système de Gestion Hôtelière</p>
                    </div>
                </div>

                <div className="login-form">
                    <div className="form-header">
                        <div className="logo-hotel">
                            <div className="logo-hotel-icon">🏨</div>
                            <div className="logo-hotel-text">
                                <span className="brand">HotelMS</span>
                                <span className="tagline">Gestion Hôtelière</span>
                            </div>
                        </div>
                        <div className="subtitle">Connectez-vous à votre compte</div>
                    </div>

                    {token ? (
                        <div className="already-connected">
                            <div className="connected-info">
                                <h3>Déjà connecté</h3>
                                <p>Vous êtes connecté en tant que <strong>{user.user?.prenom} {user.user?.nom}</strong></p>
                                <div className="connected-actions">
                                    <button
                                        className="btn-continue"
                                        onClick={() => redirectUser(user.user?.role)}
                                    >
                                        Continuer vers mon espace
                                    </button>
                                    <button
                                        className="btn-logout"
                                        onClick={handleLogout}
                                    >
                                        Se déconnecter
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="login-form-content">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Mot de passe</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="••••••••"
                                    value={motDePasse}
                                    onChange={e => setMotDePasse(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-options">
                                <div className="remember-me">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                        className="checkbox"
                                    />
                                    <label htmlFor="remember">Se souvenir de moi</label>
                                </div>
                                <div className="auth-link">
                                    <span>Mot de passe oublié?</span>
                                    <a href="/forgot-password">Réinitialiser</a>
                                </div>
                            </div>

                            {erreur && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {erreur}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-login"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Connexion en cours...
                                    </>
                                ) : (
                                    "Se connecter"
                                )}
                            </button>

                            <div className="signup-link">
                                <span>Vous n'avez pas de compte?</span>
                                <Link to="/register">S'inscrire</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;