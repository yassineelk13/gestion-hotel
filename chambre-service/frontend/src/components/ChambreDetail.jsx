import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { chambreAPI, auth } from '../services/api';

const ChambreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chambre, setChambre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const isAuthenticated = auth.isAuthenticated();

  useEffect(() => {
    fetchChambre();
  }, [id]);

  const fetchChambre = async () => {
    try {
      setLoading(true);
      const response = await chambreAPI.getById(id);
      setChambre(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de la chambre');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isAuthenticated) {
      alert('Vous devez être connecté pour modifier le statut');
      return;
    }

    if (!window.confirm(`Changer le statut à "${newStatus}" ?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await chambreAPI.updateStatus(id, newStatus);
      fetchChambre();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated) {
      alert('Vous devez être connecté pour supprimer une chambre');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette chambre ?')) {
      return;
    }

    try {
      await chambreAPI.delete(id);
      alert('Chambre supprimée avec succès');
      navigate('/');
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
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[statut] || 'bg-gray-100 text-gray-800'}`}>
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

  if (error || !chambre) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Chambre introuvable'}
        </div>
        <Link to="/" className="mt-4 inline-block text-blue-500 hover:text-blue-700">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
        ← Retour à la liste
      </Link>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {chambre.photo_url && (
          <img
            src={chambre.photo_url}
            alt={`Chambre ${chambre.numero}`}
            className="w-full h-64 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Chambre {chambre.numero}</h1>
            {getStatusBadge(chambre.statut)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations générales</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-lg text-gray-900">{chambre.type || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Prix par nuit</dt>
                  <dd className="text-lg font-bold text-blue-600">{chambre.prix_par_nuit} MAD</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Capacité</dt>
                  <dd className="text-lg text-gray-900">{chambre.capacite_personne} personne(s)</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre de lits</dt>
                  <dd className="text-lg text-gray-900">{chambre.nb_lits}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Caractéristiques</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Superficie</dt>
                  <dd className="text-lg text-gray-900">{chambre.superficie} m²</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Étage</dt>
                  <dd className="text-lg text-gray-900">{chambre.etage}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Vue</dt>
                  <dd className="text-lg text-gray-900">{chambre.vue || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Statut</dt>
                  <dd className="text-lg">{getStatusBadge(chambre.statut)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {chambre.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-gray-700">{chambre.description}</p>
            </div>
          )}

          {isAuthenticated && (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions administrateur</h2>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <Link
                  to={`/chambres/${id}/edit`}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                >
                  Modifier
                </Link>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Supprimer
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Changer le statut</h3>
                <div className="flex flex-wrap gap-2">
                  {['libre', 'occupee', 'maintenance', 'hors_service'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updatingStatus || chambre.statut === status}
                      className={`px-4 py-2 rounded font-semibold ${
                        chambre.statut === status
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChambreDetail;

