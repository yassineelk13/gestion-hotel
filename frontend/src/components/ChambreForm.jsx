import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { chambreAPI, auth } from '../services/api';

const ChambreForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const isAuthenticated = auth.isAuthenticated();

  const [formData, setFormData] = useState({
    numero: '',
    type: '',
    capacite_personne: '',
    nb_lits: '',
    prix_par_nuit: '',
    superficie: '',
    etage: '',
    vue: '',
    description: '',
    photo_url: '',
    statut: 'libre',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingChambre, setLoadingChambre] = useState(isEdit);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isEdit) {
      fetchChambre();
    }
  }, [id, isAuthenticated]);

  const fetchChambre = async () => {
    try {
      setLoadingChambre(true);
      const response = await chambreAPI.getById(id);
      const chambre = response.data;
      setFormData({
        numero: chambre.numero || '',
        type: chambre.type || '',
        capacite_personne: chambre.capacite_personne || '',
        nb_lits: chambre.nb_lits || '',
        prix_par_nuit: chambre.prix_par_nuit || '',
        superficie: chambre.superficie || '',
        etage: chambre.etage || '',
        vue: chambre.vue || '',
        description: chambre.description || '',
        photo_url: chambre.photo_url || '',
        statut: chambre.statut || 'libre',
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du chargement de la chambre');
      navigate('/');
    } finally {
      setLoadingChambre(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = { ...formData };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          if (key === 'numero' || key === 'prix_par_nuit') {
            // Keep required fields as empty string for validation
          } else {
            delete submitData[key];
          }
        } else if (['capacite_personne', 'nb_lits', 'etage'].includes(key)) {
          submitData[key] = parseInt(submitData[key]) || null;
        } else if (['prix_par_nuit', 'superficie'].includes(key)) {
          submitData[key] = parseFloat(submitData[key]) || null;
        }
      });

      if (isEdit) {
        await chambreAPI.update(id, submitData);
        alert('Chambre modifiée avec succès !');
      } else {
        await chambreAPI.create(submitData);
        alert('Chambre créée avec succès !');
      }
      navigate('/');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingChambre) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Modifier la Chambre' : 'Nouvelle Chambre'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Numéro - Required */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Numéro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
              maxLength={10}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.numero ? 'border-red-500' : ''
              }`}
            />
            {errors.numero && (
              <p className="text-red-500 text-xs italic mt-1">{errors.numero[0]}</p>
            )}
          </div>

          {/* Prix par nuit - Required */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Prix par nuit (MAD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="prix_par_nuit"
              value={formData.prix_par_nuit}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.prix_par_nuit ? 'border-red-500' : ''
              }`}
            />
            {errors.prix_par_nuit && (
              <p className="text-red-500 text-xs italic mt-1">{errors.prix_par_nuit[0]}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Type</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              maxLength={50}
              placeholder="Standard, Deluxe, Suite..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.type && (
              <p className="text-red-500 text-xs italic mt-1">{errors.type[0]}</p>
            )}
          </div>

          {/* Statut */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Statut</label>
            <select
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="libre">Libre</option>
              <option value="occupee">Occupée</option>
              <option value="maintenance">Maintenance</option>
              <option value="hors_service">Hors service</option>
            </select>
            {errors.statut && (
              <p className="text-red-500 text-xs italic mt-1">{errors.statut[0]}</p>
            )}
          </div>

          {/* Capacité */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Capacité (personnes)</label>
            <input
              type="number"
              name="capacite_personne"
              value={formData.capacite_personne}
              onChange={handleChange}
              min="1"
              max="10"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.capacite_personne && (
              <p className="text-red-500 text-xs italic mt-1">{errors.capacite_personne[0]}</p>
            )}
          </div>

          {/* Nombre de lits */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Nombre de lits</label>
            <input
              type="number"
              name="nb_lits"
              value={formData.nb_lits}
              onChange={handleChange}
              min="1"
              max="5"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.nb_lits && (
              <p className="text-red-500 text-xs italic mt-1">{errors.nb_lits[0]}</p>
            )}
          </div>

          {/* Superficie */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Superficie (m²)</label>
            <input
              type="number"
              name="superficie"
              value={formData.superficie}
              onChange={handleChange}
              min="0"
              max="200"
              step="0.01"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.superficie && (
              <p className="text-red-500 text-xs italic mt-1">{errors.superficie[0]}</p>
            )}
          </div>

          {/* Étage */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Étage</label>
            <input
              type="number"
              name="etage"
              value={formData.etage}
              onChange={handleChange}
              min="0"
              max="20"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.etage && (
              <p className="text-red-500 text-xs italic mt-1">{errors.etage[0]}</p>
            )}
          </div>

          {/* Vue */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Vue</label>
            <input
              type="text"
              name="vue"
              value={formData.vue}
              onChange={handleChange}
              maxLength={100}
              placeholder="Mer, Jardin, Ville..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.vue && (
              <p className="text-red-500 text-xs italic mt-1">{errors.vue[0]}</p>
            )}
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">URL de la photo</label>
            <input
              type="url"
              name="photo_url"
              value={formData.photo_url}
              onChange={handleChange}
              maxLength={255}
              placeholder="https://..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.photo_url && (
              <p className="text-red-500 text-xs italic mt-1">{errors.photo_url[0]}</p>
            )}
          </div>
        </div>

        {/* Description - Full width */}
        <div className="mt-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength={500}
            rows={4}
            placeholder="Description de la chambre..."
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          {errors.description && (
            <p className="text-red-500 text-xs italic mt-1">{errors.description[0]}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChambreForm;

