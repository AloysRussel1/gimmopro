import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Register.css';

const Register: React.FC = () => {
  const [form, setForm] = useState({
    email: '', password: '', confirm: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
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
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.");
      return;
    }

    setLoading(true); setError('');
    try {
      // Le compte est créé inactif côté backend : pas de JWT à cette étape,
      // il faut confirmer l'email avant de pouvoir se connecter.
      await axiosInstance.post('auth/register/', {
        email:    form.email,
        password: form.password,
      });
      setSent(true);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.error) setError(data.error);
      else setError('Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true); setResendMsg('');
    try {
      await axiosInstance.post('auth/verify-email/', { email: form.email });
      setResendMsg('Email renvoyé — pensez à vérifier vos courriers indésirables.');
    } catch {
      setResendMsg("Erreur lors du renvoi de l'email.");
    } finally {
      setResending(false);
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

          {sent ? (
            <div className="reg-form g-animate g-animate--2" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '15px', color: 'var(--g-text)', fontWeight: 600, marginBottom: '10px' }}>
                📩 Vérifiez votre boîte de réception
              </p>
              <p style={{ fontSize: '13.5px', color: 'var(--g-text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
                Un email de vérification vient d'être envoyé à <strong>{form.email}</strong>.
                Cliquez sur le lien qu'il contient pour activer votre compte.
              </p>

              {resendMsg && <p className="login-tagline" style={{ marginBottom: '12px' }}>{resendMsg}</p>}

              <button className="g-btn g-btn--outline" onClick={handleResend} disabled={resending}>
                {resending ? 'Envoi…' : "Je n'ai rien reçu — renvoyer l'email"}
              </button>

              <div className="login-divider"><span>ou</span></div>

              <button className="g-btn g-btn--outline" onClick={() => history.push('/login')}>
                ← Retour à la connexion
              </button>
            </div>
          ) : (
            <>
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

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--g-text-2)', lineHeight: 1.5, margin: '4px 0 16px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => { setAcceptTerms(e.target.checked); setError(''); }}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  <span>
                    J'accepte les{' '}
                    <a href="/cgu" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--g-accent)', fontWeight: 600 }}>
                      conditions d'utilisation
                    </a>{' '}
                    et la{' '}
                    <a href="/confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--g-accent)', fontWeight: 600 }}>
                      politique de confidentialité
                    </a>
                  </span>
                </label>

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
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;