import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import api from "../api";
import axios from 'axios';
import ChambresDisponibles from './ChambresDisponibles';

function DashboardClient() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.user?.id;

    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // États pour les données
    const [stats, setStats] = useState({
        reservationsActives: 0,
        reservationsTotales: 0,
        prochaineArrivee: null,
        facturesEnAttente: 0
    });
    const [reservations, setReservations] = useState([]);
    const [factures, setFactures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // États pour le profil
    const [profileData, setProfileData] = useState({
        nom: user.user?.nom || "",
        prenom: user.user?.prenom || "",
        email: user.user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [profileLoading, setProfileLoading] = useState(false);

    // Charger les données au montage
    useEffect(() => {
        if (activeMenu === "dashboard" || activeMenu === "reservations") {
            fetchReservations();
        }
        if (activeMenu === "factures") {
            fetchFactures();
        }
    }, [activeMenu]);

    useEffect(() => {
        const handleClickOutside = () => setShowProfileDropdown(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Ajouter cette fonction
    const handlePayerFacture = async (idFacture) => {
        if (!window.confirm('Confirmer le paiement de cette facture ?')) {
            return;
        }

        try {
            await axios.post(
                `http://localhost:8083/api/factures/${idFacture}/payer`,
                {},
                {
                    auth: {
                        username: 'admin',
                        password: 'admin123'
                    }
                }
            );

            showMessage('success', '✅ Facture payée avec succès !');
            fetchFactures();

        } catch (err) {
            showMessage('error', '❌ Erreur lors du paiement: ' + (err.response?.data || err.message));
        }
    };

    // Fonction pour télécharger le PDF
    const handleDownloadPdf = async (idFacture) => {
        try {
            console.log('📄 Téléchargement PDF facture', idFacture);

            const response = await axios.get(
                `http://localhost:8083/api/factures/${idFacture}/pdf`,
                {
                    auth: {
                        username: 'admin',
                        password: 'admin123'
                    },
                    responseType: 'blob' // Important pour les fichiers binaires
                }
            );

            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `facture-${idFacture}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            showMessage('success', '✅ Facture téléchargée !');

        } catch (err) {
            console.error('❌ Erreur téléchargement PDF:', err);
            showMessage('error', '❌ Erreur lors du téléchargement');
        }
    };

    // Récupérer les réservations
    const fetchReservations = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Récupération des réservations pour userId:', userId);

            const response = await axios.get(
                `http://localhost:8083/api/reservations?idClient=${userId}`,
                {
                    auth: {
                        username: 'admin',
                        password: 'admin123'
                    }
                }
            );

            const reservationsData = response.data;
            console.log('✅ Réservations récupérées:', reservationsData);

            setReservations(reservationsData);

            // Calculer les statistiques
            const actives = reservationsData.filter(r => r.statut === 'CONFIRMEE').length;

            // Trouver la prochaine arrivée
            const now = new Date();
            const prochaine = reservationsData
                .filter(r => r.statut === 'CONFIRMEE' && new Date(r.dateDebut) > now)
                .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut))[0];

            // Compter les factures en attente (à partir des réservations)
            const facturesEnAttente = reservationsData.filter(
                r => r.facture && r.facture.etat === 'EMISE'
            ).length;

            setStats({
                reservationsActives: actives,
                reservationsTotales: reservationsData.length,
                prochaineArrivee: prochaine,
                facturesEnAttente: facturesEnAttente
            });

        } catch (err) {
            console.error('❌ Erreur lors du chargement des réservations:', err);
            setError('Impossible de charger les réservations');
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    // Récupérer les factures
    const fetchFactures = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Récupération des factures pour userId:', userId);

            // Récupérer les réservations du client
            const reservationsResponse = await axios.get(
                `http://localhost:8083/api/reservations?idClient=${userId}`,
                {
                    auth: {
                        username: 'admin',
                        password: 'admin123'
                    }
                }
            );

            const reservationsData = reservationsResponse.data;

            // Extraire les factures des réservations
            const allFactures = reservationsData
                .filter(r => r.facture)
                .map(r => ({
                    ...r.facture,
                    idReservation: r.idReservation
                }));

            // Trier par date (plus récentes d'abord)
            allFactures.sort((a, b) => new Date(b.dateEmission) - new Date(a.dateEmission));

            console.log('✅ Factures récupérées:', allFactures);
            setFactures(allFactures);

        } catch (err) {
            console.error('❌ Erreur lors du chargement des factures:', err);
            setError('Impossible de charger les factures');
            setFactures([]);
        } finally {
            setLoading(false);
        }
    };

    // Annuler une réservation
    const handleCancelReservation = async (idReservation) => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
            return;
        }

        try {
            await axios.post(
                `http://localhost:8083/api/reservations/${idReservation}/annuler`,
                {},
                {
                    auth: {
                        username: 'admin',
                        password: 'admin123'
                    }
                }
            );
            showMessage('success', '✅ Réservation annulée avec succès');
            fetchReservations();
        } catch (err) {
            showMessage('error', '❌ Erreur lors de l\'annulation: ' + (err.response?.data || err.message));
        }
    };

    // Formater les dates
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Formater le montant
    const formatMontant = (montant) => {
        if (!montant && montant !== 0) return 'N/A';
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD'
        }).format(montant);
    };

    // Obtenir le badge de statut
    const getStatutBadge = (statut) => {
        const classes = {
            'CONFIRMEE': 'status-confirmed',
            'EN_ATTENTE': 'status-pending',
            'ANNULEE': 'status-cancelled',
            'TERMINEE': 'status-completed'
        };

        const labels = {
            'CONFIRMEE': 'Confirmée',
            'EN_ATTENTE': 'En attente',
            'ANNULEE': 'Annulée',
            'TERMINEE': 'Terminée'
        };

        return <span className={`status-badge ${classes[statut]}`}>{labels[statut] || statut}</span>;
    };

    const getFactureStatutBadge = (etat) => {
        const classes = {
            'EMISE': 'status-pending',
            'PAYEE': 'status-confirmed'
        };

        const labels = {
            'EMISE': 'À payer',
            'PAYEE': 'Payée'
        };

        return <span className={`status-badge ${classes[etat]}`}>{labels[etat] || etat}</span>;
    };

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
        setProfileLoading(true);
        try {
            const response = await api.put('/auth/me', {
                nom: profileData.nom,
                prenom: profileData.prenom,
                email: profileData.email
            });

            showMessage('success', "✅ Profil modifié avec succès !");

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
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
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

            setProfileData({
                ...profileData,
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (err) {
            showMessage('error', "❌ Erreur: " + (err.response?.data || "Erreur lors de la modification du mot de passe"));
        } finally {
            setProfileLoading(false);
        }
    };

    const getInitials = (nom, prenom) => {
        return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();
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
                <div className={`menu-item ${activeMenu === "chambres" ? "active" : ""}`}
                     onClick={() => {
                         setActiveMenu("chambres");
                         setMobileMenuOpen(false);
                     }}>
                    <span>🏨</span>
                    <span>Chambres disponibles</span>
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
                {/* Top Bar */}
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

                {/* Erreur globale */}
                {error && (
                    <div className="alert alert-error">
                        ❌ {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (activeMenu === "dashboard" || activeMenu === "reservations" || activeMenu === "factures") && (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Chargement...</p>
                    </div>
                )}

                {/* Dashboard principal */}
                {activeMenu === "dashboard" && !loading && (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.reservationsActives}</h3>
                                    <p>Réservations actives</p>
                                </div>
                                <div className="stat-icon icon-purple">📅</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.reservationsTotales}</h3>
                                    <p>Réservations totales</p>
                                </div>
                                <div className="stat-icon icon-green">📊</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.prochaineArrivee ? formatDate(stats.prochaineArrivee.dateDebut) : '-'}</h3>
                                    <p>Prochaine arrivée</p>
                                </div>
                                <div className="stat-icon icon-orange">🔔</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.facturesEnAttente}</h3>
                                    <p>Factures en attente</p>
                                </div>
                                <div className="stat-icon icon-red">💰</div>
                            </div>
                        </div>

                        {/* ✅ AJOUTER CETTE SECTION */}
                        <div className="action-cards">
                            <div className="action-card" onClick={() => setActiveMenu("chambres")}>
                                <div className="action-icon">🏨</div>
                                <h3>Réserver une chambre</h3>
                                <p>Découvrez nos chambres disponibles et réservez en quelques clics</p>
                                <button className="btn-action">Voir les chambres disponibles</button>
                            </div>

                            <div className="action-card" onClick={() => setActiveMenu("reservations")}>
                                <div className="action-icon">📅</div>
                                <h3>Mes réservations</h3>
                                <p>Consultez et gérez vos réservations en cours</p>
                                <button className="btn-action">Voir mes réservations</button>
                            </div>

                            <div className="action-card" onClick={() => setActiveMenu("factures")}>
                                <div className="action-icon">💰</div>
                                <h3>Mes factures</h3>
                                <p>Téléchargez vos factures et effectuez vos paiements</p>
                                <button className="btn-action">Voir mes factures</button>
                            </div>
                        </div>


                        {/* Réservations récentes */}
                        <div className="recent-section">
                            <h3 className="chart-title">Mes réservations récentes</h3>
                            {reservations.length === 0 ? (
                                <div className="empty-state">
                                    <p>📅 Vous n'avez aucune réservation pour le moment</p>
                                </div>
                            ) : (
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
                                    {reservations.slice(0, 5).map((reservation) => (
                                        <tr key={reservation.idReservation}>
                                            <td>#{reservation.idReservation}</td>
                                            <td>Standard - Chambre {reservation.idChambre}</td>
                                            <td>{formatDate(reservation.dateDebut)}</td>
                                            <td>{formatDate(reservation.dateFin)}</td>
                                            <td className="fw-bold">
                                                {reservation.facture ? formatMontant(reservation.facture.montantTotal) : 'N/A'}
                                            </td>
                                            <td>{getStatutBadge(reservation.statut)}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    {reservation.statut === 'CONFIRMEE' && (
                                                        <button
                                                            className="btn btn-cancel"
                                                            onClick={() => handleCancelReservation(reservation.idReservation)}
                                                        >
                                                            Annuler
                                                        </button>
                                                    )}
                                                    <button className="btn btn-view">Détails</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* Section Réservations complètes */}
                {activeMenu === "reservations" && !loading && (
                    <div className="recent-section">
                        {/* ✅ AJOUTER CE HEADER */}
                        <div className="section-header">
                            <h3 className="chart-title">Toutes mes réservations</h3>
                            <button
                                className="btn-nouvelle-reservation"
                                onClick={() => setActiveMenu("chambres")}
                            >
                                ➕ Nouvelle réservation
                            </button>
                        </div>

                        {reservations.length === 0 ? (
                            <div className="empty-state">
                                <p>📅 Vous n'avez aucune réservation</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => setActiveMenu("chambres")}
                                >
                                    Réserver une chambre
                                </button>
                            </div>
                        ) : (
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
                                {reservations.map((reservation) => (
                                    <tr key={reservation.idReservation}>
                                        <td>#{reservation.idReservation}</td>
                                        <td>Standard - Chambre {reservation.idChambre}</td>
                                        <td>{formatDate(reservation.dateDebut)}</td>
                                        <td>{formatDate(reservation.dateFin)}</td>
                                        <td className="fw-bold">
                                            {reservation.facture ? formatMontant(reservation.facture.montantTotal) : 'N/A'}
                                        </td>
                                        <td>{getStatutBadge(reservation.statut)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {reservation.statut === 'CONFIRMEE' && (
                                                    <button
                                                        className="btn btn-cancel"
                                                        onClick={() => handleCancelReservation(reservation.idReservation)}
                                                    >
                                                        Annuler
                                                    </button>
                                                )}
                                                <button className="btn btn-view">Détails</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Section Factures */}
                {activeMenu === "factures" && !loading && (
                    <div className="recent-section">
                        <h3 className="chart-title">Mes Factures</h3>
                        {factures.length === 0 ? (
                            <div className="empty-state">
                                <p>💰 Vous n'avez aucune facture</p>
                            </div>
                        ) : (
                            <table className="recent-table">
                                <thead>
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Réservation</th>
                                    <th>Date d'émission</th>
                                    <th>Montant</th>
                                    <th>État</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {factures.map((facture) => (
                                    <tr key={facture.idFacture}>
                                        <td>#{facture.idFacture}</td>
                                        <td>#{facture.idReservation}</td>
                                        <td>{formatDate(facture.dateEmission)}</td>
                                        <td className="fw-bold">{formatMontant(facture.montantTotal)}</td>
                                        <td>{getFactureStatutBadge(facture.etat)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {facture.etat === 'EMISE' && (
                                                    <button
                                                        className="btn btn-pay"
                                                        onClick={() => handlePayerFacture(facture.idFacture)}
                                                    >
                                                        Payer
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-view"
                                                    onClick={() => handleDownloadPdf(facture.idFacture)}
                                                >
                                                    Télécharger PDF
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
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
                                        <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                                            {profileLoading ? "⏳ Enregistrement..." : "💾 Enregistrer les modifications"}
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
                                        <button type="submit" className="btn btn-success" disabled={profileLoading}>
                                            {profileLoading ? "⏳ Modification..." : "🔄 Modifier le mot de passe"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
                {/* Section Chambres */}
                {activeMenu === "chambres" && <ChambresDisponibles />}
            </div>
        </div>
    );
}

export default DashboardClient;
