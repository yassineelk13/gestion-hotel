import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import api from "../api";

function DashboardClient() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profileData, setProfileData] = useState({
        nom: user.user?.nom || "",
        prenom: user.user?.prenom || "",
        email: user.user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = () => {
            setShowProfileDropdown(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.put('/auth/me', {
                nom: profileData.nom,
                prenom: profileData.prenom,
                email: profileData.email
            });

            showMessage('success', "✅ Profil modifié avec succès !");

            // Mettre à jour le localStorage
            const updatedUser = {
                ...user,
                user: {
                    ...user.user,
                    ...response.data
                }
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));

        } catch (err) {
            showMessage('error', "❌ Erreur lors de la modification du profil: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Validation
            if (!profileData.currentPassword) {
                showMessage('error', "❌ Le mot de passe actuel est requis");
                return;
            }

            if (profileData.newPassword !== profileData.confirmPassword) {
                showMessage('error', "❌ Les nouveaux mots de passe ne correspondent pas");
                return;
            }

            if (profileData.newPassword.length < 6) {
                showMessage('error', "❌ Le nouveau mot de passe doit contenir au moins 6 caractères");
                return;
            }

            await api.put("/auth/change-password", {
                currentPassword: profileData.currentPassword,
                newPassword: profileData.newPassword
            });

            showMessage('success', "✅ Mot de passe modifié avec succès !");

            // Réinitialiser les champs de mot de passe
            setProfileData({
                ...profileData,
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (err) {
            showMessage('error', "❌ Erreur: " + (err.response?.data || "Erreur lors de la modification du mot de passe"));
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (nom, prenom) => {
        return ((nom?.[0] || '') + (prenom?.[0] || '')).toUpperCase();
    };

    return (
        <div className="dashboard-container">
            {/* Bouton menu mobile */}
            <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                ☰
            </button>

            {/* Sidebar */}
            <div className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="logo">
                    <span className="logo-icon">🏨</span>
                    <span>HotelMS</span>
                </div>
                <div className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
                     onClick={() => {
                         setActiveMenu("dashboard");
                         setMobileMenuOpen(false);
                     }}>
                    <span>📊</span>
                    <span>Tableau de bord</span>
                </div>
                <div className={`menu-item ${activeMenu === "reservations" ? "active" : ""}`}
                     onClick={() => {
                         setActiveMenu("reservations");
                         setMobileMenuOpen(false);
                     }}>
                    <span>📅</span>
                    <span>Mes réservations</span>
                </div>
                <div className={`menu-item ${activeMenu === "profile" ? "active" : ""}`}
                     onClick={() => {
                         setActiveMenu("profile");
                         setMobileMenuOpen(false);
                     }}>
                    <span>👤</span>
                    <span>Mon profil</span>
                </div>
                <div className={`menu-item ${activeMenu === "factures" ? "active" : ""}`}
                     onClick={() => {
                         setActiveMenu("factures");
                         setMobileMenuOpen(false);
                     }}>
                    <span>💰</span>
                    <span>Mes factures</span>
                </div>
                <div className="menu-item logout-item" onClick={handleLogout}>
                    <span>🚪</span>
                    <span>Déconnexion</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Top Bar avec avatar cliquable */}
                <div className="top-bar">
                    <h1 className="page-title">
                        {activeMenu === "dashboard" && "Mon Espace Client"}
                        {activeMenu === "reservations" && "Mes Réservations"}
                        {activeMenu === "profile" && "Mon Profil"}
                        {activeMenu === "factures" && "Mes Factures"}
                    </h1>
                    <div className="user-info">
                        <div className="user-details">
                            <div>Bienvenue, {user.user?.prenom || "Client"} {user.user?.nom || ""}</div>
                            <div>{user.user?.email || "client@hotelms.com"}</div>
                        </div>
                        <div className="avatar-dropdown">
                            <div
                                className="avatar"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowProfileDropdown(!showProfileDropdown);
                                }}
                            >
                                {getInitials(user.user?.nom, user.user?.prenom) || "CL"}
                            </div>
                            {showProfileDropdown && (
                                <div className="dropdown-menu">
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setActiveMenu("profile");
                                            setShowProfileDropdown(false);
                                        }}
                                    >
                                        👤 Mon Profil
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={handleLogout}
                                    >
                                        🚪 Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Message de notification */}
                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        {message.text}
                    </div>
                )}

                {/* Section Profil */}
                {activeMenu === "profile" && (
                    <div className="profile-section">
                        <div className="profile-header">
                            <h2 className="section-title">Mon Profil</h2>
                            <p className="section-subtitle">Gérez vos informations personnelles et votre mot de passe</p>
                        </div>

                        <div className="profile-content">
                            {/* Informations personnelles */}
                            <div className="profile-card">
                                <div className="card-header">
                                    <h3>📝 Informations Personnelles</h3>
                                </div>
                                <form onSubmit={handleProfileUpdate} className="profile-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Prénom *</label>
                                            <input
                                                className="form-control"
                                                value={profileData.prenom}
                                                onChange={e => setProfileData({...profileData, prenom: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Nom *</label>
                                            <input
                                                className="form-control"
                                                value={profileData.nom}
                                                onChange={e => setProfileData({...profileData, nom: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input
                                            className="form-control"
                                            type="email"
                                            value={profileData.email}
                                            onChange={e => setProfileData({...profileData, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? "⏳ Enregistrement..." : "💾 Enregistrer les modifications"}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Changement de mot de passe */}
                            <div className="profile-card">
                                <div className="card-header">
                                    <h3>🔒 Sécurité du Compte</h3>
                                </div>
                                <form onSubmit={handleChangePassword} className="profile-form">
                                    <div className="form-group">
                                        <label>Mot de passe actuel *</label>
                                        <input
                                            className="form-control"
                                            placeholder="Entrez votre mot de passe actuel"
                                            type="password"
                                            value={profileData.currentPassword}
                                            onChange={e => setProfileData({...profileData, currentPassword: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Nouveau mot de passe *</label>
                                        <input
                                            className="form-control"
                                            placeholder="Choisissez un nouveau mot de passe"
                                            type="password"
                                            value={profileData.newPassword}
                                            onChange={e => setProfileData({...profileData, newPassword: e.target.value})}
                                            required
                                        />
                                        <div className="password-hint">
                                            🔒 Le mot de passe doit contenir au moins 6 caractères
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Confirmer le nouveau mot de passe *</label>
                                        <input
                                            className="form-control"
                                            placeholder="Confirmez votre nouveau mot de passe"
                                            type="password"
                                            value={profileData.confirmPassword}
                                            onChange={e => setProfileData({...profileData, confirmPassword: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-success" disabled={loading}>
                                            {loading ? "⏳ Modification..." : "🔄 Modifier le mot de passe"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dashboard principal */}
                {activeMenu === "dashboard" && (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>2</h3>
                                    <p>Réservations actives</p>
                                </div>
                                <div className="stat-icon icon-purple">📅</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>5</h3>
                                    <p>Réservations totales</p>
                                </div>
                                <div className="stat-icon icon-green">📊</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>1</h3>
                                    <p>Prochaine arrivée</p>
                                </div>
                                <div className="stat-icon icon-orange">🔔</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>0</h3>
                                    <p>Factures en attente</p>
                                </div>
                                <div className="stat-icon icon-red">💰</div>
                            </div>
                        </div>

                        {/* Réservations récentes */}
                        <div className="recent-section">
                            <h3 className="chart-title">Mes réservations récentes</h3>
                            <table className="recent-table">
                                <thead>
                                <tr>
                                    <th>Référence</th>
                                    <th>Chambre</th>
                                    <th>Date d'arrivée</th>
                                    <th>Date de départ</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>#RES-001</td>
                                    <td>Double Deluxe - 301</td>
                                    <td>15 Nov 2025</td>
                                    <td>20 Nov 2025</td>
                                    <td>2 500 MAD</td>
                                    <td><span className="status-badge status-confirmed">Confirmée</span></td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-view">Détails</button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>#RES-002</td>
                                    <td>Suite Executive - 401</td>
                                    <td>01 Déc 2025</td>
                                    <td>05 Déc 2025</td>
                                    <td>4 200 MAD</td>
                                    <td><span className="status-badge status-pending">En attente</span></td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-edit">Modifier</button>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Sections placeholder pour autres menus */}
                {activeMenu === "reservations" && (
                    <div className="recent-section">
                        <h3 className="chart-title">Mes Réservations</h3>
                        <p>Interface détaillée des réservations à implémenter...</p>
                    </div>
                )}

                {activeMenu === "factures" && (
                    <div className="recent-section">
                        <h3 className="chart-title">Mes Factures</h3>
                        <p>Interface des factures à implémenter...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardClient;