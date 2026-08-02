import React, { useEffect, useState } from 'react';
import { Route, Redirect } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { isAuthenticated } from '../api/auth';

// Garde de route pour les pages admin. C'est un confort UX uniquement — la
// vraie protection est IsAdminUser sur chaque endpoint /api/admin/* côté
// backend, qui s'applique de toute façon indépendamment de ce composant.
const AdminRoute: React.FC<{ component: React.FC; path: string; exact?: boolean }> = ({
  component: Component, path, exact,
}) => {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    if (!isAuthenticated()) { setStatus('denied'); return; }
    axiosInstance.get('profil/')
      .then(r => setStatus(r.data?.is_staff ? 'allowed' : 'denied'))
      .catch(() => setStatus('denied'));
  }, []);

  return (
    <Route
      path={path}
      exact={exact}
      render={() => {
        if (!isAuthenticated()) return <Redirect to="/login" />;
        if (status === 'checking') {
          return (
            <div className="g-loading" style={{ minHeight: '60vh' }}>
              <div className="g-spinner" />
            </div>
          );
        }
        return status === 'allowed' ? <Component /> : <Redirect to="/dashboard" />;
      }}
    />
  );
};

export default AdminRoute;
