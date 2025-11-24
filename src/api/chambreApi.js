import axios from 'axios';

const chambreApi = axios.create({
    baseURL: process.env.REACT_APP_CHAMBRE_API_URL || 'http://192.168.100.44:8082/api',
    timeout: 10000,
});

// Intercepteur pour AJOUTER le token JWT
chambreApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';

        console.log('🌐 Requête Chambre API:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour les réponses
chambreApi.interceptors.response.use(
    (response) => {
        console.log('✅ Réponse Chambre API réussie:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ Erreur Chambre API:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
        });

        // Gérer les erreurs d'authentification
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default chambreApi;