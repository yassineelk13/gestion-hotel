import axios from 'axios';

const reservationApi = axios.create({
    baseURL: process.env.REACT_APP_RESERVATION_API_URL || 'http://localhost:8083/api',
    timeout: 10000,
});

// ✅ Intercepteur avec Basic Auth (comme le backend attend)
reservationApi.interceptors.request.use(
    (config) => {
        // Utiliser Basic Auth comme le backend
        const token = btoa('admin:admin123');
        config.headers.Authorization = `Basic ${token}`;
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';

        console.log('🔐 Requête Réservation API:', config.method?.toUpperCase(), config.url);
        console.log('🔐 Auth Header:', config.headers.Authorization);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs
reservationApi.interceptors.response.use(
    (response) => {
        console.log('✅ Réponse Réservation API réussie:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ Erreur Réservation API:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
        });

        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('🔐 Erreur d\'authentification Basic Auth');
        }

        return Promise.reject(error);
    }
);

export default reservationApi;
