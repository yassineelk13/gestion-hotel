import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import chambreApi from "../api/chambreApi";
import reservationApi from "../api/reservationApi";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

// Banque d'images pour les chambres
const PHOTOS_CHAMBRES = [
    {
        id: 1,
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        nom: 'Suite Moderne',
        type: 'Suite'
    },
    {
        id: 2,
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
        nom: 'Chambre Standard',
        type: 'Standard'
    },
    {
        id: 3,
        url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
        nom: 'Chambre Deluxe',
        type: 'Deluxe'
    },
    {
        id: 4,
        url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        nom: 'Suite Premium',
        type: 'Suite Premium'
    },
    {
        id: 5,
        url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
        nom: 'Chambre Cosy',
        type: 'Standard'
    },
    {
        id: 6,
        url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
        nom: 'Chambre Luxe',
        type: 'Deluxe'
    },
    {
        id: 7,
        url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        nom: 'Suite Élégante',
        type: 'Suite'
    },
    {
        id: 8,
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
        nom: 'Chambre Moderne',
        type: 'Standard'
    }
];


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
    const [showEditForm, setShowEditForm] = useState(false);  // ✅ Nouveau
    const [editingChambre, setEditingChambre] = useState(null);  // ✅ Nouveau
    const [newChambre, setNewChambre] = useState({
        numero: "",
        type: "Standard",
        prix: 0,
        statut: "libre",
        photo_url: ""  // ✅ Ajouter ce champ
    });


    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Charger les statistiques
// Charger les statistiques - CORRIGER cette fonction
    const loadStats = useCallback(async () => {
        try {
            // Stats utilisateurs
            const usersRes = await api.get('/admin/users');
            const usersData = usersRes.data;

            // Stats chambres
            const chambresRes = await chambreApi.get('/chambres');
            let chambresData = [];

            if (chambresRes.data && chambresRes.data.success) {
                if (chambresRes.data.data && Array.isArray(chambresRes.data.data.data)) {
                    chambresData = chambresRes.data.data.data;
                } else if (Array.isArray(chambresRes.data.data)) {
                    chambresData = chambresRes.data.data;
                }
            } else if (Array.isArray(chambresRes.data)) {
                chambresData = chambresRes.data;
            } else if (chambresRes.data && Array.isArray(chambresRes.data.data)) {
                chambresData = chambresRes.data.data;
            }

            // Stats réservations
            const reservationsRes = await reservationApi.get('/reservations');
            const reservationsData = reservationsRes.data;

            // ✅ CALCULER LE REVENU À PARTIR DES FACTURES PAYÉES
            const facturesRes = await reservationApi.get('/factures');
            const facturesData = facturesRes.data;

            // Calculer le revenu total (seulement factures PAYÉES)
            const revenue = facturesData
                .filter(facture => facture.etat === 'PAYEE')
                .reduce((sum, facture) => sum + (facture.montantTotal || 0), 0);

            console.log('📊 Statistiques calculées:', {
                totalUsers: usersData.length,
                totalChambres: chambresData.length,
                totalReservations: reservationsData.length,
                revenue: revenue,
                facturesPayees: facturesData.filter(f => f.etat === 'PAYEE').length
            });

            setStats({
                totalUsers: usersData.length,
                totalChambres: chambresData.length,
                totalReservations: reservationsData.length,
                revenue: revenue  // ✅ Revenu des factures payées
            });

        } catch (err) {
            console.error("❌ Erreur chargement stats:", err);
            showMessage('error', "Erreur chargement stats: " + (err.response?.data?.message || err.message));
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
        console.log('🔍 Début création chambre...');
        console.log('🔍 Données actuelles:', newChambre);

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
                description: "Chambre confortable et bien équipée",
                vue: "Jardin",
                photo_url: newChambre.photo_url || PHOTOS_CHAMBRES[0].url
            };

            console.log('📤 Données à envoyer:', chambreData);

            const response = await chambreApi.post('/chambres', chambreData);

            console.log('✅ Réponse complète:', response);
            console.log('✅ Données reçues:', response.data);

            if (response.data.success) {
                console.log('✅ Succès ! Fermeture du formulaire...');
                showMessage('success', "✅ Chambre créée avec succès !");
                setShowChambreForm(false);
                setNewChambre({
                    numero: "",
                    type: "Standard",
                    prix: 0,
                    statut: "libre",
                    photo_url: ""
                });
                loadChambres();
            } else {
                throw new Error(response.data.message || "Erreur inconnue");
            }

        } catch (err) {
            console.error('❌ Erreur complète:', err);
            console.error('❌ Réponse erreur:', err.response?.data);

            let errorMessage = "Erreur création chambre: ";
            if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else if (err.response?.data?.errors) {
                const validationErrors = Object.values(err.response.data.errors).flat();
                errorMessage += validationErrors.join(', ');
            } else {
                errorMessage += err.message;
            }
            showMessage('error', errorMessage);
        } finally {
            console.log('🏁 Fin du traitement');
            setLoading(false);
        }
    };

