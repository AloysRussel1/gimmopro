import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Login.css';

const ResetPassword: React.FC = () => {
  const history  = useHistory();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    if (!password || !confirm) { setError('Remplissez les deux champs.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }

    setLoading(true); setError('');
    try {
      await axiosInstance.post('auth/password-reset/confirm/', { token, new_password: password });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Lien invalide ou expiré. Refaites une demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content">
        <div className="login-bg"><div className="login-blob" /></div>

        <div className="login-wrap">
          <div className="login-logo g-animate">
            <div className="login-logo__mark">G</div>
            <span className="login-logo__name">Gimmopro</span>
          </div>

          <p className="login-tagline g-animate g-animate--1">
            Nouveau mot de passe
          </p>

          <div className="login-form g-animate g-animate--2">
            {!token ? (
              <>
                <p className="login-error">Lien invalide — aucun jeton trouvé dans l'URL.</p>
                <button className="g-btn g-btn--outline" onClick={() => history.push('/mot-de-passe-oublie')}>
                  Refaire une demande
                </button>
              </>
            ) : done ? (
              <>
                <p style={{ fontSize: '14px', color: 'var(--g-text-2)', lineHeight: 1.5, marginBottom: '20px' }}>
                  ✓ Mot de passe mis à jour. Vous pouvez maintenant vous connecter.
                </p>
                <button className="g-btn g-btn--primary" onClick={() => history.replace('/login')}>
                  Se connecter
                </button>
              </>
            ) : (
              <>
                <div className="g-input-group">
                  <label className="g-label">Nouveau mot de passe</label>
                  <input
                    className="g-input"
                    type="password"
                    placeholder="Min. 8 caractères"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className="g-input-group">
                  <label className="g-label">Confirmer le mot de passe</label>
                  <input
                    className="g-input"
                    type="password"
                    placeholder="Répétez votre mot de passe"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {error && <p className="login-error">{error}</p>}

                <button className="g-btn g-btn--primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
                </button>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
