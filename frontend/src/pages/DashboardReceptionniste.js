import React, { useState, useEffect } from "react";
import api from "../api";
import reservationApi from "../api/reservationApi";
import chambreApi from "../api/chambreApi";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

function DashboardReceptionniste() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showReservationForm, setShowReservationForm] = useState(false);
    const [showChambreForm, setShowChambreForm] = useState(false);
    const [clients, setClients] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [chambres, setChambres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reservationsLoading, setReservationsLoading] = useState(false);
    const [chambresLoading, setChambresLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        nom: user.user?.nom || "",
        prenom: user.user?.prenom || "",
        email: user.user?.email || "",
        motDePasse: ""
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [newReservation, setNewReservation] = useState({
        idClient: "",
        idChambre: "",
        dateArrivee: "",
        dateDepart: "",
        montantTotal: 0,
        statut: "EN_ATTENTE"
    });
    const [newChambre, setNewChambre] = useState({
        numero: "",
        type: "SIMPLE",
        prix: 0,
        statut: "DISPONIBLE"
    });
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fermer le dropdown quand on clique ailleurs
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

    // Charger les clients
    const loadClients = async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/clients');
            setClients(response.data);
        } catch (err) {
            console.error("Erreur détaillée chargement clients:", err);
            showMessage('error', "Erreur lors du chargement des clients: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Charger les réservations
    const loadReservations = async () => {
        setReservationsLoading(true);
        try {
            const response = await reservationApi.get('/reservations');
            setReservations(response.data);
        } catch (err) {
            console.error("Erreur chargement réservations:", err);
            showMessage('error', "Erreur lors du chargement des réservations: " + (err.response?.data?.message || err.message));
        } finally {
            setReservationsLoading(false);
        }
    };

    // Charger les chambres - CORRIGÉ
    // Dans DashboardReceptionniste.js - VERSION CORRIGÉE
    const loadChambres = async () => {
        setChambresLoading(true);
        try {
            const response = await chambreApi.get('/chambres');
            console.log('📊 Réponse API chambres complète:', response);
            console.log('📊 Données brutes:', response.data);

            let chambresData = [];

            // Gérer la structure de réponse Laravel paginée
            if (response.data && response.data.success) {
                // Structure: {success: true, data: {data: [...], current_page: 1, ...}}
                if (response.data.data && Array.isArray(response.data.data.data)) {
                    chambresData = response.data.data.data;
                } else if (Array.isArray(response.data.data)) {
                    chambresData = response.data.data;
                }
            } else if (Array.isArray(response.data)) {
                // Structure directe: [...]
                chambresData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                // Structure paginée standard: {data: [...], current_page: 1, ...}
                chambresData = response.data.data;
            } else {
                console.warn('❌ Format de réponse inattendu:', response.data);
                chambresData = [];
            }

            console.log('✅ Chambres extraites:', chambresData);
            setChambres(chambresData);

            if (chambresData.length > 0) {
                showMessage('success', `✅ ${chambresData.length} chambre(s) chargée(s)`);
            } else {
                showMessage('info', 'ℹ️ Aucune chambre trouvée');
            }

        } catch (err) {
            console.error("❌ Erreur détaillée chargement chambres:", err);
            showMessage('error', "Erreur lors du chargement des chambres: " + (err.response?.data?.message || err.message));
            setChambres([]);
        } finally {
            setChambresLoading(false);
        }
    };
    // Créer une nouvelle réservation
    const handleCreateReservation = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const reservationData = {
                ...newReservation,
                idClient: parseInt(newReservation.idClient),
                idChambre: parseInt(newReservation.idChambre),
                montantTotal: parseFloat(newReservation.montantTotal)
            };

            await reservationApi.post('/reservations', reservationData);
            showMessage('success', "✅ Réservation créée avec succès !");
            setShowReservationForm(false);
            setNewReservation({
                idClient: "",
                idChambre: "",
                dateArrivee: "",
                dateDepart: "",
                montantTotal: 0,
                statut: "EN_ATTENTE"
            });
            loadReservations();
        } catch (err) {
            showMessage('error', "❌ Erreur création réservation: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Créer une nouvelle chambre
    const handleCreateChambre = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const chambreData = {
                ...newChambre,
                prix: parseFloat(newChambre.prix)
            };

            await chambreApi.post('/chambres', chambreData);
            showMessage('success', "✅ Chambre créée avec succès !");
            setShowChambreForm(false);
            setNewChambre({
                numero: "",
                type: "SIMPLE",
                prix: 0,
                statut: "DISPONIBLE"
            });
            loadChambres();
        } catch (err) {
            showMessage('error', "❌ Erreur création chambre: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Supprimer une chambre
    const handleDeleteChambre = async (chambreId) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette chambre ?")) {
            try {
                await chambreApi.delete(`/chambres/${chambreId}`);
                showMessage('success', "✅ Chambre supprimée avec succès !");
                loadChambres();
            } catch (err) {
                showMessage('error', "❌ Erreur suppression chambre: " + (err.response?.data?.message || err.message));
            }
        }
    };

    // Modifier une chambre
    const handleUpdateChambre = async (chambreId, updatedData) => {
        try {
            await chambreApi.put(`/chambres/${chambreId}`, updatedData);
            showMessage('success', "✅ Chambre modifiée avec succès !");
            loadChambres();
        } catch (err) {
            showMessage('error', "❌ Erreur modification chambre: " + (err.response?.data?.message || err.message));
        }
    };

    // Changer le statut d'une chambre
    const handleChangeChambreStatus = async (chambreId, nouveauStatut) => {
        try {
            await chambreApi.put(`/chambres/${chambreId}/statut`, {
                statut: nouveauStatut
            });
            showMessage('success', "✅ Statut de la chambre modifié avec succès !");
            loadChambres();
        } catch (err) {
            showMessage('error', "❌ Erreur modification statut: " + (err.response?.data?.message || err.message));
        }
    };

    // Annuler une réservation
    const handleCancelReservation = async (reservationId) => {
        try {
            await reservationApi.post(`/reservations/${reservationId}/annuler`);
            showMessage('success', "✅ Réservation annulée avec succès !");
            loadReservations();
        } catch (err) {
            showMessage('error', "❌ Erreur annulation réservation: " + (err.response?.data?.message || err.message));
        }
    };

    // Confirmer une réservation
    const handleConfirmReservation = async (reservationId) => {
        try {
            await reservationApi.put(`/reservations/${reservationId}`, {
                ...reservations.find(r => r.id === reservationId),
                statut: "CONFIRMEE"
            });
            showMessage('success', "✅ Réservation confirmée avec succès !");
            loadReservations();
        } catch (err) {
            showMessage('error', "❌ Erreur confirmation réservation: " + (err.response?.data?.message || err.message));
        }
    };

    // Test de connexion aux services
    const testServicesConnection = async () => {
        try {
            await reservationApi.get('/reservations');
            console.log('✅ Connexion au service réservation réussie');
        } catch (error) {
            console.error('❌ Erreur connexion service réservation:', error);
        }

        try {
            const response = await chambreApi.get('/chambres');
            console.log('✅ Connexion au service chambre réussie:', response.data);
        } catch (error) {
            console.error('❌ Erreur connexion service chambre:', error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/auth/me', {
                nom: profileData.nom,
                prenom: profileData.prenom,
                email: profileData.email,
                motDePasse: profileData.motDePasse || undefined
            });

            showMessage('success', "Profil modifié avec succès !");
            setShowProfileForm(false);

            // Mettre à jour le localStorage
            const updatedUser = {
                ...user,
                user: {
                    ...user.user,
                    ...response.data
                }
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            window.location.reload();

        } catch (err) {
            showMessage('error', "Erreur lors de la modification du profil: " + (err.response?.data || err.message));
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                showMessage('error', "Les nouveaux mots de passe ne correspondent pas");
                return;
            }

            if (!passwordData.currentPassword) {
                showMessage('error', "Le mot de passe actuel est requis");
                return;
            }

            await api.put("/auth/change-password", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            showMessage('success', "Mot de passe modifié avec succès !");
            setShowChangePassword(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            showMessage('error', "Erreur: " + (err.response?.data || "Erreur lors de la modification du mot de passe"));
        } finally {
            setLoading(false);
        }
    };

    // Charger les données selon le menu actif
    useEffect(() => {
        if (activeMenu === "clients") {
            loadClients();
        } else if (activeMenu === "reservations") {
            loadReservations();
        } else if (activeMenu === "chambres") {
            loadChambres();
        }
    }, [activeMenu]);

    // Tester la connexion au démarrage
    useEffect(() => {
        testServicesConnection();
    }, []);

    const getInitials = (nom, prenom) => {
        return ((nom?.[0] || '') + (prenom?.[0] || '')).toUpperCase();
    };

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    // Fonction pour obtenir la classe CSS du statut de la chambre
    const getChambreStatusClass = (statut) => {
        switch (statut) {
            case 'DISPONIBLE':
            case 'libre':
                return 'status-confirmed';
            case 'OCCUPEE':
            case 'occupee':
                return 'status-cancelled';
            case 'RESERVEE':
            case 'reservee':
                return 'status-pending';
            case 'MAINTENANCE':
            case 'maintenance':
                return 'status-maintenance';
            case 'HORS_SERVICE':
            case 'hors_service':
                return 'status-cancelled';
            default:
                return 'status-pending';
        }
    };

    // Fonction pour obtenir le libellé du type de chambre
    const getTypeChambreLabel = (type) => {
        switch (type) {
            case 'SIMPLE': return 'Simple';
            case 'DOUBLE': return 'Double';
            case 'SUITE': return 'Suite';
            case 'DELUXE': return 'Deluxe';
            default: return type;
        }
    };

    // Fonction pour obtenir le libellé du statut
    const getStatusLabel = (statut) => {
        switch (statut) {
            case 'libre': return 'DISPONIBLE';
            case 'occupee': return 'OCCUPEE';
            case 'reservee': return 'RESERVEE';
            case 'maintenance': return 'MAINTENANCE';
            case 'hors_service': return 'HORS SERVICE';
            default: return statut;
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="logo">🏨 HotelMS</div>
                <div className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`} onClick={() => setActiveMenu("dashboard")}>
                    <span>📊</span>
                    <span>Tableau de bord</span>
                </div>
                <div className={`menu-item ${activeMenu === "reservations" ? "active" : ""}`} onClick={() => setActiveMenu("reservations")}>
                    <span>📅</span>
                    <span>Réservations</span>
                </div>
                <div className={`menu-item ${activeMenu === "clients" ? "active" : ""}`} onClick={() => setActiveMenu("clients")}>
                    <span>👥</span>
                    <span>Clients</span>
                </div>
                <div className={`menu-item ${activeMenu === "chambres" ? "active" : ""}`} onClick={() => setActiveMenu("chambres")}>
                    <span>🛏</span>
                    <span>Chambres</span>
                </div>
                <div className="menu-item logout-item" onClick={handleLogout}>
                    <span>🚪</span>
                    <span>Déconnexion</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-bar">
                    <h1 className="page-title">
                        {activeMenu === "dashboard" && "Tableau de bord Réceptionniste"}
                        {activeMenu === "clients" && "Gestion des Clients"}
                        {activeMenu === "reservations" && "Gestion des Réservations"}
                        {activeMenu === "chambres" && "Gestion des Chambres"}
                    </h1>
                    <div className="user-info">
                        <div className="user-details">
                            <div style={{fontWeight: 600}}>{user.user?.prenom || "Réceptionniste"} {user.user?.nom || ""}</div>
                            <div style={{fontSize: "0.85em", color: "#666"}}>{user.user?.email || "reception@hotelms.com"}</div>
                        </div>
                        <div className="avatar-dropdown">
                            <div
                                className="avatar"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowProfileDropdown(!showProfileDropdown);
                                }}
                            >
                                {getInitials(user.user?.nom, user.user?.prenom) || "RE"}
                            </div>
                            {showProfileDropdown && (
                                <div className="dropdown-menu">
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowProfileForm(true);
                                            setShowProfileDropdown(false);
                                        }}
                                    >
                                        👤 Mon Profil
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            setShowChangePassword(true);
                                            setShowProfileDropdown(false);
                                        }}
                                    >
                                        🔒 Changer mot de passe
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
                        {message.type === 'success' ? '✅' : '❌'} {message.text}
                    </div>
                )}

                {/* Formulaire de profil */}
                {showProfileForm && (
                    <div className="form-overlay">
                        <div className="form-modal">
                            <div className="modal-header">
                                <h3>MODIFIER MON PROFIL</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowProfileForm(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleProfileUpdate}>
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
                                <div className="form-group">
                                    <label>Nouveau mot de passe</label>
                                    <input
                                        className="form-control"
                                        type="password"
                                        placeholder="Laissez vide pour ne pas modifier"
                                        value={profileData.motDePasse}
                                        onChange={e => setProfileData({...profileData, motDePasse: e.target.value})}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-success">ENREGISTRER</button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowProfileForm(false)}
                                    >
                                        ANNULER
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Popup Changement de Mot de Passe */}
                {showChangePassword && (
                    <div className="form-overlay">
                        <div className="form-modal">
                            <div className="modal-header">
                                <h3>CHANGER LE MOT DE PASSE</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => {
                                        setShowChangePassword(false);
                                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleChangePassword}>
                                <div className="form-group">
                                    <label>Mot de passe actuel *</label>
                                    <input
                                        className="form-control"
                                        placeholder="Mot de passe actuel"
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Nouveau mot de passe *</label>
                                    <input
                                        className="form-control"
                                        placeholder="Nouveau mot de passe"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        required
                                    />
                                    <div className="password-requirements">
                                        Le mot de passe doit contenir au moins 6 caractères
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Confirmer le nouveau mot de passe *</label>
                                    <input
                                        className="form-control"
                                        placeholder="Confirmer le mot de passe"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-success">
                                        MODIFIER LE MOT DE PASSE
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                        }}
                                    >
                                        ANNULER
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Formulaire de nouvelle réservation */}
                {showReservationForm && (
                    <div className="form-overlay">
                        <div className="form-modal">
                            <div className="modal-header">
                                <h3>NOUVELLE RÉSERVATION</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowReservationForm(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleCreateReservation}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>ID Client *</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={newReservation.idClient}
                                            onChange={e => setNewReservation({...newReservation, idClient: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ID Chambre *</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={newReservation.idChambre}
                                            onChange={e => setNewReservation({...newReservation, idChambre: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Date d'arrivée *</label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            value={newReservation.dateArrivee}
                                            onChange={e => setNewReservation({...newReservation, dateArrivee: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date de départ *</label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            value={newReservation.dateDepart}
                                            onChange={e => setNewReservation({...newReservation, dateDepart: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Montant total *</label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        step="0.01"
                                        value={newReservation.montantTotal}
                                        onChange={e => setNewReservation({...newReservation, montantTotal: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select
                                        className="form-control"
                                        value={newReservation.statut}
                                        onChange={e => setNewReservation({...newReservation, statut: e.target.value})}
                                    >
                                        <option value="EN_ATTENTE">En attente</option>
                                        <option value="CONFIRMEE">Confirmée</option>
                                        <option value="ANNULEE">Annulée</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-success" disabled={loading}>
                                        {loading ? "⏳ Création..." : "💾 CRÉER RÉSERVATION"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowReservationForm(false)}
                                    >
                                        ANNULER
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Formulaire de nouvelle chambre */}
                {showChambreForm && (
                    <div className="form-overlay">
                        <div className="form-modal">
                            <div className="modal-header">
                                <h3>NOUVELLE CHAMBRE</h3>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowChambreForm(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleCreateChambre}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Numéro de chambre *</label>
                                        <input
                                            className="form-control"
                                            value={newChambre.numero}
                                            onChange={e => setNewChambre({...newChambre, numero: e.target.value})}
                                            required
                                            placeholder="Ex: 101, 202..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Type *</label>
                                        <select
                                            className="form-control"
                                            value={newChambre.type}
                                            onChange={e => setNewChambre({...newChambre, type: e.target.value})}
                                            required
                                        >
                                            <option value="SIMPLE">Simple</option>
                                            <option value="DOUBLE">Double</option>
                                            <option value="SUITE">Suite</option>
                                            <option value="DELUXE">Deluxe</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Prix par nuit (MAD) *</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            step="0.01"
                                            value={newChambre.prix}
                                            onChange={e => setNewChambre({...newChambre, prix: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Statut *</label>
                                        <select
                                            className="form-control"
                                            value={newChambre.statut}
                                            onChange={e => setNewChambre({...newChambre, statut: e.target.value})}
                                            required
                                        >
                                            <option value="DISPONIBLE">Disponible</option>
                                            <option value="OCCUPEE">Occupée</option>
                                            <option value="RESERVEE">Réservée</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-success" disabled={loading}>
                                        {loading ? "⏳ Création..." : "💾 CRÉER CHAMBRE"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowChambreForm(false)}
                                    >
                                        ANNULER
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Section Réservations */}
                {activeMenu === "reservations" && !showProfileForm && !showChangePassword && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">Gestion des Réservations</h3>
                            <div className="section-actions">
                                <button className="btn btn-primary" onClick={loadReservations}>
                                    🔄 Actualiser
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={() => setShowReservationForm(true)}
                                >
                                    ➕ Nouvelle Réservation
                                </button>
                            </div>
                        </div>

                        {reservationsLoading ? (
                            <div className="loading-center">
                                <div className="spinner"></div>
                                <p>Chargement des réservations...</p>
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📅</div>
                                <p>Aucune réservation trouvée</p>
                                <button className="btn btn-primary" onClick={loadReservations}>
                                    Réessayer
                                </button>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="recent-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Client ID</th>
                                        <th>Chambre ID</th>
                                        <th>Date Arrivée</th>
                                        <th>Date Départ</th>
                                        <th>Statut</th>
                                        <th>Montant</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reservations.map(reservation => (
                                        <tr key={reservation.id}>
                                            <td className="user-id">#{reservation.id}</td>
                                            <td>{reservation.idClient}</td>
                                            <td>{reservation.idChambre}</td>
                                            <td>{formatDate(reservation.dateArrivee)}</td>
                                            <td>{formatDate(reservation.dateDepart)}</td>
                                            <td>
                                                <span className={`status-badge ${
                                                    reservation.statut === 'CONFIRMEE' ? 'status-confirmed' :
                                                        reservation.statut === 'ANNULEE' ? 'status-cancelled' :
                                                            'status-pending'
                                                }`}>
                                                    {reservation.statut}
                                                </span>
                                            </td>
                                            <td>{reservation.montantTotal} MAD</td>
                                            <td>
                                                <div className="action-buttons">
                                                    {reservation.statut === 'EN_ATTENTE' && (
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() => handleConfirmReservation(reservation.id)}
                                                        >
                                                            ✅ Confirmer
                                                        </button>
                                                    )}
                                                    {reservation.statut !== 'ANNULEE' && (
                                                        <button
                                                            className="btn btn-warning"
                                                            onClick={() => handleCancelReservation(reservation.id)}
                                                        >
                                                            🚫 Annuler
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Section Clients */}
                {activeMenu === "clients" && !showProfileForm && !showChangePassword && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">Liste des Clients</h3>
                            <button className="btn btn-primary" onClick={loadClients}>
                                🔄 Actualiser
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-center">
                                <div className="spinner"></div>
                                <p>Chargement des clients...</p>
                            </div>
                        ) : clients.length === 0 ? (
                            <div className="empty-state">
                                <p>Aucun client trouvé</p>
                                <button className="btn btn-primary" onClick={loadClients}>
                                    Réessayer
                                </button>
                            </div>
                        ) : (
                            <table className="recent-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                </tr>
                                </thead>
                                <tbody>
                                {clients.map(client => (
                                    <tr key={client.id}>
                                        <td>#{client.id}</td>
                                        <td>{client.nom}</td>
                                        <td>{client.prenom}</td>
                                        <td>{client.email}</td>
                                        <td>{client.role}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Section Chambres */}
                {activeMenu === "chambres" && !showProfileForm && !showChangePassword && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">Gestion des Chambres</h3>
                            <div className="section-actions">
                                <button className="btn btn-primary" onClick={loadChambres}>
                                    🔄 Actualiser
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={() => setShowChambreForm(true)}
                                >
                                    ➕ Nouvelle Chambre
                                </button>
                            </div>
                        </div>

                        {chambresLoading ? (
                            <div className="loading-center">
                                <div className="spinner"></div>
                                <p>Chargement des chambres...</p>
                            </div>
                        ) : !Array.isArray(chambres) || chambres.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🛏</div>
                                <p>Aucune chambre trouvée</p>
                                <button className="btn btn-primary" onClick={loadChambres}>
                                    Réessayer
                                </button>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="recent-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Numéro</th>
                                        <th>Type</th>
                                        <th>Prix (MAD)</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {chambres.map(chambre => (
                                        <tr key={chambre.id || chambre.id_chambre}>
                                            <td className="user-id">#{chambre.id || chambre.id_chambre}</td>
                                            <td>{chambre.numero}</td>
                                            <td>{getTypeChambreLabel(chambre.type)}</td>
                                            <td>{chambre.prix || chambre.prix_par_nuit} MAD</td>
                                            <td>
                                                <span className={`status-badge ${getChambreStatusClass(chambre.statut)}`}>
                                                    {getStatusLabel(chambre.statut)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn btn-warning"
                                                        onClick={() => {
                                                            const nouveauStatut = (chambre.statut === 'DISPONIBLE' || chambre.statut === 'libre') ? 'maintenance' : 'libre';
                                                            handleChangeChambreStatus(chambre.id || chambre.id_chambre, nouveauStatut);
                                                        }}
                                                    >
                                                        {(chambre.statut === 'DISPONIBLE' || chambre.statut === 'libre') ? '🔧 Maintenance' : '✅ Disponible'}
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDeleteChambre(chambre.id || chambre.id_chambre)}
                                                    >
                                                        🗑️ Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Dashboard principal */}
                {!showProfileForm && !showChangePassword && activeMenu === "dashboard" && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{reservations.filter(r => r.statut === 'CONFIRMEE').length}</h3>
                                    <p>Réservations confirmées</p>
                                </div>
                                <div className="stat-icon icon-purple">📅</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{reservations.filter(r => r.statut === 'EN_ATTENTE').length}</h3>
                                    <p>Réservations en attente</p>
                                </div>
                                <div className="stat-icon icon-orange">⏳</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{clients.length}</h3>
                                    <p>Clients inscrits</p>
                                </div>
                                <div className="stat-icon icon-green">👥</div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{Array.isArray(chambres) ? chambres.length : 0}</h3>
                                    <p>Chambres totales</p>
                                </div>
                                <div className="stat-icon icon-blue">🛏</div>
                            </div>
                        </div>

                        {/* Réservations récentes */}
                        <div className="recent-section">
                            <h3 className="chart-title">Réservations Récentes</h3>
                            {reservations.length === 0 ? (
                                <div className="empty-state">
                                    <p>Aucune réservation pour le moment</p>
                                </div>
                            ) : (
                                <table className="recent-table">
                                    <thead>
                                    <tr>
                                        <th>Référence</th>
                                        <th>Client ID</th>
                                        <th>Chambre ID</th>
                                        <th>Dates</th>
                                        <th>Statut</th>
                                        <th>Montant</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reservations.slice(0, 5).map(reservation => (
                                        <tr key={reservation.id}>
                                            <td>#RES-{reservation.id.toString().padStart(3, '0')}</td>
                                            <td>{reservation.idClient}</td>
                                            <td>{reservation.idChambre}</td>
                                            <td>
                                                {formatDate(reservation.dateArrivee)} - {formatDate(reservation.dateDepart)}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${
                                                    reservation.statut === 'CONFIRMEE' ? 'status-confirmed' :
                                                        reservation.statut === 'ANNULEE' ? 'status-cancelled' :
                                                            'status-pending'
                                                }`}>
                                                    {reservation.statut}
                                                </span>
                                            </td>
                                            <td>{reservation.montantTotal} MAD</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Chambres récentes */}
                        <div className="recent-section">
                            <h3 className="chart-title">Chambres Disponibles</h3>
                            {!Array.isArray(chambres) || chambres.filter(c => c.statut === 'DISPONIBLE' || c.statut === 'libre').length === 0 ? (
                                <div className="empty-state">
                                    <p>Aucune chambre disponible</p>
                                </div>
                            ) : (
                                <table className="recent-table">
                                    <thead>
                                    <tr>
                                        <th>Numéro</th>
                                        <th>Type</th>
                                        <th>Prix (MAD)</th>
                                        <th>Statut</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {chambres
                                        .filter(c => c.statut === 'DISPONIBLE' || c.statut === 'libre')
                                        .slice(0, 5)
                                        .map(chambre => (
                                            <tr key={chambre.id || chambre.id_chambre}>
                                                <td>{chambre.numero}</td>
                                                <td>{getTypeChambreLabel(chambre.type)}</td>
                                                <td>{chambre.prix || chambre.prix_par_nuit} MAD</td>
                                                <td>
                                                <span className="status-badge status-confirmed">
                                                    {getStatusLabel(chambre.statut)}
                                                </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default DashboardReceptionniste;