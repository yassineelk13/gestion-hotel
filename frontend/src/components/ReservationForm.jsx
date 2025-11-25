import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chambreAPI, userAPI, reservationAPI } from '../services/api';

const ReservationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    client_id: '',
    chambre_id: '',
    date_debut: '',
    date_fin: '',
    nombre_personnes: '',
    remarques: '',
  });

  const [chambres, setChambres] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedChambre, setSelectedChambre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});
  const [montantTotal, setMontantTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateMontant();
  }, [formData.date_debut, formData.date_fin, selectedChambre]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch available chambres (libre status)
      const chambresResponse = await chambreAPI.getAll({ statut: 'libre' });
      const chambresData = chambresResponse?.data?.data || chambresResponse?.data || [];
      // Double filter to ensure only libre chambres are shown
      const libreChambres = Array.isArray(chambresData) 
        ? chambresData.filter(chambre => chambre.statut === 'libre')
        : [];
      setChambres(libreChambres);

      // Fetch clients from users API
      const clientsResponse = await userAPI.getClients();
      const clientsData = clientsResponse?.data || [];
      const clientsArray = Array.isArray(clientsData) ? clientsData : [];
      setClients(clientsArray);
      
      // Log clients for debugging
      console.log('Fetched clients:', clientsArray);
      console.log('Client IDs:', clientsArray.map(c => ({ id: c.id, user_id: c.user_id, email: c.email })));
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoadingData(false);
    }
  };

  const calculateMontant = () => {
    if (!formData.date_debut || !formData.date_fin || !selectedChambre) {
      setMontantTotal(0);
      return;
    }

    const dateDebut = new Date(formData.date_debut);
    const dateFin = new Date(formData.date_fin);

    if (dateFin <= dateDebut) {
      setMontantTotal(0);
      return;
    }

    const diffTime = Math.abs(dateFin - dateDebut);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const prixParNuit = selectedChambre.prix_par_nuit || 0;
    const total = diffDays * prixParNuit;

    setMontantTotal(total);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update selected chambre when chambre_id changes
    if (name === 'chambre_id') {
      const chambre = chambres.find(c => c.id_chambre === value || c.id === value);
      setSelectedChambre(chambre || null);
      
      // Refresh chambre status from API to ensure it's up to date
      if (value) {
        chambreAPI.getById(value)
          .then(response => {
            const currentChambre = response?.data || response;
            if (currentChambre) {
              setSelectedChambre(currentChambre);
              // If chambre is no longer libre, remove it from available list
              if (currentChambre.statut !== 'libre') {
                setChambres(prev => prev.filter(c => (c.id_chambre || c.id) !== value));
                setErrors(prev => ({
                  ...prev,
                  chambre_id: `Cette chambre n'est plus disponible. Statut: ${currentChambre.statut}`
                }));
              }
            }
          })
          .catch(err => {
            console.error('Error refreshing chambre status:', err);
          });
      }
    }

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

    // Validation
    const newErrors = {};
    if (!formData.client_id) newErrors.client_id = 'Le client est requis';
    if (!formData.chambre_id) newErrors.chambre_id = 'La chambre est requise';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.date_fin) newErrors.date_fin = 'La date de fin est requise';

    // Validate chambre is still available and libre
    if (formData.chambre_id) {
      try {
        const chambreId = formData.chambre_id;
        const chambreResponse = await chambreAPI.getById(chambreId);
        const currentChambre = chambreResponse?.data || chambreResponse;
        
        if (!currentChambre) {
          newErrors.chambre_id = 'Chambre introuvable';
        } else if (currentChambre.statut !== 'libre') {
          newErrors.chambre_id = `Cette chambre n'est pas disponible. Statut actuel: ${currentChambre.statut}`;
          // Remove from available chambres list
          setChambres(prev => prev.filter(c => (c.id_chambre || c.id) !== chambreId));
        } else {
          // Validate capacity
          if (formData.nombre_personnes) {
            const nombrePersonnes = parseInt(formData.nombre_personnes);
            if (nombrePersonnes > currentChambre.capacite_personne) {
              newErrors.nombre_personnes = `Le nombre de personnes (${nombrePersonnes}) dépasse la capacité de la chambre (${currentChambre.capacite_personne})`;
            }
          }
        }
      } catch (err) {
        console.error('Error checking chambre status:', err);
        newErrors.chambre_id = 'Erreur lors de la vérification de la chambre';
      }
    }

    if (formData.date_debut && formData.date_fin) {
      const dateDebut = new Date(formData.date_debut);
      const dateFin = new Date(formData.date_fin);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateDebut < today) {
        newErrors.date_debut = 'La date de début doit être aujourd\'hui ou ultérieure';
      }
      if (dateFin <= dateDebut) {
        newErrors.date_fin = 'La date de fin doit être postérieure à la date de début';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Client verification is not needed - we already have the client data from getClients()
      // The getById call was causing 403 errors because RECEPTIONNISTE role doesn't have admin access

      // Verify client exists before submitting
      const selectedClient = clients.find(c => {
        const clientId = String(c.id || c.user_id || '');
        const formClientId = String(formData.client_id || '');
        return clientId === formClientId;
      });
      
      if (!selectedClient) {
        setErrors({ client_id: 'Client sélectionné introuvable. Veuillez recharger la page.' });
        setLoading(false);
        return;
      }

      // Get the actual client ID - try different possible fields
      const actualClientId = selectedClient.id || selectedClient.user_id || selectedClient.client_id || formData.client_id;
      
      // Try to convert ID to number, but keep as string if conversion fails
      let clientIdToSend = actualClientId;
      if (actualClientId && !isNaN(actualClientId)) {
        clientIdToSend = parseInt(actualClientId, 10);
      }
      
      // Prepare reservation data - API expects camelCase field names
      // Send only the required fields first, then add additional info if needed
      const reservationData = {
        idClient: clientIdToSend,
        idChambre: Number(formData.chambre_id) || formData.chambre_id,
        dateDebut: formData.date_debut,
        dateFin: formData.date_fin,
        nombrePersonnes: formData.nombre_personnes ? parseInt(formData.nombre_personnes) : null,
        montantTotal: montantTotal,
        remarques: formData.remarques || null,
      };

      console.log('Selected client:', selectedClient);
      console.log('Client ID fields:', { 
        id: selectedClient.id, 
        user_id: selectedClient.user_id, 
        client_id: selectedClient.client_id,
        actualClientId: actualClientId 
      });

      // Try to ensure chambre exists in reservation service
      // The reservation service has its own database, so we need to create the chambre if it doesn't exist
      let reservationChambreId = Number(formData.chambre_id) || formData.chambre_id;
      
      if (selectedChambre) {
        try {
          // First, try to find the chambre by ID
          let reservationChambre = null;
          try {
            const foundChambre = await reservationAPI.getOrFindChambre({
              id: selectedChambre.id_chambre || selectedChambre.id,
              numero: selectedChambre.numero,
            });
            reservationChambre = foundChambre;
          } catch (findErr) {
            console.log('Chambre not found in reservation service, will try to create it');
          }
          
          // If chambre not found, try to create it
          if (!reservationChambre) {
            console.log('Creating chambre in reservation service:', {
              id: selectedChambre.id_chambre || selectedChambre.id,
              numero: selectedChambre.numero,
            });
            
            try {
              const createdChambre = await reservationAPI.createChambre({
                id_chambre: selectedChambre.id_chambre || selectedChambre.id,
                id: selectedChambre.id_chambre || selectedChambre.id,
                numero: selectedChambre.numero,
                type: selectedChambre.type,
                prix_par_nuit: selectedChambre.prix_par_nuit,
                capacite_personne: selectedChambre.capacite_personne,
                nb_lits: selectedChambre.nb_lits,
                superficie: selectedChambre.superficie,
                etage: selectedChambre.etage,
                vue: selectedChambre.vue,
                description: selectedChambre.description,
                statut: 'libre',
              });
              
              if (createdChambre?.data?.id || createdChambre?.id || createdChambre?.data?.id_chambre || createdChambre?.id_chambre) {
                reservationChambreId = createdChambre?.data?.id || createdChambre?.id || createdChambre?.data?.id_chambre || createdChambre?.id_chambre;
                console.log('Chambre created in reservation service with ID:', reservationChambreId);
              }
            } catch (createErr) {
              console.error('Could not create chambre in reservation service:', createErr);
              // Continue with original ID - maybe the API will accept it
            }
          } else {
            // Chambre found, use its ID
            if (reservationChambre?.data?.id || reservationChambre?.id || reservationChambre?.data?.id_chambre || reservationChambre?.id_chambre) {
              reservationChambreId = reservationChambre?.data?.id || reservationChambre?.id || reservationChambre?.data?.id_chambre || reservationChambre?.id_chambre;
              console.log('Chambre found in reservation service with ID:', reservationChambreId);
            }
          }
        } catch (chambreErr) {
          console.warn('Error handling chambre in reservation service:', chambreErr);
          // Continue with original ID
        }
      }
      
      // Update reservation data with the correct chambre ID
      reservationData.idChambre = reservationChambreId;
      
      // Log what we're sending
      console.log('Sending reservation request:', {
        idClient: reservationData.idClient,
        idChambre: reservationData.idChambre,
        chambreNumero: selectedChambre?.numero,
        dateDebut: reservationData.dateDebut,
        dateFin: reservationData.dateFin,
      });
      
      console.log('Sending reservation data:', reservationData);
      console.log('Reservation API Base URL:', import.meta.env.VITE_SERVICE_RESERVATIONS_URL || 'http://192.168.100.46:8083/api');
      
      const response = await reservationAPI.create(reservationData);
      console.log('Reservation created successfully:', response);
      
      // Update chambre status to "occupee" after successful reservation
      try {
        const chambreId = formData.chambre_id;
        await chambreAPI.updateStatus(chambreId, 'occupee');
        console.log('Chambre status updated to occupee');
        
        // Remove the reserved chambre from available list
        setChambres(prev => prev.filter(c => (c.id_chambre || c.id) !== chambreId));
      } catch (statusError) {
        console.error('Error updating chambre status:', statusError);
        // Still show success for reservation, but warn about status update
        alert('Réservation créée avec succès, mais erreur lors de la mise à jour du statut de la chambre. Veuillez la mettre à jour manuellement.');
      }
      
      alert('Réservation créée avec succès ! La chambre a été marquée comme occupée.');
      navigate('/reservations');
    } catch (err) {
      console.error('Reservation creation error:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors || {};
        setErrors(validationErrors);
        // Show validation errors
        const errorMessages = Object.values(validationErrors).flat().join('\n');
        alert(`Erreurs de validation:\n${errorMessages}`);
      } else if (err.response?.data) {
        const errorMessage = err.response.data.message || 
                           err.response.data.error || 
                           JSON.stringify(err.response.data);
        
        // Check for specific error types
        if (err.response?.status === 403) {
          setErrors({ 
            submit: 'Accès refusé (403). Vous n\'avez pas les permissions nécessaires pour créer une réservation. Veuillez vérifier vos identifiants ou contacter l\'administrateur.',
          });
          alert(`Erreur 403 - Accès refusé\n\nVous n'avez pas les permissions nécessaires pour créer une réservation.\n\nVeuillez:\n1. Vérifier que vous utilisez les bons identifiants\n2. Contacter l'administrateur pour obtenir les permissions nécessaires\n3. Vérifier si un token JWT est requis pour créer des réservations`);
        } else if (errorMessage.includes('Client') && (errorMessage.includes('introuvable') || errorMessage.includes('not found'))) {
          const clientIdMatch = errorMessage.match(/ID (\d+)/);
          const clientId = clientIdMatch ? clientIdMatch[1] : formData.client_id;
          setErrors({ 
            client_id: `Le client avec l'ID ${clientId} n'existe pas dans le service de réservations. Le service de réservations a sa propre base de données de clients. Veuillez contacter l'administrateur pour synchroniser les clients.`,
            submit: errorMessage 
          });
          alert(`Erreur: Le client sélectionné n'existe pas dans le service de réservations.\n\nLe service de réservations utilise sa propre base de données de clients, différente du service utilisateurs.\n\nClient ID envoyé: ${formData.client_id}\n\nVeuillez contacter l'administrateur pour synchroniser les clients entre les services.`);
        } else {
          setErrors({ submit: errorMessage });
          alert(`Erreur: ${errorMessage}`);
        }
      } else {
        const errorMessage = err.message || 'Erreur lors de la création de la réservation';
        alert(`Erreur: ${errorMessage}`);
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nouvelle Réservation</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {errors.submit && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Erreur</p>
            <p>{errors.submit}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.client_id ? 'border-red-500' : ''
              }`}
            >
              <option value="">Sélectionner un client</option>
              {clients.map((client) => (
                <option key={client.id || client.user_id} value={client.id || client.user_id}>
                  {client.prenom || client.nom || client.name || client.username || ''} {client.nom || client.name || ''} ({client.email})
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-red-500 text-xs italic mt-1">{errors.client_id}</p>
            )}
            {clients.length === 0 && (
              <p className="text-yellow-600 text-xs italic mt-1">
                Aucun client trouvé. Assurez-vous que des utilisateurs avec le rôle CLIENT existent.
              </p>
            )}
          </div>

          {/* Chambre Selection */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Chambre <span className="text-red-500">*</span>
            </label>
            <select
              name="chambre_id"
              value={formData.chambre_id}
              onChange={handleChange}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.chambre_id ? 'border-red-500' : ''
              }`}
            >
              <option value="">Sélectionner une chambre</option>
              {chambres
                .filter(chambre => chambre.statut === 'libre')
                .map((chambre) => (
                  <option key={chambre.id_chambre || chambre.id} value={chambre.id_chambre || chambre.id}>
                    Chambre {chambre.numero} - {chambre.type || 'Standard'} - {chambre.prix_par_nuit} MAD/nuit
                  </option>
                ))}
            </select>
            {errors.chambre_id && (
              <p className="text-red-500 text-xs italic mt-1">{errors.chambre_id}</p>
            )}
            {selectedChambre && (
              <div className="mt-2 p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  <strong>Statut:</strong> <span className={`font-semibold ${
                    selectedChambre.statut === 'libre' ? 'text-green-600' : 'text-red-600'
                  }`}>{selectedChambre.statut}</span> | 
                  <strong> Capacité:</strong> {selectedChambre.capacite_personne} personne(s) | 
                  <strong> Lits:</strong> {selectedChambre.nb_lits} | 
                  <strong> Superficie:</strong> {selectedChambre.superficie} m²
                </p>
                {selectedChambre.statut !== 'libre' && (
                  <p className="text-red-600 text-xs italic mt-1">
                    ⚠️ Cette chambre n'est pas disponible pour réservation
                  </p>
                )}
              </div>
            )}
            {chambres.length === 0 && (
              <p className="text-yellow-600 text-xs italic mt-1">
                Aucune chambre disponible. Toutes les chambres sont occupées ou en maintenance.
              </p>
            )}
          </div>

          {/* Date début */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.date_debut ? 'border-red-500' : ''
              }`}
            />
            {errors.date_debut && (
              <p className="text-red-500 text-xs italic mt-1">{errors.date_debut}</p>
            )}
          </div>

          {/* Date fin */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date de fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
              required
              min={formData.date_debut || new Date().toISOString().split('T')[0]}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.date_fin ? 'border-red-500' : ''
              }`}
            />
            {errors.date_fin && (
              <p className="text-red-500 text-xs italic mt-1">{errors.date_fin}</p>
            )}
          </div>

          {/* Nombre de personnes */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nombre de personnes
            </label>
            <input
              type="number"
              name="nombre_personnes"
              value={formData.nombre_personnes}
              onChange={handleChange}
              min="1"
              max={selectedChambre?.capacite_personne || 10}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.nombre_personnes ? 'border-red-500' : ''
              }`}
            />
            {errors.nombre_personnes && (
              <p className="text-red-500 text-xs italic mt-1">{errors.nombre_personnes}</p>
            )}
            {selectedChambre && (
              <p className="text-gray-500 text-xs italic mt-1">
                Capacité maximale: {selectedChambre.capacite_personne} personne(s)
              </p>
            )}
          </div>

          {/* Montant total (read-only) */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Montant total
            </label>
            <input
              type="text"
              value={montantTotal > 0 ? `${montantTotal.toFixed(2)} MAD` : 'Calcul automatique'}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight"
            />
            {montantTotal > 0 && selectedChambre && (
              <p className="text-gray-500 text-xs italic mt-1">
                {Math.ceil((new Date(formData.date_fin) - new Date(formData.date_debut)) / (1000 * 60 * 60 * 24))} nuit(s) × {selectedChambre.prix_par_nuit} MAD
              </p>
            )}
          </div>

          {/* Remarques */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Remarques
            </label>
            <textarea
              name="remarques"
              value={formData.remarques}
              onChange={handleChange}
              rows={4}
              placeholder="Remarques ou demandes spéciales..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/reservations')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || chambres.length === 0 || clients.length === 0 || (selectedChambre && selectedChambre.statut !== 'libre')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer la réservation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;

