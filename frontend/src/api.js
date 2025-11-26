import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
    timeout: 10000,
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // ✅ Liste des routes publiques (pas de redirection sur 401)
        const publicRoutes = [
            '/auth/login',
            '/auth/register',
            '/auth/forgot-password',
            '/auth/validate-reset-token',  // ✅ AJOUTÉ
            '/auth/reset-password',
            '/auth/send-password'
        ];

        // Vérifier si la requête est sur une route publique
        const isPublicRoute = publicRoutes.some(route =>
            error.config?.url?.includes(route)
        );

        // Ne rediriger que si ce n'est PAS une route publique
        if (error.response?.status === 401 && !isPublicRoute) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default api;
