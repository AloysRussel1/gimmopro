import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { markAuthenticated, setTokens } from '../api/auth';
import '../assets/css/Login.css';

const Login: React.FC = () => {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const history = useHistory();

  const handleLogin = async () => {
    if (!email || !password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true); setError('');
    try {
      // Le backend attend la clé "username" (sérialiseur JWT par défaut de
      // SimpleJWT) — mais EmailOrUsernameBackend accepte un email dans ce
      // champ, donc l'utilisateur ne voit et ne saisit plus que son email.
      // Le backend pose les tokens en cookies httpOnly (mécanisme principal)
      // ET les renvoie en JSON (filet de secours Safari/ITP, gardé en
      // mémoire/sessionStorage par setTokens -- jamais en localStorage,
      // voir api/tokenStore.ts).
      const res = await axiosInstance.post('auth/login/', { username: email, password });
      setTokens(res.data.access, res.data.refresh);
      markAuthenticated();
      history.replace('/dashboard');
    } catch (err: any) {
      // Affiche le message exact renvoyé par le backend quand il y en a un
      // (ex: "No active account found with the given credentials" de
      // SimpleJWT, ou "Aucun compte actif..." si un jour on le personnalise)
      // plutôt qu'un message générique qui masquerait la vraie cause
      // (mauvais mot de passe vs compte non vérifié vs erreur réseau/serveur).
      const detail = err?.response?.data?.detail;
      setError(detail || 'Identifiants incorrects. Vérifiez votre email et votre mot de passe.');
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
            Gérez vos biens en toute élégance
          </p>

          <div className="login-form g-animate g-animate--2">
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
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div className="g-input-group">
              <div className="login-pass-label-row">
                <label className="g-label">Mot de passe</label>
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() => history.push('/mot-de-passe-oublie')}
                  tabIndex={-1}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="login-pass-wrap">
                <input
                  className="g-input login-pass-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button
                  className="login-eye"
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button
              className="g-btn g-btn--primary"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="login-divider"><span>ou</span></div>

            <button
              className="g-btn g-btn--outline"
              onClick={() => history.push('/register')}
            >
              Créer un compte
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;