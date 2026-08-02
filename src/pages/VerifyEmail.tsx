import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Login.css';

const VerifyEmail: React.FC = () => {
  const history  = useHistory();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    axiosInstance.post('auth/verify-email/confirm/', { token })
      .then(res => {
        // Le compte vient d'être activé : le backend renvoie directement des
        // JWT pour éviter un aller-retour supplémentaire par l'écran de login.
        if (res.data?.access && res.data?.refresh) {
          localStorage.setItem('access_token',  res.data.access);
          localStorage.setItem('refresh_token', res.data.refresh);
        }
        setStatus('success');
        setTimeout(() => history.replace('/dashboard'), 2000);
      })
      .catch(() => setStatus('error'));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <IonPage>
      <IonContent className="login-content">
        <div className="login-bg"><div className="login-blob" /></div>

        <div className="login-wrap">
          <div className="login-logo g-animate">
            <div className="login-logo__mark">G</div>
            <span className="login-logo__name">Gimmopro</span>
          </div>

          <div className="login-form g-animate g-animate--2" style={{ textAlign: 'center' }}>
            {status === 'loading' && <div className="g-spinner" style={{ margin: '0 auto' }} />}
            {status === 'success' && (
              <>
                <p style={{ fontSize: '14px', color: 'var(--g-text-2)', lineHeight: 1.5, marginBottom: '20px' }}>
                  ✓ Adresse email vérifiée avec succès.<br />Redirection vers votre tableau de bord…
                </p>
                <button className="g-btn g-btn--primary" onClick={() => history.replace('/dashboard')}>
                  Continuer
                </button>
              </>
            )}
            {status === 'error' && (
              <>
                <p className="login-error">Lien invalide ou expiré.</p>
                <button className="g-btn g-btn--outline" onClick={() => history.push('/login')}>
                  ← Retour à la connexion
                </button>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerifyEmail;
