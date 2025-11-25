import React, { useEffect, useMemo, useState } from 'react';
import { userAPI } from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getAll();

      // Handle different possible payload shapes
      const payload =
        response?.data && Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : response?.users && Array.isArray(response.users)
              ? response.users
              : [];

      setUsers(payload);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Impossible de récupérer les utilisateurs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    if (!users.length) return [];

    const preferredOrder = [
      { key: 'id', label: 'ID' },
      { key: 'email', label: 'Email' },
      { key: 'username', label: 'Nom d\'utilisateur' },
      { key: 'name', label: 'Nom' },
      { key: 'role', label: 'Rôle' },
      { key: 'status', label: 'Statut' },
      { key: 'created_at', label: 'Créé le' },
      { key: 'updated_at', label: 'Modifié le' },
    ];

    // Get all unique keys from all users
    const allKeys = new Set();
    users.forEach((user) => {
      Object.keys(user).forEach((key) => allKeys.add(key));
    });

    // Build columns: preferred first, then others
    const ordered = preferredOrder
      .filter((col) => allKeys.has(col.key))
      .map((col) => col.key);
    const others = Array.from(allKeys).filter((key) => !ordered.includes(key));

    return [
      ...preferredOrder.filter((col) => allKeys.has(col.key)),
      ...others.map((key) => ({
        key,
        label: key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      })),
    ];
  }, [users]);

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleString('fr-FR');
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Chargement des utilisateurs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Erreur</p>
          <p>{error}</p>
        </div>
        <button
          onClick={fetchUsers}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Liste des Utilisateurs</h1>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
            </span>
          )}
          <button
            onClick={fetchUsers}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Actualiser
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <tr key={user.id || index} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {formatValue(user[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500">
            Total: {users.length} utilisateur(s)
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;

