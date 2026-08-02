import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { isAuthenticated, logout } from '../api/auth';
import '../assets/css/Navbar.css';

const tabs = [
  { path: '/logement',  icon: '🏠', label: 'Logements'  },
  { path: '/locataire', icon: '👤', label: 'Locataires' },
  { path: '/paiement',  icon: '💳', label: 'Paiements'  },
  { path: '/dashboard', icon: '📊', label: 'Dashboard'  },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const history  = useHistory();
  const [showConfirm, setShowConfirm] = useState(false);

  // Le tab bar ne concerne que l'app connectée — jamais la landing page ou l'auth.
  if (!isAuthenticated() || location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <>
      <nav className="g-tabbar">
        {tabs.map(tab => {
          const active = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              className={`g-tab ${active ? 'g-tab--active' : ''}`}
              onClick={() => history.push(tab.path)}
            >
              <span className="g-tab__icon">{tab.icon}</span>
              <span className="g-tab__label">{tab.label}</span>
              {active && <span className="g-tab__dot" />}
            </button>
          );
        })}

        {/* Bouton déconnexion */}
        <button
          className="g-tab g-tab--logout"
          onClick={() => setShowConfirm(true)}
        >
          <span className="g-tab__icon">🚪</span>
          <span className="g-tab__label">Sortir</span>
        </button>
      </nav>

      {/* Confirmation déconnexion */}
      {showConfirm && (
        <div className="logout-overlay" onClick={() => setShowConfirm(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <p className="logout-modal__title">Se déconnecter ?</p>
            <p className="logout-modal__sub">Vous devrez vous reconnecter pour accéder à l'application.</p>
            <div className="logout-modal__actions">
              <button className="g-btn g-btn--outline" onClick={() => setShowConfirm(false)}>
                Annuler
              </button>
              <button className="g-btn g-btn--danger" onClick={logout}>
                🚪 Déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;