import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Login.css';

const ForgotPassword: React.FC = () => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const history = useHistory();

  const handleSubmit = async () => {
    if (!email) { setError('Entrez votre adresse email.'); return; }
    setLoading(true); setError('');
    try {
      await axiosInstance.post('auth/password-reset/', { email });
      setSent(true);
    } catch {
      // Le backend renvoie toujours 200 pour cette route (anti-énumération) —
      // une erreur ici est donc réseau/serveur, pas "email inconnu".
      setError("Une erreur est survenue. Réessayez dans un instant.");
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
            Mot de passe oublié ?
          </p>

          <div className="login-form g-animate g-animate--2">
            {sent ? (
              <>
                <p style={{ fontSize: '14px', color: 'var(--g-text-2)', lineHeight: 1.5, marginBottom: '20px' }}>
                  Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation
                  vient d'être envoyé — vérifiez votre boîte de réception (et vos spams).
                </p>
                <button className="g-btn g-btn--outline" onClick={() => history.push('/login')}>
                  ← Retour à la connexion
                </button>
              </>
            ) : (
              <>
                <div className="g-input-group">
                  <label className="g-label">Adresse email</label>
                  <input
                    className="g-input"
                    type="email"
                    placeholder="vous@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {error && <p className="login-error">{error}</p>}

                <button className="g-btn g-btn--primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
                </button>

                <div className="login-divider"><span>ou</span></div>

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

export default ForgotPassword;
