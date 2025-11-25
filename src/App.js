import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardReceptionniste from "./pages/DashboardReceptionniste";
import DashboardClient from "./pages/DashboardClient";
import ChambreList from "./pages/ChambreList";
import AddChambre from "./pages/AddChambre";
import ForgotPassword from './pages/ForgotPassword';

// Composant de protection des routes
const ProtectedRoute = ({ children, requiredRole }) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Si pas de token, rediriger vers login
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // Si un rôle spécifique est requis et que l'utilisateur ne l'a pas
    if (requiredRole && user.user?.role !== requiredRole) {
        // Rediriger vers le dashboard approprié selon le rôle
        switch (user.user?.role) {
            case 'ADMIN':
                return <Navigate to="/admin" replace />;
            case 'RECEPTIONNISTE':
                return <Navigate to="/reception" replace />;
            case 'CLIENT':
                return <Navigate to="/client" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return children;
};

// Composant pour la redirection automatique après login
const AuthRedirect = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    if (token && user.user) {
        // Rediriger vers le dashboard approprié selon le rôle
        switch (user.user.role) {
            case 'ADMIN':
                return <Navigate to="/admin" replace />;
            case 'RECEPTIONNISTE':
                return <Navigate to="/reception" replace />;
            case 'CLIENT':
                return <Navigate to="/client" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return <Login />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Route racine - redirige automatiquement si déjà connecté */}
                <Route path="/" element={<AuthRedirect />} />

                {/* Routes d'authentification publiques */}
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Routes protégées par rôle */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="ADMIN">
                            <DashboardAdmin />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reception"
                    element={
                        <ProtectedRoute requiredRole="RECEPTIONNISTE">
                            <DashboardReceptionniste />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/client"
                    element={
                        <ProtectedRoute requiredRole="CLIENT">
                            <DashboardClient />
                        </ProtectedRoute>
                    }
                />

                {/* Routes de gestion des chambres */}
                <Route
                    path="/chambres"
                    element={
                        <ProtectedRoute>
                            <ChambreList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chambres/ajouter"
                    element={
                        <ProtectedRoute requiredRole="ADMIN">
                            <AddChambre />
                        </ProtectedRoute>
                    }
                />

                {/* Route fallback pour les URLs inexistantes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;