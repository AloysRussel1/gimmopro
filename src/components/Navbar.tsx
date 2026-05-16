import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import '../assets/css/Navbar.css';

const tabs = [
  { path: '/logement', icon: '🏠', label: 'Logements' },
  { path: '/locataire', icon: '👤', label: 'Locataires' },
  { path: '/paiement', icon: '💳', label: 'Paiements' },
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const history = useHistory();

  // Hide on login page
  if (location.pathname === '/login') return null;

  return (
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
    </nav>
  );
};

export default Navbar;