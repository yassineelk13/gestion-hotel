import axios from 'axios';

const API_URL = process.env.REACT_APP_PAIEMENT_API_URL || 'http://localhost:8084/api';

const paiementApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    // ✅ RETIRER withCredentials (pas nécessaire ici)
});

// Intercepteur REQUEST
paiementApi.interceptors.request.use(
    (config) => {
        console.log('🔄 Requête Paiement:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur RESPONSE
paiementApi.interceptors.response.use(
    (response) => {
        console.log('✅ Réponse Paiement réussie:', response.status);
        return response;
    },
    (error) => {
        console.error('❌ Erreur Paiement API:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

export default paiementApi;