// Ouvrir le formulaire d'édition
    const handleEditChambre = (chambre) => {
        console.log('✏️ Édition chambre:', chambre);
        setEditingChambre({
            id: chambre.id_chambre || chambre.id,
            numero: chambre.numero,
            type: chambre.type,
            prix: chambre.prix_par_nuit,
            statut: chambre.statut,
            photo_url: chambre.photo_url || '',
            capacite_personne: chambre.capacite_personne || 2,
            nb_lits: chambre.nb_lits || 1,
            superficie: chambre.superficie || 25,
            description: chambre.description || '',
            vue: chambre.vue || 'Jardin',
            etage: chambre.etage || 1
        });
        setShowEditForm(true);
    };

// Sauvegarder les modifications
    const handleUpdateChambre = async () => {
        console.log('💾 Mise à jour chambre:', editingChambre);
        setLoading(true);

        try {
            const chambreData = {
                numero: editingChambre.numero,
                type: editingChambre.type,
                prix_par_nuit: parseFloat(editingChambre.prix),
                statut: editingChambre.statut,
                capacite_personne: editingChambre.capacite_personne,
                nb_lits: editingChambre.nb_lits,
                etage: editingChambre.etage,
                superficie: parseFloat(editingChambre.superficie),
                description: editingChambre.description,
                vue: editingChambre.vue,
                photo_url: editingChambre.photo_url
            };

            console.log('📤 Données à envoyer:', chambreData);

            const response = await chambreApi.put(`/chambres/${editingChambre.id}`, chambreData);

            console.log('✅ Réponse:', response.data);

            if (response.data.success) {
                showMessage('success', "✅ Chambre modifiée avec succès !");
                setShowEditForm(false);
                setEditingChambre(null);
                loadChambres();
            }

        } catch (err) {
            console.error('❌ Erreur:', err);
            showMessage('error', "❌ Erreur modification: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };


    // Changer statut utilisateur (Activer/Désactiver)
    const toggleUserStatus = async (userId, currentStatus) => {
        const action = currentStatus ? 'désactiver' : 'activer';

        if (!window.confirm(`Voulez-vous vraiment ${action} cet utilisateur ?`)) {
            return;
        }

        try {
            await api.put(`/admin/users/${userId}/status`, {
                actif: !currentStatus
            });

            showMessage('success', `✅ Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
            loadUsers();
        } catch (err) {
            console.error('❌ Erreur changement statut:', err);
            showMessage('error', "❌ Erreur modification statut: " + (err.response?.data?.message || err.message));
        }
    };

    // Supprimer une chambre
    // Supprimer une chambre
    const deleteChambre = async (id, numero) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la chambre ${numero} ?`)) {
            return;
        }

        setLoading(true);
        try {
            console.log('🗑️ Suppression chambre ID:', id);

            const response = await chambreApi.delete(`/chambres/${id}`);
            console.log('✅ Réponse suppression:', response.data);

            showMessage('success', `✅ Chambre ${numero} supprimée avec succès`);
            loadChambres();
        } catch (err) {
            console.error('❌ Erreur suppression:', err);
            showMessage('error', "❌ Erreur suppression: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
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
                                            <option value="Suite Deluxe">Suite Deluxe</option>
                                            <option value="Suite Premium">Suite Premium</option>
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
                                            <option value="maintenance">Maintenance</option>
                                            <option value="hors_service">Hors service</option>
                                        </select>
                                    </div>
                                </div>

                                {/* ✅ SÉLECTEUR DE PHOTOS */}
                                <div className="form-group">
                                    <label>📸 Choisir une photo *</label>
                                    <div className="photo-selector">
                                        {PHOTOS_CHAMBRES.map(photo => (
                                            <div
                                                key={photo.id}
                                                className={`photo-option ${newChambre.photo_url === photo.url ? 'selected' : ''}`}
                                                onClick={() => setNewChambre({...newChambre, photo_url: photo.url})}
                                            >
                                                <img src={photo.url} alt={photo.nom} />
                                                <div className="photo-info">
                                                    <span className="photo-nom">{photo.nom}</span>
                                                    <span className="photo-type">{photo.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {!newChambre.photo_url && (
                                        <p className="warning-text">⚠️ Veuillez sélectionner une photo</p>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="submit"
                                        className="btn btn-success"
                                        disabled={loading || !newChambre.photo_url}
                                    >
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


                {/* ✅ AJOUTER LE MODAL D'ÉDITION ICI */}
                {showEditForm && editingChambre && (
                    <div className="form-overlay">
                        <div className="form-modal">
                            <div className="modal-header">
                                <h3>✏️ MODIFIER CHAMBRE #{editingChambre.numero}</h3>
                                <button className="close-btn" onClick={() => setShowEditForm(false)}>✕</button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleUpdateChambre(); }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Numéro de chambre *</label>
                                        <input
                                            className="form-control"
                                            value={editingChambre.numero}
                                            onChange={e => setEditingChambre({...editingChambre, numero: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Type *</label>
                                        <select
                                            className="form-control"
                                            value={editingChambre.type}
                                            onChange={e => setEditingChambre({...editingChambre, type: e.target.value})}
                                            required
                                        >
                                            <option value="Standard">Standard</option>
                                            <option value="Deluxe">Deluxe</option>
                                            <option value="Suite Deluxe">Suite Deluxe</option>
                                            <option value="Suite Premium">Suite Premium</option>
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
                                            value={editingChambre.prix}
                                            onChange={e => setEditingChambre({...editingChambre, prix: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Statut *</label>
                                        <select
                                            className="form-control"
                                            value={editingChambre.statut}
                                            onChange={e => setEditingChambre({...editingChambre, statut: e.target.value})}
                                            required
                                        >
                                            <option value="libre">Libre</option>
                                            <option value="occupee">Occupée</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="hors_service">Hors service</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Sélecteur de photos */}
                                <div className="form-group">
                                    <label>📸 Photo de la chambre</label>
                                    <div className="photo-selector">
                                        {PHOTOS_CHAMBRES.map(photo => (
                                            <div
                                                key={photo.id}
                                                className={`photo-option ${editingChambre.photo_url === photo.url ? 'selected' : ''}`}
                                                onClick={() => setEditingChambre({...editingChambre, photo_url: photo.url})}
                                            >
                                                <img src={photo.url} alt={photo.nom} />
                                                <div className="photo-info">
                                                    <span className="photo-nom">{photo.nom}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-success" disabled={loading}>
                                        {loading ? "⏳ Modification..." : "💾 SAUVEGARDER"}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(false)}>
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
                                        <th>Nom Complet</th>
                                        <th>Email</th>
                                        <th>Téléphone</th>
                                        <th>Rôle</th>
                                        <th>Statut</th>
                                        <th>Date d'inscription</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="user-id">#{user.id}</td>
                                            <td><strong>{user.prenom} {user.nom}</strong></td>
                                            <td>{user.email}</td>
                                            <td>{user.telephone || 'N/A'}</td>
                                            <td>
                                <span className={`status-badge ${
                                    user.role === 'ADMIN' ? 'status-cancelled' : 'status-confirmed'
                                }`}>
                                    {user.role}
                                </span>
                                            </td>
                                            <td>
                                <span className={`status-badge ${
                                    user.actif ? 'status-confirmed' : 'status-pending'
                                }`}>
                                    {user.actif ? '✓ Actif' : '✗ Inactif'}
                                </span>
                                            </td>
                                            <td>{formatDate(user.createdAt)}</td>
                                            <td>
                                                <button
                                                    className={`btn btn-sm ${user.actif ? 'btn-warning' : 'btn-success'}`}
                                                    onClick={() => toggleUserStatus(user.id, user.actif)}
                                                    title={user.actif ? 'Désactiver' : 'Activer'}
                                                >
                                                    {user.actif ? '🚫 Désactiver' : '✅ Activer'}
                                                </button>
                                            </td>
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
                                <button className="btn btn-success" onClick={() => setShowChambreForm(true)}>
                                    ➕ Créer la première chambre
                                </button>
                            </div>
                        ) : (
                            <div className="chambres-grid-admin">
                                {chambres.map(chambre => (
                                    <div key={chambre.id_chambre || chambre.id} className="chambre-card-admin">
                                        {/* Image */}
                                        <div className="chambre-image-admin">
                                            <img
                                                src={chambre.photo_url || 'https://via.placeholder.com/400x250?text=Chambre'}
                                                alt={`Chambre ${chambre.numero}`}
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/400x250?text=Chambre';
                                                }}
                                            />
                                            <div className="chambre-numero-badge">#{chambre.numero}</div>
                                            <span className={`statut-badge-admin ${getChambreStatusClass(chambre.statut)}`}>
                                {chambre.statut}
                            </span>
                                        </div>

                                        {/* Contenu */}
                                        <div className="chambre-content-admin">
                                            <h4>{chambre.type}</h4>

                                            <div className="chambre-details-admin">
                                                <div className="detail-item">
                                                    <span className="detail-icon">👥</span>
                                                    <span>{chambre.capacite_personne || 2} pers.</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-icon">🛏</span>
                                                    <span>{chambre.nb_lits || 1} lit(s)</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-icon">📐</span>
                                                    <span>{chambre.superficie || 25}m²</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-icon">🏢</span>
                                                    <span>Étage {chambre.etage || 1}</span>
                                                </div>
                                            </div>

                                            {chambre.vue && (
                                                <div className="chambre-vue">
                                                    <span>🌳</span> {chambre.vue}
                                                </div>
                                            )}

                                            <div className="chambre-prix-admin">
                                                <span className="prix-montant">{chambre.prix_par_nuit} MAD</span>
                                                <span className="prix-unite">/ nuit</span>
                                            </div>

                                            {/* Actions */}
                                            <div className="chambre-actions">
                                                <button
                                                    className="btn btn-warning btn-sm"
                                                    onClick={() => handleEditChambre(chambre)}
                                                    title="Modifier"
                                                >
                                                    ✏️ Modifier
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => deleteChambre(chambre.id_chambre || chambre.id, chambre.numero)}
                                                    title="Supprimer"
                                                >
                                                    🗑️ Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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