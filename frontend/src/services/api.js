import axios from 'axios';

// Use relative URL in development (Vite proxy) or full URL in production
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:8082/api';
const RESERVATIONS_API_BASE_URL =
  import.meta.env.VITE_SERVICE_RESERVATIONS_URL || 'http://192.168.100.18:8083/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token
      localStorage.removeItem('jwt_token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API methods for Authentication
export const authAPI = {
  // Login with email and password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Refresh token
  refresh: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// API methods for Chambres
export const chambreAPI = {
  // Get all chambres with optional filters
  getAll: async (filters = {}) => {
    const response = await api.get('/chambres', { params: filters });
    return response.data;
  },

  // Get a single chambre by ID
  getById: async (id) => {
    const response = await api.get(`/chambres/${id}`);
    return response.data;
  },

  // Get chambre by numero
  getByNumero: async (numero) => {
    const response = await api.get(`/chambres/numero/${numero}`);
    return response.data;
  },

  // Search available chambres
  search: async (searchParams = {}) => {
    const response = await api.get('/chambres/search', { params: searchParams });
    return response.data;
  },

  // Create a new chambre (requires JWT + Admin)
  create: async (chambreData) => {
    const response = await api.post('/chambres', chambreData);
    return response.data;
  },

  // Update a chambre (requires JWT + Admin)
  update: async (id, chambreData) => {
    const response = await api.put(`/chambres/${id}`, chambreData);
    return response.data;
  },

  // Delete a chambre (requires JWT + Admin)
  delete: async (id) => {
    const response = await api.delete(`/chambres/${id}`);
    return response.data;
  },

  // Update chambre status (requires JWT + Admin)
  updateStatus: async (id, statut) => {
    const response = await api.put(`/chambres/${id}/statut`, { statut });
    return response.data;
  },

  // Get statistics (requires JWT + Admin)
  getStats: async () => {
    const response = await api.get('/chambres/stats/all');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// API methods for Reservations (remote service)
const RESERVATIONS_API_USERNAME =
  import.meta.env.VITE_RESERVATIONS_API_USERNAME ||
  localStorage.getItem('reservations_username') ||
  'admin';
const RESERVATIONS_API_PASSWORD =
  import.meta.env.VITE_RESERVATIONS_API_PASSWORD ||
  localStorage.getItem('reservations_password') ||
  'admin123';
const RESERVATIONS_API_TOKEN =
  import.meta.env.VITE_RESERVATIONS_API_TOKEN ||
  localStorage.getItem('reservations_api_token') ||
  null;

const reservationsApi = axios.create({
  baseURL: RESERVATIONS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

reservationsApi.interceptors.request.use(
  (config) => {
    // Use Basic Auth for all requests
    const username =
      localStorage.getItem('reservations_username') || RESERVATIONS_API_USERNAME;
    const password =
      localStorage.getItem('reservations_password') || RESERVATIONS_API_PASSWORD;
    if (username && password) {
      const basicToken = typeof btoa === 'function'
        ? btoa(`${username}:${password}`)
        : Buffer.from(`${username}:${password}`).toString('base64');
      config.headers.Authorization = `Basic ${basicToken}`;
      
      // Debug logging
      console.log('Reservations API Request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        username: username,
        hasPassword: !!password,
        authHeader: `Basic ${basicToken.substring(0, 20)}...`
      });
    } else {
      console.warn('No credentials for Reservations API');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

reservationsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Réservations API non autorisée (401).', error.response?.data);
    } else if (error.response?.status === 403) {
      console.error('Réservations API - Accès refusé (403).', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
      });
    }
    return Promise.reject(error);
  }
);

export const reservationAPI = {
  getAll: async () => {
    const response = await reservationsApi.get('/reservations');
    return response.data;
  },
  create: async (reservationData) => {
    const response = await reservationsApi.post('/reservations', reservationData);
    return response.data;
  },
  // Try to get or create a client in the reservation service
  getOrCreateClient: async (clientData) => {
    try {
      // Try to get client by email first
      const response = await reservationsApi.get(`/clients/email/${encodeURIComponent(clientData.email)}`);
      return response.data;
    } catch (err) {
      // If client doesn't exist, try to create it
      if (err.response?.status === 404 || err.response?.status === 400) {
        try {
          const createResponse = await reservationsApi.post('/clients', {
            email: clientData.email,
            nom: clientData.nom || clientData.name,
            prenom: clientData.prenom || clientData.firstName,
            telephone: clientData.telephone || null,
          });
          return createResponse.data;
        } catch (createErr) {
          console.error('Error creating client in reservation service:', createErr);
          // If creation fails, return null - the reservation API might handle it automatically
          return null;
        }
      }
      // For other errors, return null and let the reservation creation handle it
      return null;
    }
  },
  // Try to get or find a chambre in the reservation service
  getOrFindChambre: async (chambreData) => {
    try {
      // Try to get chambre by numero first
      if (chambreData.numero) {
        const response = await reservationsApi.get(`/chambres/numero/${chambreData.numero}`);
        return response.data;
      }
      // If no numero, try by ID
      if (chambreData.id) {
        const response = await reservationsApi.get(`/chambres/${chambreData.id}`);
        return response.data;
      }
      return null;
    } catch (err) {
      console.warn('Chambre not found in reservation service:', err.response?.status);
      // Return null - the reservation API might handle it automatically
      return null;
    }
  },
  // Try to create a chambre in the reservation service
  createChambre: async (chambreData) => {
    try {
      const createResponse = await reservationsApi.post('/chambres', {
        id: chambreData.id || chambreData.id_chambre,
        numero: chambreData.numero,
        type: chambreData.type,
        prixParNuit: chambreData.prix_par_nuit || chambreData.prixParNuit,
        capacitePersonne: chambreData.capacite_personne || chambreData.capacitePersonne,
        nbLits: chambreData.nb_lits || chambreData.nbLits,
        superficie: chambreData.superficie,
        etage: chambreData.etage,
        vue: chambreData.vue,
        description: chambreData.description,
        statut: chambreData.statut || 'libre',
      });
      return createResponse.data;
    } catch (createErr) {
      console.error('Error creating chambre in reservation service:', createErr);
      throw createErr;
    }
  },
};

// Users API Service (from external service)
const USERS_API_BASE_URL =
  import.meta.env.VITE_SERVICE_USERS_URL || 'http://192.168.100.10:8080';
const USERS_API_TOKEN =
  import.meta.env.VITE_USERS_API_TOKEN ||
  localStorage.getItem('users_api_token') ||
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYW16YUBnbWFpbC5jb20iLCJyb2xlIjoiUkVDRVBUSU9OTklTVEUiLCJpYXQiOjE3NjM1ODA4MDUsImV4cCI6MTc2MzY2NzIwNX0.dDS44ONu2tnA2kgIWs0gXlUrv5YBax8dwJBsNffllhM';

const usersApi = axios.create({
  baseURL: USERS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

usersApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('users_api_token') || USERS_API_TOKEN;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

usersApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Users API non autorisée (401).');
    }
    return Promise.reject(error);
  }
);

export const userAPI = {
  getAll: async () => {
    const response = await usersApi.get('/admin/users');
    return response.data;
  },
  getById: async (id) => {
    const response = await usersApi.get(`/admin/users/${id}`);
    return response.data;
  },
  getClients: async () => {
    const response = await usersApi.get('/admin/users');
    // Filter users with role CLIENT
    const allUsers = response?.data?.data || response?.data || response || [];
    const clients = Array.isArray(allUsers) 
      ? allUsers.filter(user => user.role === 'CLIENT' || user.role === 'client')
      : [];
    return { data: clients };
  },
};

// Auth helper
export const auth = {
  setToken: (token) => {
    localStorage.setItem('jwt_token', token);
  },
  
  getToken: () => {
    return localStorage.getItem('jwt_token');
  },
  
  removeToken: () => {
    localStorage.removeItem('jwt_token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('jwt_token');
  },
};

export default api;

