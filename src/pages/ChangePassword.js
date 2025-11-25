import React, { useState } from "react";
import api from "../api";
import "./Auth.css";

function ChangePassword() {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validation
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: "Les nouveaux mots de passe ne correspondent pas" });
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setMessage({ type: 'error', text: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
            setLoading(false);
            return;
        }

        try {
            await api.put("/auth/change-password", {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            setMessage({ type: 'success', text: "Mot de passe modifié avec succès !" });
            setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data || "Erreur lors de la modification du mot de passe" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-form">
                    <div className="form-header">
                        <div className="logo">HotelMS</div>
                        <div className="subtitle">Modifier le mot de passe</div>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form-content">
                        <div className="form-group">
                            <label htmlFor="currentPassword">Mot de passe actuel</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                placeholder="••••••••"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">Nouveau mot de passe</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                placeholder="••••••••"
                                value={formData.newPassword}
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
                            <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
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

                        {message.text && (
                            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                                {message.type === 'success' ? '✅' : '❌'} {message.text}
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
                                    Modification...
                                </>
                            ) : (
                                "Modifier le mot de passe"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;