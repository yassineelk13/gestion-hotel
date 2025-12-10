import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import reservationApi from "../api/reservationApi";
import chambreApi from "../api/chambreApi";
import paiementApi from '../api/paiementApi';  // ✅ AJOUTÉ
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

function DashboardReceptionniste() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [clients, setClients] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [chambres, setChambres] = useState([]);

    const [loading, setLoading] = useState(false);
    const [reservationsLoading, setReservationsLoading] = useState(false);
    const [chambresLoading, setChambresLoading] = useState(false);

    const [filterChambre, setFilterChambre] = useState("");
    const [filterClient, setFilterClient] = useState("");
    const [filterReservation, setFilterReservation] = useState("");

    const [newReservation, setNewReservation] = useState({
        idClient: "",
        idChambre: "",
        dateArrivee: "",
        dateDepart: "",
        // ✅ NOUVEAUX CHAMPS pour client walk-in
        clientType: "existant", // ou "walk-in"
        nomClient: "",
        prenomClient: "",
        emailClient: "",
        telephoneClient: ""
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const handleClickOutside = () => setShowProfileDropdown(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const showMessage = useCallback((type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    };

    const loadClients = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/clients');
            setClients(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Erreur chargement clients:", err);
            showMessage('error', "Erreur lors du chargement des clients");
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, [showMessage]);

    const loadReservations = useCallback(async () => {
        setReservationsLoading(true);
        try {
            const response = await reservationApi.get('/reservations');
            setReservations(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Erreur chargement réservations:", err);
            showMessage('error', "Erreur lors du chargement des réservations");
            setReservations([]);
        } finally {
            setReservationsLoading(false);
        }
    }, [showMessage]);

    const loadChambres = useCallback(async () => {
        setChambresLoading(true);
        try {
            const response = await chambreApi.get('/chambres');
            let chambresData = [];
            if (response.data && response.data.success) {
                if (response.data.data && Array.isArray(response.data.data.data)) {
                    chambresData = response.data.data.data;
                } else if (Array.isArray(response.data.data)) {
                    chambresData = response.data.data;
                }
            } else if (Array.isArray(response.data)) {
                chambresData = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                chambresData = response.data.data;
            }
            setChambres(Array.isArray(chambresData) ? chambresData : []);
        } catch (err) {
            console.error("Erreur chargement chambres:", err);
            showMessage('error', "Erreur lors du chargement des chambres");
            setChambres([]);
        } finally {
            setChambresLoading(false);
        }
    }, [showMessage]);

    const handleCreateReservation = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let clientId = newReservation.idClient;

            // ✅ Si c'est un client walk-in, le créer d'abord
            if (newReservation.clientType === "walk-in") {
                console.log('👤 Création client walk-in...');

                const clientData = {
                    nom: newReservation.nomClient,
                    prenom: newReservation.prenomClient,
                    email: newReservation.emailClient || `walkin.${Date.now()}@hotel.local`, // Email temporaire
                    telephone: newReservation.telephoneClient,
                    motDePasse: "WalkIn@" + Date.now(), // Mot de passe temporaire
                    role: "CLIENT"
                };

                const clientResponse = await api.post('/auth/register', clientData);
                clientId = clientResponse.data.id || clientResponse.data.user?.id;

                console.log('✅ Client walk-in créé:', clientId);

                // Recharger la liste des clients
                await loadClients();
            }

            // Créer la réservation avec le client
            const reservationData = {
                idClient: parseInt(clientId),
                idChambre: parseInt(newReservation.idChambre),
                dateDebut: newReservation.dateArrivee,
                dateFin: newReservation.dateDepart
            };

            await reservationApi.post('/reservations', reservationData);

            showMessage('success', "✅ Réservation créée avec succès !");
            setShowReservationModal(false);
            setNewReservation({
                idClient: "",
                idChambre: "",
                dateArrivee: "",
                dateDepart: "",
                clientType: "existant",
                nomClient: "",
                prenomClient: "",
                emailClient: "",
                telephoneClient: ""
            });

            loadReservations();
            loadChambres();

        } catch (err) {
            console.error('❌ Erreur:', err);
            showMessage('error', "❌ Erreur: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };
    const handleCancelReservation = async (reservationId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;
        try {
            await reservationApi.post(`/reservations/${reservationId}/annuler`);
            showMessage('success', "✅ Réservation annulée avec succès !");
            loadReservations();
            loadChambres();
        } catch (err) {
            showMessage('error', "❌ Erreur annulation réservation");
        }
    };

    // ✅ NOUVELLE FONCTION : Encaisser paiement CASH
    const handlePayerCash = async (reservation) => {
        if (!reservation.facture) {
            showMessage('error', '❌ Aucune facture trouvée pour cette réservation');
            return;
        }

        if (reservation.facture.etat === 'PAYEE') {
            showMessage('error', '❌ Cette facture est déjà payée');
            return;
        }

        if (!window.confirm(`Confirmer l'encaissement de ${reservation.facture.montantTotal} MAD en ESPÈCES ?`)) {
            return;
        }

        setLoading(true);

        try {
            console.log('💵 Enregistrement paiement cash...', reservation);

            await paiementApi.post('/paiements/cash', {
                idFacture: reservation.facture.idFacture,
                idReservation: reservation.idReservation || reservation.id,
                montant: reservation.facture.montantTotal,
                idReceptionniste: user.user.id
            });

            showMessage('success', '✅ Paiement cash enregistré avec succès !');

            // Recharger les réservations
            await loadReservations();

        } catch (err) {
            console.error('❌ Erreur paiement cash:', err);
            showMessage('error', '❌ Erreur lors de l\'enregistrement du paiement: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReservations();
        loadClients();
        loadChambres();
    }, [loadReservations, loadClients, loadChambres]);

    const getInitials = (nom, prenom) => {
        return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatMontant = (montant) => {
        if (!montant && montant !== 0) return 'N/A';
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD'
        }).format(montant);
    };

    const getChambreStatusClass = (statut) => {
        const statutLower = (statut || '').toLowerCase();
        switch (statutLower) {
            case 'disponible':
            case 'libre':
                return 'status-confirmed';
            case 'occupee':
                return 'status-cancelled';
            case 'reservee':
                return 'status-pending';
            default:
                return 'status-pending';
        }
    };

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            return `${client.prenom || ''} ${client.nom || ''}`.trim() || `Client #${clientId}`;
        }
        return `Client #${clientId}`;
    };

    const getChambreNumero = (chambreId) => {
        const chambre = chambres.find(c => (c.id || c.id_chambre) === chambreId);
        return chambre?.numero?.toString() || `#${chambreId}`;
    };

    // ✅ NOUVELLE FONCTION : Badge statut facture
    const getFactureStatutBadge = (etat) => {
        const classes = {
            'EMISE': 'status-pending',
            'PAYEE': 'status-confirmed',
            'ANNULEE': 'status-cancelled'
        };

        const labels = {
            'EMISE': 'À payer',
            'PAYEE': 'Payée',
            'ANNULEE': 'Annulée'
        };

        return <span className={`status-badge ${classes[etat] || 'status-pending'}`}>{labels[etat] || etat}</span>;
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
                <div className="logo-hotel">
                    <div className="logo-hotel-icon">🏨</div>
                    <div className="logo-hotel-text">
                        <span className="brand">HotelMS</span>
                        <span className="tagline">Gestion Hôtelière</span>
                    </div>
                </div>
                <div className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
                     onClick={() => { setActiveMenu("dashboard"); setMobileMenuOpen(false); }}>
                    <span>📊</span>
                    <span>Tableau de bord</span>
                </div>
                <div className={`menu-item ${activeMenu === "reservations" ? "active" : ""}`}
                     onClick={() => { setActiveMenu("reservations"); setMobileMenuOpen(false); }}>
                    <span>📅</span>
                    <span>Réservations</span>
                </div>
                <div className={`menu-item ${activeMenu === "clients" ? "active" : ""}`}
                     onClick={() => { setActiveMenu("clients"); setMobileMenuOpen(false); }}>
                    <span>👥</span>
                    <span>Clients</span>
                </div>
                <div className={`menu-item ${activeMenu === "chambres" ? "active" : ""}`}
                     onClick={() => { setActiveMenu("chambres"); setMobileMenuOpen(false); }}>
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
                {/* Top Bar */}
                <div className="top-bar">
                    <h1 className="page-title">
                        {activeMenu === "dashboard" && "Tableau de bord"}
                        {activeMenu === "reservations" && "Gestion des Réservations"}
                        {activeMenu === "clients" && "Liste des Clients"}
                        {activeMenu === "chambres" && "État des Chambres"}
                    </h1>
                    <div className="user-info">
                        <div className="user-details">
                            <div>Réceptionniste: {user.user?.prenom} {user.user?.nom}</div>
                            <div>{user.user?.email}</div>
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
                                    <button className="dropdown-item" onClick={handleLogout}>
                                        🚪 Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        {message.text}
                    </div>
                )}

                {/* Modal Nouvelle Réservation */}
                {showReservationModal && (
                    <div className="modal-overlay">
                        <div className="reservation-modal" style={{maxWidth: '600px'}}>
                            <div className="modal-header-reservation">
                                <h3>➕ Nouvelle Réservation</h3>
                                <button className="modal-close-btn" onClick={() => setShowReservationModal(false)}>
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body-reservation">
                                <form onSubmit={handleCreateReservation}>

                                    {/* ✅ SÉLECTEUR TYPE CLIENT */}
                                    <div className="form-group-modal">
                                        <label>Type de client *</label>
                                        <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                                            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                                <input
                                                    type="radio"
                                                    name="clientType"
                                                    value="existant"
                                                    checked={newReservation.clientType === "existant"}
                                                    onChange={(e) => setNewReservation({...newReservation, clientType: e.target.value})}
                                                    style={{marginRight: '8px'}}
                                                />
                                                Client existant
                                            </label>
                                            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                                <input
                                                    type="radio"
                                                    name="clientType"
                                                    value="walk-in"
                                                    checked={newReservation.clientType === "walk-in"}
                                                    onChange={(e) => setNewReservation({...newReservation, clientType: e.target.value})}
                                                    style={{marginRight: '8px'}}
                                                />
                                                Client sur place (Walk-in)
                                            </label>
                                        </div>
                                    </div>

                                    {/* ✅ SI CLIENT EXISTANT */}
                                    {newReservation.clientType === "existant" && (
                                        <div className="form-group-modal">
                                            <label>Client *</label>
                                            <select
                                                className="form-input-modal"
                                                value={newReservation.idClient}
                                                onChange={e => setNewReservation({...newReservation, idClient: e.target.value})}
                                                required
                                            >
                                                <option value="">Sélectionner un client</option>
                                                {clients.map(client => (
                                                    <option key={client.id} value={client.id}>
                                                        {client.prenom} {client.nom} - {client.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* ✅ SI CLIENT WALK-IN */}
                                    {newReservation.clientType === "walk-in" && (
                                        <div className="client-walkin-section">
                                            <h4>📝 Informations du client</h4>
                                            <div className="form-group-modal">
                                                <label>Nom *</label>
                                                <input
                                                    className="form-input-modal"
                                                    type="text"
                                                    value={newReservation.nomClient}
                                                    onChange={e => setNewReservation({...newReservation, nomClient: e.target.value})}
                                                    placeholder="Ex: Alami"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group-modal">
                                                <label>Prénom *</label>
                                                <input
                                                    className="form-input-modal"
                                                    type="text"
                                                    value={newReservation.prenomClient}
                                                    onChange={e => setNewReservation({...newReservation, prenomClient: e.target.value})}
                                                    placeholder="Ex: Ahmed"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group-modal">
                                                <label>Email (optionnel)</label>
                                                <input
                                                    className="form-input-modal"
                                                    type="email"
                                                    value={newReservation.emailClient}
                                                    onChange={e => setNewReservation({...newReservation, emailClient: e.target.value})}
                                                    placeholder="Ex: ahmed.alami@email.com"
                                                />
                                            </div>
                                            <div className="form-group-modal">
                                                <label>Téléphone *</label>
                                                <input
                                                    className="form-input-modal"
                                                    type="tel"
                                                    value={newReservation.telephoneClient}
                                                    onChange={e => setNewReservation({...newReservation, telephoneClient: e.target.value})}
                                                    placeholder="Ex: 0612345678"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}


                                    {/* Chambre */}
                                    <div className="form-group-modal">
                                        <label>Chambre *</label>
                                        <select
                                            className="form-input-modal"
                                            value={newReservation.idChambre}
                                            onChange={e => setNewReservation({...newReservation, idChambre: e.target.value})}
                                            required
                                        >
                                            <option value="">Sélectionner une chambre</option>
                                            {chambres
                                                .filter(c => (c.statut || '').toLowerCase() === 'disponible' || (c.statut || '').toLowerCase() === 'libre')
                                                .map(chambre => (
                                                    <option key={chambre.id || chambre.id_chambre} value={chambre.id || chambre.id_chambre}>
                                                        Chambre {chambre.numero} - {chambre.type} - {(chambre.prix || chambre.prix_par_nuit)?.toFixed(2)} MAD
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Dates */}
                                    <div className="form-group-modal">
                                        <label>Date d'arrivée *</label>
                                        <input
                                            className="form-input-modal"
                                            type="date"
                                            value={newReservation.dateArrivee}
                                            onChange={e => setNewReservation({...newReservation, dateArrivee: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group-modal">
                                        <label>Date de départ *</label>
                                        <input
                                            className="form-input-modal"
                                            type="date"
                                            value={newReservation.dateDepart}
                                            onChange={e => setNewReservation({...newReservation, dateDepart: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="modal-actions-reservation">
                                        <button type="submit" className="btn-modal btn-confirm-modal" disabled={loading}>
                                            {loading ? "⏳ Création..." : "💾 Créer la réservation"}
                                        </button>
                                        <button type="button" className="btn-modal btn-cancel-modal" onClick={() => setShowReservationModal(false)}>
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}


                {/* Dashboard */}
                {activeMenu === "dashboard" && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{reservations?.length || 0}</h3>
                                    <p>Réservations totales</p>
                                </div>
                                <div className="stat-icon icon-purple">📅</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{clients?.length || 0}</h3>
                                    <p>Clients enregistrés</p>
                                </div>
                                <div className="stat-icon icon-green">👥</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{chambres?.filter(c => (c.statut || '').toLowerCase() === 'disponible' || (c.statut || '').toLowerCase() === 'libre').length || 0}/{chambres?.length || 0}</h3>
                                    <p>Chambres disponibles</p>
                                </div>
                                <div className="stat-icon icon-orange">🛏</div>
                            </div>
                        </div>

                        <div className="action-cards">
                            <div className="action-card" onClick={() => setShowReservationModal(true)}>
                                <div className="action-icon">➕</div>
                                <h3>Nouvelle réservation</h3>
                                <p>Créer une nouvelle réservation pour un client</p>
                                <button className="btn-action">Créer</button>
                            </div>
                            <div className="action-card" onClick={() => setActiveMenu("reservations")}>
                                <div className="action-icon">📅</div>
                                <h3>Gérer les réservations</h3>
                                <p>Consulter et gérer toutes les réservations</p>
                                <button className="btn-action">Voir</button>
                            </div>
                            <div className="action-card" onClick={() => setActiveMenu("chambres")}>
                                <div className="action-icon">🛏</div>
                                <h3>État des chambres</h3>
                                <p>Visualiser l'état de toutes les chambres</p>
                                <button className="btn-action">Consulter</button>
                            </div>
                        </div>

                        <div className="recent-section">
                            <h3 className="chart-title">Réservations récentes</h3>
                            {reservations?.length > 0 ? (
                                <table className="recent-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Client</th>
                                        <th>Chambre</th>
                                        <th>Arrivée</th>
                                        <th>Statut</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reservations.slice(0, 5).map(reservation => (
                                        <tr key={reservation.id || reservation.idReservation}>
                                            <td>#{reservation.id || reservation.idReservation}</td>
                                            <td>{getClientName(reservation.idClient)}</td>
                                            <td>Chambre {getChambreNumero(reservation.idChambre)}</td>
                                            <td>{formatDate(reservation.dateArrivee || reservation.dateDebut)}</td>
                                            <td>
                                                <span className={`status-badge status-${(reservation.statut || 'pending').toLowerCase()}`}>
                                                    {reservation.statut || 'EN ATTENTE'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="empty-state">
                                    <p>📭 Aucune réservation récente</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Section Réservations */}
                {activeMenu === "reservations" && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">Toutes les réservations</h3>
                            <button className="btn-nouvelle-reservation" onClick={() => setShowReservationModal(true)}>
                                ➕ Nouvelle réservation
                            </button>
                        </div>

                        <div className="filter-section" style={{marginBottom: '20px'}}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="🔍 Filtrer par client, chambre ou statut..."
                                value={filterReservation}
                                onChange={(e) => setFilterReservation(e.target.value)}
                                style={{maxWidth: '400px'}}
                            />
                        </div>

                        {reservationsLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Chargement...</p>
                            </div>
                        ) : reservations?.length > 0 ? (
                            <table className="recent-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Client</th>
                                    <th>Chambre</th>
                                    <th>Arrivée</th>
                                    <th>Départ</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th>Facture</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reservations
                                    .filter(reservation => {
                                        const searchTerm = filterReservation.toLowerCase();
                                        const clientName = getClientName(reservation.idClient).toLowerCase();
                                        const chambreNum = getChambreNumero(reservation.idChambre).toLowerCase();
                                        const statut = (reservation.statut || '').toLowerCase();
                                        return filterReservation === "" ||
                                            clientName.includes(searchTerm) ||
                                            chambreNum.includes(searchTerm) ||
                                            statut.includes(searchTerm);
                                    })
                                    .map(reservation => (
                                        <tr key={reservation.id || reservation.idReservation}>
                                            <td>#{reservation.id || reservation.idReservation}</td>
                                            <td><strong>{getClientName(reservation.idClient)}</strong></td>
                                            <td>Chambre {getChambreNumero(reservation.idChambre)}</td>
                                            <td>{formatDate(reservation.dateArrivee || reservation.dateDebut)}</td>
                                            <td>{formatDate(reservation.dateDepart || reservation.dateFin)}</td>
                                            <td className="fw-bold">
                                                {reservation.facture ? formatMontant(reservation.facture.montantTotal) :
                                                    (reservation.montantTotal ? formatMontant(reservation.montantTotal) : 'N/A')}
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${(reservation.statut || 'pending').toLowerCase()}`}>
                                                    {reservation.statut || 'EN ATTENTE'}
                                                </span>
                                            </td>
                                            <td>
                                                {reservation.facture ? getFactureStatutBadge(reservation.facture.etat) : <span className="text-muted">-</span>}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {/* ✅ BOUTON ENCAISSER CASH */}
                                                    {reservation.facture && reservation.facture.etat === 'EMISE' && (
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() => handlePayerCash(reservation)}
                                                            disabled={loading}
                                                        >
                                                            💵 Encaisser Cash
                                                        </button>
                                                    )}

                                                    {(reservation.statut || '').toUpperCase() === 'CONFIRMEE' && (
                                                        <button
                                                            className="btn btn-cancel"
                                                            onClick={() => handleCancelReservation(reservation.id || reservation.idReservation)}
                                                        >
                                                            Annuler
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <p>📭 Aucune réservation</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Section Clients */}
                {activeMenu === "clients" && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">Liste des clients</h3>
                        </div>

                        <div className="filter-section" style={{marginBottom: '20px'}}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="🔍 Filtrer par nom, prénom ou email..."
                                value={filterClient}
                                onChange={(e) => setFilterClient(e.target.value)}
                                style={{maxWidth: '400px'}}
                            />
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Chargement...</p>
                            </div>
                        ) : clients?.length > 0 ? (
                            <table className="recent-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Email</th>
                                    <th>Téléphone</th>
                                </tr>
                                </thead>
                                <tbody>
                                {clients
                                    .filter(client => {
                                        const searchTerm = filterClient.toLowerCase();
                                        return filterClient === "" ||
                                            (client.nom || '').toLowerCase().includes(searchTerm) ||
                                            (client.prenom || '').toLowerCase().includes(searchTerm) ||
                                            (client.email || '').toLowerCase().includes(searchTerm);
                                    })
                                    .map(client => (
                                        <tr key={client.id}>
                                            <td>#{client.id}</td>
                                            <td><strong>{client.nom}</strong></td>
                                            <td>{client.prenom}</td>
                                            <td>{client.email}</td>
                                            <td>{client.telephone || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <p>📭 Aucun client</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Section Chambres */}
                {activeMenu === "chambres" && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">État des chambres</h3>
                        </div>

                        <div className="filter-section" style={{marginBottom: '20px'}}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="🔍 Filtrer par numéro de chambre..."
                                value={filterChambre}
                                onChange={(e) => setFilterChambre(e.target.value)}
                                style={{maxWidth: '300px'}}
                            />
                        </div>

                        {chambresLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Chargement...</p>
                            </div>
                        ) : chambres?.length > 0 ? (
                            <div className="chambres-grid">
                                {chambres
                                    .filter(chambre =>
                                        filterChambre === "" ||
                                        (chambre.numero?.toString() || '').toLowerCase().includes(filterChambre.toLowerCase())
                                    )
                                    .map(chambre => (
                                        <div key={chambre.id || chambre.id_chambre} className="chambre-card-modern">
                                            <div className="chambre-header">
                                                <span className="chambre-number-large">#{chambre.numero}</span>
                                                <span className={`chambre-status-badge ${getChambreStatusClass(chambre.statut)}`}>
                                                    {(chambre.statut || 'libre').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="chambre-details">
                                                <div className="chambre-type-label">
                                                    <span className="label-icon">🛏</span>
                                                    {chambre.type}
                                                </div>
                                                <div className="chambre-price-label">
                                                    <span className="label-icon">💰</span>
                                                    {(chambre.prix || chambre.prix_par_nuit)?.toFixed(2)} MAD/nuit
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>📭 Aucune chambre</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardReceptionniste;
