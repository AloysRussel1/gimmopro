import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/ProfilePage.css';

interface Profile {
  username: string;
  email: string;
  nom: string;
  telephone: string;
  adresse: string;
}

const ProfilePage: React.FC = () => {
  const history = useHistory();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ telephone: '', adresse: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axiosInstance.get('profil/')
      .then(r => {
        setProfile(r.data);
        setForm({ telephone: r.data.telephone || '', adresse: r.data.adresse || '' });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await axiosInstance.put('profil/', form);
      setProfile(res.data);
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>Mon profil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="profile-content">
        <div className="g-page">
          {loading ? (
            <div className="g-loading"><div className="g-spinner" /></div>
          ) : (
            <>
              <div className="profile-card g-card g-animate">
                <p className="profile-card__nom">{profile?.nom}</p>
                <p className="profile-card__sub">{profile?.username} · {profile?.email || 'pas de courriel'}</p>
              </div>

              <div className="g-card g-animate g-animate--1" style={{ marginTop: '14px' }}>
                <p className="profile-section-title">Coordonnées du bailleur</p>
                <p className="profile-hint">
                  Utilisées dans le contrat de bail PDF généré pour vos locataires.
                </p>

                <div className="g-input-group">
                  <label className="g-label">Téléphone</label>
                  <input
                    className="g-input" type="tel" placeholder="+237 6XX XXX XXX"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                  />
                </div>

                <div className="g-input-group">
                  <label className="g-label">Adresse physique</label>
                  <input
                    className="g-input" placeholder="Quartier, ville"
                    value={form.adresse}
                    onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                  />
                </div>

                {saved && <p className="profile-saved">✓ Profil mis à jour</p>}

                <button className="g-btn g-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>

              <button className="g-btn g-btn--outline" style={{ marginTop: '14px' }} onClick={() => history.goBack()}>
                ← Retour
              </button>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
