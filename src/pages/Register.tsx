import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Register.css';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    email: '', password: '', confirm: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.confirm) {
      setError('Remplissez tous les champs obligatoires.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.'); return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.'); return;
    }

    setLoading(true); setError('');
    try {
      const res = await axiosInstance.post('auth/register/', {
        email:    form.email,
        password: form.password,
      });
      localStorage.setItem('access_token',  res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      history.replace('/dashboard');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error) setError(data.error);
      else setError('Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="reg-content">
        <div className="login-bg"><div className="login-blob" /></div>

        <div className="reg-wrap">
          <div className="login-logo g-animate">
            <div className="login-logo__mark">G</div>
            <span className="login-logo__name">Gimmopro</span>
          </div>

          <p className="login-tagline g-animate g-animate--1">
            Créez votre compte gratuitement
          </p>

          <div className="reg-form g-animate g-animate--2">
            <div className="g-input-group">
              <label className="g-label">Adresse email *</label>
              <input
                className="g-input"
                type="email"
                placeholder="vous@email.com"
                value={form.email}
                onChange={handleChange('email')}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            <div className="g-input-group">
              <label className="g-label">Mot de passe *</label>
              <input
                className="g-input"
                type="password"
                placeholder="Min. 8 caractères"
                value={form.password}
                onChange={handleChange('password')}
              />
            </div>

            <div className="g-input-group">
              <label className="g-label">Confirmer le mot de passe *</label>
              <input
                className="g-input"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={form.confirm}
                onChange={handleChange('confirm')}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button
              className="g-btn g-btn--primary"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>

            <div className="login-divider"><span>ou</span></div>

            <button
              className="g-btn g-btn--outline"
              onClick={() => history.push('/login')}
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;