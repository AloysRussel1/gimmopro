import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FiChevronDown, FiSettings, FiLogOut, FiPlus, FiHome, FiUser, FiCreditCard, FiBell, FiShield } from 'react-icons/fi';
import axiosInstance from '../api/axiosConfig';
import { isAuthenticated, logout } from '../api/auth';
import '../assets/css/TopHeader.css';

interface Profile { nom: string; email: string; username: string; is_staff?: boolean; }

const QUICK_ACTIONS = [
  { icon: FiHome,       label: 'Nouveau logement',          path: '/ajouter-logement' },
  { icon: FiUser,       label: 'Nouveau locataire',         path: '/ajouter-locataire' },
  { icon: FiCreditCard, label: 'Enregistrer un paiement',   path: '/paiement' },
];

const initiales = (nom: string): string => {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  if (mots.length === 1) return mots[0].charAt(0).toUpperCase();
  return (mots[0].charAt(0) + mots[1].charAt(0)).toUpperCase();
};

const TopHeader: React.FC = () => {
  const location = useLocation();
  const history  = useHistory();
  const wrapRef  = useRef<HTMLDivElement>(null);

  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [notifCount,  setNotifCount]  = useState(0);

  const visible = isAuthenticated() && location.pathname !== '/login' && location.pathname !== '/register';

  useEffect(() => {
    if (!visible) return;
    axiosInstance.get('profil/').then(r => setProfile(r.data)).catch(() => {});
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    axiosInstance.get('notifications/dashboard/').then(r => setNotifCount(r.data.total)).catch(() => {});
  }, [visible, location.pathname]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowProfile(false);
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!visible) return null;

  const go = (path: string) => {
    setShowActions(false);
    setShowProfile(false);
    history.push(path);
  };

  return (
    <div className="top-header" ref={wrapRef}>
      <div className="top-header__left">
        <div className="top-header__actions">
          <button className="top-header__actions-btn" onClick={() => { setShowActions(s => !s); setShowProfile(false); }}>
            <FiPlus /> <span>Action rapide</span> <FiChevronDown className={`top-header__chevron ${showActions ? 'top-header__chevron--open' : ''}`} />
          </button>
          {showActions && (
            <div className="top-header__dropdown">
              {QUICK_ACTIONS.map(a => (
                <button key={a.path} className="top-header__dropdown-item" onClick={() => go(a.path)}>
                  <a.icon /> {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="top-header__right">
        <button className="top-header__bell-btn" onClick={() => go('/dashboard')} title="Alertes & rappels d'échéances">
          <FiBell />
          {notifCount > 0 && <span className="top-header__bell-badge">{notifCount > 9 ? '9+' : notifCount}</span>}
        </button>

        <button className="top-header__profile-btn" onClick={() => { setShowProfile(s => !s); setShowActions(false); }}>
          <div className="top-header__user-text">
            <span className="top-header__user-name">{profile?.nom || '…'}</span>
            <span className="top-header__user-email">{profile?.email || ''}</span>
          </div>
          <div className="top-header__avatar">{initiales(profile?.nom || profile?.username || '?')}</div>
        </button>

        {showProfile && (
          <div className="top-header__dropdown top-header__dropdown--right">
            <button className="top-header__dropdown-item" onClick={() => go('/profil')}>
              <FiSettings /> Profil bailleur
            </button>
            {profile?.is_staff && (
              <button className="top-header__dropdown-item" onClick={() => go('/admin')}>
                <FiShield /> Administration
              </button>
            )}
            <button className="top-header__dropdown-item top-header__dropdown-item--danger" onClick={logout}>
              <FiLogOut /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopHeader;
