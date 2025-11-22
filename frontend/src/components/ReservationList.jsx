import React, { useEffect, useMemo, useState } from 'react';
import { reservationAPI } from '../services/api';

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reservationAPI.getAll();

      // Handle different possible payload shapes
      const payload =
        response?.data && Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : response?.reservations && Array.isArray(response.reservations)
              ? response.reservations
              : [];

      setReservations(payload);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Impossible de récupérer les réservations.'
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    if (!reservations.length) return [];

    const preferredOrder = [
      { key: 'id', label: 'ID' },
      { key: 'reference', label: 'Référence' },
      { key: 'client_nom', label: 'Client' },
      { key: 'client', label: 'Client' },
      { key: 'client_name', label: 'Client' },
      { key: 'email', label: 'Email' },
      { key: 'telephone', label: 'Téléphone' },
      { key: 'chambre_id', label: 'Chambre' },
      { key: 'chambre', label: 'Chambre' },
      { key: 'date_debut', label: 'Date début' },
      { key: 'date_fin', label: 'Date fin' },
      { key: 'statut', label: 'Statut' },
      { key: 'montant_total', label: 'Montant total' },
      { key: 'created_at', label: 'Créée le' },
      { key: 'updated_at', label: 'Mise à jour' },
    ];

    const reservationKeys = Object.keys(reservations[0] ?? {});
    const selected = [];

    preferredOrder.forEach((col) => {
      if (reservationKeys.includes(col.key) && !selected.find((s) => s.key === col.key)) {
        selected.push(col);
      }
    });

    // Add remaining keys for visibility
    reservationKeys.forEach((key) => {
      if (!selected.find((col) => col.key === key)) {
        selected.push({ key, label: key });
      }
    });

    return selected;
  }, [reservations]);

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">—</span>;
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Chargement des réservations...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Réservations</h1>
        <button
          onClick={fetchReservations}
          className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {lastUpdated && (
        <p className="text-sm text-gray-500 mb-4">
          Dernière mise à jour: {lastUpdated.toLocaleString()}
        </p>
      )}

      {!reservations.length && !error ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucune réservation trouvée.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation, idx) => (
                <tr key={reservation.id || reservation.reference || idx}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {renderValue(reservation[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReservationList;

