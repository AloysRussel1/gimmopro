import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const history = useHistory();

  const handleLogin = async () => {
    if (!username || !password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true); setError('');
    try {
      const res = await axiosInstance.post('auth/login/', { username, password });
      localStorage.setItem('access_token',  res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      history.replace('/dashboard');
    } catch {
      setError('Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
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
              <label className="g-label">Nom d'utilisateur</label>
              <input
                className="g-input"
                type="text"
                placeholder="Votre identifiant"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            <div className="g-input-group">
              <label className="g-label">Mot de passe</label>
              <input
                className="g-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
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