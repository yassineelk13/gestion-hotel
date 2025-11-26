import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ChambresDisponibles.css";

function ChambresDisponibles() {
    const [chambres, setChambres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        capacite_personne: '',
        prix_max: 1500,
        statut: 'libre'
    });
    const [searchDates, setSearchDates] = useState({
        date_debut: '',
        date_fin: ''
    });
    const [selectedChambre, setSelectedChambre] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchChambres();
    }, [filters]);

    const fetchChambres = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (filters.type) params.append('type', filters.type);
            if (filters.capacite_personne) params.append('capacite_personne', filters.capacite_personne);
            if (filters.prix_max) params.append('prix_max', filters.prix_max);
            if (filters.statut) params.append('statut', filters.statut);

            const response = await axios.get(
                `http://localhost:8082/api/chambres?${params.toString()}`
            );

            // Adapter la structure de réponse
            if (response.data.success) {
                // Si pagination
                const data = response.data.data.data || response.data.data;
                setChambres(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des chambres:', error);
            showMessage('error', 'Impossible de charger les chambres');
        } finally {
            setLoading(false);
        }
    };

    const searchChambresDisponibles = async () => {
        if (!searchDates.date_debut || !searchDates.date_fin) {
            showMessage('error', 'Veuillez sélectionner les dates de recherche');
            return;
        }

        try {
            setLoading(true);
            const params = new URLSearchParams();

            params.append('date_debut', searchDates.date_debut);
            params.append('date_fin', searchDates.date_fin);
            if (filters.type) params.append('type', filters.type);
            if (filters.capacite_personne) params.append('capacite_personne', filters.capacite_personne);

            const response = await axios.get(
                `http://localhost:8082/api/chambres/search?${params.toString()}`
            );

            if (response.data.success) {
                setChambres(response.data.data.chambres || []);
                showMessage('success', response.data.message);
            }
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            showMessage('error', 'Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const handleReserver = (chambre) => {
        setSelectedChambre(chambre);

        // Pré-remplir les dates si recherche faite
        if (searchDates.date_debut && searchDates.date_fin) {
            // Les dates sont déjà définies
        }

        setShowModal(true);
    };

    const handleConfirmReservation = async () => {
        const dateDebut = searchDates.date_debut;
        const dateFin = searchDates.date_fin;

        if (!dateDebut || !dateFin) {
            showMessage('error', 'Veuillez sélectionner les dates');
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = user.user?.id;

            if (!userId) {
                showMessage('error', 'Vous devez être connecté pour réserver');
                return;
            }

            await axios.post(
                'http://localhost:8083/api/reservations',
                {
                    idClient: userId,
                    idChambre: selectedChambre.id_chambre,
                    dateDebut: dateDebut,
                    dateFin: dateFin
                },
                {
                    auth: {
                        username: 'admin',
                        password: 'admin123'
                    }
                }
            );

            showMessage('success', '✅ Réservation créée avec succès !');
            setShowModal(false);

            // Rafraîchir la liste
            if (searchDates.date_debut && searchDates.date_fin) {
                searchChambresDisponibles();
            } else {
                fetchChambres();
            }
        } catch (error) {
            showMessage('error', '❌ Erreur lors de la réservation: ' +
                (error.response?.data?.message || error.message));
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const formatPrix = (prix) => {
        if (!prix) return 'N/A';
        return new Intl.NumberFormat('fr-MA', {
            style: 'currency',
            currency: 'MAD'
        }).format(prix);
    };

    return (
        <div className="chambres-container">
            <h1 className="page-title">🏨 Chambres Disponibles</h1>

            {/* Message de notification */}
            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {message.text}
                </div>
            )}

            {/* Section de recherche par dates */}
            <div className="search-section">
                <h3>🔍 Rechercher par dates</h3>
                <div className="search-form">
                    <div className="search-group">
                        <label>Date d'arrivée</label>
                        <input
                            type="date"
                            value={searchDates.date_debut}
                            onChange={(e) => setSearchDates({...searchDates, date_debut: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="search-group">
                        <label>Date de départ</label>
                        <input
                            type="date"
                            value={searchDates.date_fin}
                            onChange={(e) => setSearchDates({...searchDates, date_fin: e.target.value})}
                            min={searchDates.date_debut}
                        />
                    </div>
                    <button className="btn-search" onClick={searchChambresDisponibles}>
                        Rechercher
                    </button>
                    <button className="btn-reset" onClick={() => {
                        setSearchDates({ date_debut: '', date_fin: '' });
                        fetchChambres();
                    }}>
                        Réinitialiser
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="filters-section">
                <div className="filter-group">
                    <label>Type de chambre</label>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({...filters, type: e.target.value})}
                    >
                        <option value="">Tous les types</option>
                        <option value="Standard">Standard</option>
                        <option value="Deluxe">Deluxe</option>
                        <option value="Suite Deluxe">Suite Deluxe</option>
                        <option value="Suite Premium">Suite Premium</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Capacité minimum</label>
                    <select
                        value={filters.capacite_personne}
                        onChange={(e) => setFilters({...filters, capacite_personne: e.target.value})}
                    >
                        <option value="">Tous</option>
                        <option value="1">1 personne</option>
                        <option value="2">2 personnes</option>
                        <option value="3">3 personnes</option>
                        <option value="4">4 personnes</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Prix maximum: {formatPrix(filters.prix_max)}</label>
                    <input
                        type="range"
                        min="200"
                        max="1500"
                        step="50"
                        value={filters.prix_max}
                        onChange={(e) => setFilters({...filters, prix_max: e.target.value})}
                    />
                </div>

                <div className="filter-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.statut === 'libre'}
                            onChange={(e) => setFilters({
                                ...filters,
                                statut: e.target.checked ? 'libre' : ''
                            })}
                        />
                        Disponibles uniquement
                    </label>
                </div>
            </div>

            {/* Grille de chambres */}
            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Chargement...</p>
                </div>
            ) : chambres.length === 0 ? (
                <div className="empty-state">
                    <p>😔 Aucune chambre ne correspond à vos critères</p>
                    <button className="btn-reset" onClick={fetchChambres}>
                        Voir toutes les chambres
                    </button>
                </div>
            ) : (
                <div className="chambres-grid">
                    {chambres.map((chambre) => (
                        <div key={chambre.id_chambre} className="chambre-card">
                            <div className="chambre-image">
                                <img
                                    src={chambre.photo_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'}
                                    alt={`Chambre ${chambre.numero}`}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x300?text=Chambre+' + chambre.numero;
                                    }}
                                />
                                <span className={`statut-badge ${chambre.statut}`}>
                                    {chambre.statut === 'libre' ? '✓ Disponible' : '✗ Occupée'}
                                </span>
                            </div>

                            <div className="chambre-content">
                                <h3>{chambre.type} - Chambre {chambre.numero}</h3>

                                <div className="chambre-details">
                                    <span>👥 {chambre.capacite_personne} pers.</span>
                                    <span>🛏️ {chambre.nb_lits} lit(s)</span>
                                    <span>📐 {chambre.superficie}m²</span>
                                    <span>🏢 Étage {chambre.etage}</span>
                                    {chambre.vue && <span>🌅 {chambre.vue}</span>}
                                </div>

                                <p className="chambre-description">
                                    {chambre.description || 'Chambre confortable et bien équipée'}
                                </p>

                                {chambre.nombre_nuits && chambre.prix_total && (
                                    <div className="prix-sejour">
                                        <span className="nuits">{chambre.nombre_nuits} nuit(s)</span>
                                        <span className="prix-total">{formatPrix(chambre.prix_total)}</span>
                                    </div>
                                )}

                                <div className="chambre-footer">
                                    <div className="prix">
                                        <span className="prix-montant">{formatPrix(chambre.prix_par_nuit)}</span>
                                        <span className="prix-unite">/ nuit</span>
                                    </div>

                                    <button
                                        className="btn-reserver"
                                        onClick={() => handleReserver(chambre)}
                                        disabled={chambre.statut !== 'libre'}
                                    >
                                        {chambre.statut === 'libre' ? '✨ Réserver' : 'Non disponible'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de réservation */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Réserver la chambre {selectedChambre?.numero}</h2>

                        <div className="modal-body">
                            <img
                                src={selectedChambre?.photo_url || 'https://via.placeholder.com/400x200'}
                                alt="Chambre"
                                className="modal-image"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/400x200?text=Chambre';
                                }}
                            />

                            <div className="reservation-summary">
                                <h3>{selectedChambre?.type}</h3>
                                <p><strong>Capacité:</strong> {selectedChambre?.capacite_personne} personnes</p>
                                <p><strong>Superficie:</strong> {selectedChambre?.superficie}m²</p>
                                {selectedChambre?.vue && <p><strong>Vue:</strong> {selectedChambre?.vue}</p>}
                                <p><strong>Prix par nuit:</strong> {formatPrix(selectedChambre?.prix_par_nuit)}</p>
                            </div>

                            {/* ✅ AJOUTER DES CHAMPS DE DATES MODIFIABLES */}
                            <div className="dates-selection">
                                <h3>📅 Sélectionnez vos dates</h3>

                                <div className="form-group">
                                    <label>Date d'arrivée *</label>
                                    <input
                                        type="date"
                                        value={searchDates.date_debut || ''}
                                        onChange={(e) => setSearchDates({
                                            ...searchDates,
                                            date_debut: e.target.value
                                        })}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Date de départ *</label>
                                    <input
                                        type="date"
                                        value={searchDates.date_fin || ''}
                                        onChange={(e) => setSearchDates({
                                            ...searchDates,
                                            date_fin: e.target.value
                                        })}
                                        min={searchDates.date_debut || new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                {/* Calcul automatique du nombre de nuits et prix total */}
                                {searchDates.date_debut && searchDates.date_fin && (
                                    <div className="prix-calcul">
                                        {(() => {
                                            const debut = new Date(searchDates.date_debut);
                                            const fin = new Date(searchDates.date_fin);
                                            const nuits = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
                                            const total = nuits * (selectedChambre?.prix_par_nuit || 0);

                                            return (
                                                <>
                                                    <p><strong>Durée:</strong> {nuits} nuit(s)</p>
                                                    <p className="prix-total-modal">
                                                        <strong>Prix total:</strong> {formatPrix(total)}
                                                    </p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-cancel" onClick={() => setShowModal(false)}>
                                Annuler
                            </button>
                            <button
                                className="btn btn-confirm"
                                onClick={handleConfirmReservation}
                                disabled={!searchDates.date_debut || !searchDates.date_fin}
                            >
                                Confirmer la réservation
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ChambresDisponibles;
