import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import ChambreList from './components/ChambreList';
import ChambreForm from './components/ChambreForm';
import ChambreDetail from './components/ChambreDetail';
import ReservationList from './components/ReservationList';
import ReservationForm from './components/ReservationForm';
import UserList from './components/UserList';
import Login from './components/Login';
import { auth, authAPI } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    if (auth.isAuthenticated()) {
      try {
        // Verify token is still valid
        await authAPI.me();
        setIsAuthenticated(true);
      } catch (err) {
        // Token is invalid, clear it
        auth.removeToken();
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setCheckingAuth(false);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Ignore errors on logout
      console.log('Logout error:', err);
    } finally {
      auth.removeToken();
      setIsAuthenticated(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link to="/" className="text-2xl font-bold text-blue-600">
                    🏨 Gestion Chambres
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Liste des Chambres
                  </Link>
                  <Link
                    to="/reservations"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Réservations
                  </Link>
                  <Link
                    to="/reservations/new"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Nouvelle Réservation
                  </Link>
                  <Link
                    to="/users"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Utilisateurs
                  </Link>
                  {isAuthenticated && (
                    <Link
                      to="/chambres/new"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Nouvelle Chambre
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Déconnexion
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Connexion Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<ChambreList />} />
            <Route path="/chambres/new" element={<ChambreForm />} />
            <Route path="/chambres/:id" element={<ChambreDetail />} />
            <Route path="/chambres/:id/edit" element={<ChambreForm />} />
            <Route path="/reservations" element={<ReservationList />} />
            <Route path="/reservations/new" element={<ReservationForm />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

