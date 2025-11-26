import axios from 'axios';

// Configuration pour l'API de réservation
const reservationApi = axios.create({
    baseURL: process.env.REACT_APP_RESERVATION_API_URL || 'http://localhost:8083/api',
    timeout: 10000,
});

// Intercepteur pour ajouter l'authentification Basic
reservationApi.interceptors.request.use(
    (config) => {
        // Encodage Base64 pour l'authentification Basic
        const token = btoa('admin:admin123');
        config.headers.Authorization = `Basic ${token}`;
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';

        console.log('🔐 Headers Auth:', config.headers.Authorization);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs
reservationApi.interceptors.response.use(
    (response) => {
        console.log('✅ Réponse réussie:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ Erreur API Réservation:', {
            status: error.response?.status,
            message: error.response?.data,
            url: error.config?.url
        });

        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('🔐 Erreur d authentification - Vérifiez les credentials Basic Auth');
        }
        return Promise.reject(error);
    }
);

export default reservationApi;