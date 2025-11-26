import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const menuItems = [
        { path: '/client', icon: '📊', label: 'Tableau de bord' },
        { path: '/client/reservations', icon: '🗓️', label: 'Mes réservations' },
        { path: '/client/profil', icon: '👤', label: 'Mon profil' },
        { path: '/client/factures', icon: '💰', label: 'Mes factures' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>🏨 HotelMS</h3>
            </div>
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </Link>
                ))}
                <button onClick={handleLogout} className="sidebar-item logout-btn">
                    <span className="sidebar-icon">📦</span>
                    <span className="sidebar-label">Déconnexion</span>
                </button>
            </nav>
        </div>
    );
};

export default Sidebar;
