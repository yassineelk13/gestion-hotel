import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chambreAPI, auth } from '../services/api';

const ChambreList = () => {
  const [chambres, setChambres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    statut: '',
    capacite_personne: '',
    prix_min: '',
    prix_max: '',
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
  });

  const isAuthenticated = auth.isAuthenticated();

  useEffect(() => {
    fetchChambres();
  }, [filters, pagination.current_page]);

  const fetchChambres = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        per_page: pagination.per_page,
        page: pagination.current_page,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await chambreAPI.getAll(params);
      setChambres(response.data.data || []);
      setPagination({
        current_page: response.data.current_page || 1,
        per_page: response.data.per_page || 10,
        total: response.data.total || 0,
        last_page: response.data.last_page || 1,
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des chambres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      statut: '',
      capacite_personne: '',
      prix_min: '',
      prix_max: '',
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette chambre ?')) {
      return;
    }

    try {
      await chambreAPI.delete(id);
      fetchChambres();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (statut) => {
    const statusColors = {
      libre: 'bg-green-100 text-green-800',
      occupee: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      hors_service: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[statut] || 'bg-gray-100 text-gray-800'}`}>
        {statut}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Liste des Chambres</h1>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="text-lg font-semibold mb-3">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input
                type="text"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                placeholder="Standard, Deluxe..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                value={filters.statut}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tous</option>
                <option value="libre">Libre</option>
                <option value="occupee">Occupée</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacité min</label>
              <input
                type="number"
                name="capacite_personne"
                value={filters.capacite_personne}
                onChange={handleFilterChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix min</label>
              <input
                type="number"
                name="prix_min"
                value={filters.prix_min}
                onChange={handleFilterChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix max</label>
              <input
                type="number"
                name="prix_max"
                value={filters.prix_max}
                onChange={handleFilterChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Chambres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chambres.map((chambre) => (
          <div key={chambre.id_chambre} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {chambre.photo_url && (
              <img
                src={chambre.photo_url}
                alt={`Chambre ${chambre.numero}`}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900">Chambre {chambre.numero}</h3>
                {getStatusBadge(chambre.statut)}
              </div>
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Type:</span> {chambre.type || 'N/A'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div>
                  <span className="font-semibold">Capacité:</span> {chambre.capacite_personne} pers.
                </div>
                <div>
                  <span className="font-semibold">Lits:</span> {chambre.nb_lits}
                </div>
                <div>
                  <span className="font-semibold">Étage:</span> {chambre.etage}
                </div>
                <div>
                  <span className="font-semibold">Superficie:</span> {chambre.superficie} m²
                </div>
              </div>
              <p className="text-lg font-bold text-blue-600 mb-3">
                {chambre.prix_par_nuit} MAD/nuit
              </p>
              {chambre.vue && (
                <p className="text-sm text-gray-500 mb-3">
                  <span className="font-semibold">Vue:</span> {chambre.vue}
                </p>
              )}
              <div className="flex space-x-2">
                <Link
                  to={`/chambres/${chambre.id_chambre}`}
                  className="flex-1 text-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Voir détails
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to={`/chambres/${chambre.id_chambre}/edit`}
                      className="flex-1 text-center bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(chambre.id_chambre)}
                      className="flex-1 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {chambres.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucune chambre trouvée</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
            disabled={pagination.current_page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Précédent
          </button>
          <span className="px-4 py-2">
            Page {pagination.current_page} sur {pagination.last_page}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
            disabled={pagination.current_page >= pagination.last_page}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default ChambreList;

