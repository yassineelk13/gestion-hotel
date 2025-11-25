import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import chambreApi from "../api/chambreApi";
import reservationApi from "../api/reservationApi";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

function DashboardAdmin() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalChambres: 0,
        totalReservations: 0,
        revenue: 0
    });
    const [users, setUsers] = useState([]);
    const [chambres, setChambres] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chambresLoading, setChambresLoading] = useState(false); // Ajouté
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showChambreForm, setShowChambreForm] = useState(false); // Ajouté
    const [newChambre, setNewChambre] = useState({ // Ajouté
        numero: "",
        type: "Standard",
        prix: 0,
        statut: "libre"
    });

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Charger les statistiques
// Charger les statistiques - CORRIGER cette fonction
    const loadStats = useCallback(async () => {
        try {
            // Stats utilisateurs - utiliser /auth/clients au lieu de /auth/users
            const usersRes = await api.get('/auth/clients');
            const usersData = usersRes.data;

            // Stats chambres
            const chambresRes = await chambreApi.get('/chambres');
            let chambresData = [];

            // Correction de la structure de données
            if (chambresRes.data && chambresRes.data.success) {
                if (chambresRes.data.data && Array.isArray(chambresRes.data.data.data)) {
                    chambresData = chambresRes.data.data.data;
                } else if (Array.isArray(chambresRes.data.data)) {
                    chambresData = chambresRes.data.data;
                } else if (Array.isArray(chambresRes.data)) {
                    chambresData = chambresRes.data;
                }
            } else if (Array.isArray(chambresRes.data)) {
                chambresData = chambresRes.data;
            } else if (chambresRes.data && Array.isArray(chambresRes.data.data)) {
                chambresData = chambresRes.data.data;
            }

            // Stats réservations
            const reservationsRes = await reservationApi.get('/reservations');
            const reservationsData = reservationsRes.data;

            setStats({
                totalUsers: usersData.length,
                totalChambres: chambresData.length,
                totalReservations: reservationsData.length,
                revenue: reservationsData.reduce((sum, res) => sum + (res.montantTotal || 0), 0)
            });
        } catch (err) {
            console.error("Erreur chargement stats:", err);
        }
    }, []);

// REMPLACER cette fonction dans DashboardAdmin.js
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            // Utiliser le endpoint admin correct
            const response = await api.get('/admin/users');
            console.log('📊 Données utilisateurs (Admin):', response.data);
            setUsers(response.data);
        } catch (err) {
            console.error('❌ Erreur détaillée:', err.response?.data);
            showMessage('error', "Erreur chargement utilisateurs: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    // Charger les chambres - CORRIGÉ
    // Charger les chambres - VERSION COMPLÈTEMENT CORRIGÉE
    const loadChambres = useCallback(async () => {
        setChambresLoading(true);
        try {
            const response = await chambreApi.get('/chambres');
            console.log('📊 Réponse API chambres complète (Admin):', response);
            console.log('📊 Données brutes (Admin):', response.data);

            let chambresData = [];

            // Gérer TOUTES les structures de réponse possibles
            if (response.data) {
                // Structure Laravel avec success: true
                if (response.data.success && response.data.data) {
                    // Structure paginée: {success: true, data: {data: [...], current_page: 1, ...}}
                    if (response.data.data.data && Array.isArray(response.data.data.data)) {
                        chambresData = response.data.data.data;
                    }
                    // Structure directe dans data: {success: true, data: [...]}
                    else if (Array.isArray(response.data.data)) {
                        chambresData = response.data.data;
                    }
                }
                // Structure directe: [...]
                else if (Array.isArray(response.data)) {
                    chambresData = response.data;
                }
                // Structure paginée standard: {data: [...], current_page: 1, ...}
                else if (response.data.data && Array.isArray(response.data.data)) {
                    chambresData = response.data.data;
                }
                // Structure dans data.data: {data: {data: [...], ...}}
                else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
                    chambresData = response.data.data.data;
                }
            }

            console.log('✅ Chambres extraites (Admin):', chambresData);
            setChambres(chambresData);

            if (chambresData.length > 0) {
                showMessage('success', `✅ ${chambresData.length} chambre(s) chargée(s)`);
            } else {
                showMessage('info', 'ℹ️ Aucune chambre trouvée');
            }

        } catch (err) {
            console.error("❌ Erreur détaillée chargement chambres:", err);
            let errorMessage = "Erreur lors du chargement des chambres: ";
            if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else {
                errorMessage += err.message;
            }
            showMessage('error', errorMessage);
            setChambres([]);
        } finally {
            setChambresLoading(false);
        }
    }, []);

    // Charger les réservations
    const loadReservations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await reservationApi.get('/reservations');
            setReservations(response.data);
        } catch (err) {
            showMessage('error', "Erreur chargement réservations: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    // Créer une nouvelle chambre - FONCTION AJOUTÉE
    // Créer une nouvelle chambre - VERSION CORRIGÉE
    const handleCreateChambre = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const chambreData = {
                numero: newChambre.numero,
                type: newChambre.type,
                prix_par_nuit: parseFloat(newChambre.prix),
                statut: newChambre.statut,
                capacite_personne: 2,
                nb_lits: 1,
                etage: 1,
                superficie: 25.0,
                description: "Chambre confortable",
                vue: "Jardin"
            };

            console.log('📤 Données envoyées:', chambreData);

            const response = await chambreApi.post('/chambres', chambreData);
            console.log('✅ Réponse création chambre:', response.data);

            // Vérifier la structure de réponse
            if (response.data.success) {
                showMessage('success', "✅ Chambre créée avec succès !");
                setShowChambreForm(false);
                setNewChambre({
                    numero: "",
                    type: "Standard",
                    prix: 0,
                    statut: "libre"
                });
                loadChambres();
            } else {
                throw new Error(response.data.message || "Erreur inconnue");
            }

        } catch (err) {
            console.error('❌ Erreur détaillée création chambre:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.response?.data?.message
            });

            let errorMessage = "Erreur création chambre: ";
            if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else if (err.response?.data?.errors) {
                // Gérer les erreurs de validation Laravel
                const validationErrors = Object.values(err.response.data.errors).flat();
                errorMessage += validationErrors.join(', ');
            } else {
                errorMessage += err.message;
            }

            showMessage('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };
    // Supprimer une chambre
    const deleteChambre = async (id) => {
        if (!window.confirm("Supprimer cette chambre ?")) return;
        try {
            await chambreApi.delete(`/chambres/${id}`);
            showMessage('success', "Chambre supprimée avec succès");
            loadChambres();
        } catch (err) {
            showMessage('error', "Erreur suppression: " + (err.response?.data?.message || err.message));
        }
    };

    // Changer statut utilisateur
    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/auth/users/${userId}/status`, {
                actif: !currentStatus
            });
            showMessage('success', "Statut utilisateur modifié");
            loadUsers();
        } catch (err) {
            showMessage('error', "Erreur modification statut: " + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => {
        loadStats();

        if (activeMenu === "utilisateurs") {
            loadUsers();
        } else if (activeMenu === "chambres") {
            loadChambres();
        } else if (activeMenu === "reservations") {
            loadReservations();
        }
    }, [activeMenu, loadStats, loadUsers, loadChambres, loadReservations]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    // Fonction pour obtenir la classe CSS du statut
    const getChambreStatusClass = (statut) => {
        switch (statut) {
            case 'libre':
                return 'status-confirmed';
            case 'occupee':
                return 'status-pending';
            case 'maintenance':
            case 'hors_service':
                return 'status-cancelled';
            default:
                return 'status-pending';
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="logo">🏨 Admin HotelMS</div>
                <div className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
                     onClick={() => setActiveMenu("dashboard")}>
                    <span>📊</span>
                    <span>Tableau de bord</span>
                </div>
                <div className={`menu-item ${activeMenu === "utilisateurs" ? "active" : ""}`}
                     onClick={() => setActiveMenu("utilisateurs")}>
                    <span>👥</span>
                    <span>Utilisateurs</span>
                </div>
                <div className={`menu-item ${activeMenu === "chambres" ? "active" : ""}`}
                     onClick={() => setActiveMenu("chambres")}>
                    <span>🛏</span>
                    <span>Chambres</span>
                </div>
                <div className={`menu-item ${activeMenu === "reservations" ? "active" : ""}`}
                     onClick={() => setActiveMenu("reservations")}>
                    <span>📅</span>
                    <span>Réservations</span>
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
                        {activeMenu === "dashboard" && "Tableau de bord Admin"}
                        {activeMenu === "utilisateurs" && "Gestion des Utilisateurs"}
                        {activeMenu === "chambres" && "Gestion des Chambres"}
                        {activeMenu === "reservations" && "Gestion des Réservations"}
                    </h1>
                    <div className="user-info">
                        <span>Admin: {user.user?.prenom} {user.user?.nom}</span>
                    </div>
                </div>

                {/* Messages */}
                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        {message.text}
                    </div>
                )}

                {/* Formulaire de nouvelle chambre - AJOUTÉ */}
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
                                            <option value="Standard">Standard</option>
                                            <option value="Deluxe">Deluxe</option>
                                            <option value="Suite">Suite</option>
                                            <option value="Familiale">Familiale</option>
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
                                            <option value="libre">Libre</option>
                                            <option value="occupee">Occupée</option>
                                            <option value="reservee">Réservée</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="hors_service">Hors service</option>
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

                {/* Dashboard Stats */}
                {activeMenu === "dashboard" && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.totalUsers}</h3>
                                    <p>Utilisateurs</p>
                                </div>
                                <div className="stat-icon icon-blue">👥</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.totalChambres}</h3>
                                    <p>Chambres</p>
                                </div>
                                <div className="stat-icon icon-green">🛏</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.totalReservations}</h3>
                                    <p>Réservations</p>
                                </div>
                                <div className="stat-icon icon-purple">📅</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <h3>{stats.revenue} MAD</h3>
                                    <p>Revenu Total</p>
                                </div>
                                <div className="stat-icon icon-orange">💰</div>
                            </div>
                        </div>

                        <div className="recent-section">
                            <h3>Actions Rapides</h3>
                            <div className="quick-actions">
                                <button className="btn btn-primary" onClick={() => setActiveMenu("utilisateurs")}>
                                    👥 Gérer les utilisateurs
                                </button>
                                <button className="btn btn-success" onClick={() => setShowChambreForm(true)}>
                                    ➕ Ajouter une chambre
                                </button>
                                <button className="btn btn-info" onClick={() => setActiveMenu("reservations")}>
                                    📅 Voir les réservations
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Gestion des Utilisateurs */}
                {/* Gestion des Utilisateurs - REMPLACER cette section */}
                {activeMenu === "utilisateurs" && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">Liste des Utilisateurs</h3>
                            <button className="btn btn-primary" onClick={loadUsers}>
                                🔄 Actualiser
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-center">
                                <div className="spinner"></div>
                                <p>Chargement des utilisateurs...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">👥</div>
                                <p>Aucun utilisateur trouvé</p>
                                <button className="btn btn-primary" onClick={loadUsers}>
                                    Réessayer
                                </button>
                            </div>
                        ) : (
                            <div className="table-container">
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
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="user-id">#{user.id}</td>
                                            <td>{user.nom}</td>
                                            <td>{user.prenom}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Gestion des Chambres */}
                {activeMenu === "chambres" && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3 className="chart-title">Gestion des Chambres</h3>
                            <div className="section-actions">
                                <button className="btn btn-primary" onClick={loadChambres}>
                                    🔄 Actualiser
                                </button>
                                <button className="btn btn-success" onClick={() => setShowChambreForm(true)}>
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
                                        <th>Prix/Nuit</th>
                                        <th>Statut</th>
                                        <th>Capacité</th>
                                        <th>Lits</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {chambres.map(chambre => (
                                        <tr key={chambre.id_chambre || chambre.id}>
                                            <td className="user-id">#{chambre.id_chambre || chambre.id}</td>
                                            <td><strong>{chambre.numero}</strong></td>
                                            <td>{chambre.type}</td>
                                            <td>{chambre.prix_par_nuit} MAD</td>
                                            <td>
                                                <span className={`status-badge ${getChambreStatusClass(chambre.statut)}`}>
                                                    {chambre.statut}
                                                </span>
                                            </td>
                                            <td>{chambre.capacite_personne || 'N/A'}</td>
                                            <td>{chambre.nb_lits || 'N/A'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={() => {/* Modifier */}}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => deleteChambre(chambre.id_chambre || chambre.id)}
                                                    >
                                                        🗑️
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

                {/* Gestion des Réservations */}
                {activeMenu === "reservations" && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h3>Gestion des Réservations</h3>
                            <button className="btn btn-primary" onClick={loadReservations}>
                                🔄 Actualiser
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-center">
                                <div className="spinner"></div>
                                <p>Chargement des réservations...</p>
                            </div>
                        ) : (
                            <table className="recent-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Client</th>
                                    <th>Chambre</th>
                                    <th>Dates</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reservations.map(reservation => (
                                    <tr key={reservation.id}>
                                        <td>#{reservation.id}</td>
                                        <td>Client #{reservation.idClient}</td>
                                        <td>Chambre #{reservation.idChambre}</td>
                                        <td>
                                            {formatDate(reservation.dateArrivee)} - {formatDate(reservation.dateDepart)}
                                        </td>
                                        <td>{reservation.montantTotal} MAD</td>
                                        <td>
                                                <span className={`status-badge ${
                                                    reservation.statut === 'CONFIRMEE' ? 'status-confirmed' :
                                                        reservation.statut === 'ANNULEE' ? 'status-cancelled' : 'status-pending'
                                                }`}>
                                                    {reservation.statut}
                                                </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardAdmin;