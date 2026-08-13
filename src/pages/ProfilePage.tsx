import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import AsyncBoundary from '../components/AsyncBoundary';
import SkeletonLoader from '../components/SkeletonLoader';
import PhoneInput from '../components/common/PhoneInput';
import AddressAutocomplete from '../components/common/AddressAutocomplete';
import '../assets/css/ProfilePage.css';

interface Profile {
  username: string;
  email: string;
  nom: string;
  nom_complet: string;
  telephone: string;
  adresse: string;
  identifiant_fiscal: string;
}

const ProfilePage: React.FC = () => {
  const history = useHistory();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ nom_complet: '', telephone: '', adresse: '', identifiant_fiscal: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axiosInstance.get('profil/')
      .then(r => {
        setProfile(r.data);
        setForm({
          nom_complet: r.data.nom_complet || '', telephone: r.data.telephone || '',
          adresse: r.data.adresse || '', identifiant_fiscal: r.data.identifiant_fiscal || '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Recalculé en direct pendant la saisie (pas seulement après le dernier
  // enregistrement) -- les 3 champs utilisés sur les documents officiels
  // (contrat, reçus, états des lieux) doivent tous être renseignés.
  const profilComplet = Boolean(form.nom_complet && form.telephone && form.adresse);

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    try {
      const res = await axiosInstance.put('profil/', form);
      setProfile(res.data);
      setSaved(true);
    } catch (e: any) {
      console.error(e);
      const data = e?.response?.data;
      setError(data?.telephone?.[0] || "Erreur lors de l'enregistrement. Vérifiez les informations.");
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
          <AsyncBoundary loading={loading} skeleton={<SkeletonLoader variant="cards" count={2} />}>
            <>
              <div className="profile-card g-card g-animate">
                <p className="profile-card__nom">{profile?.nom}</p>
                <p className="profile-card__sub">{profile?.username} · {profile?.email || 'pas de courriel'}</p>
              </div>

              {!profilComplet && (
                <p className="tf-error" style={{ marginTop: '14px' }}>
                  ⚠ Profil incomplet — le nom complet, le téléphone et l'adresse sont nécessaires pour
                  que vos contrats et reçus PDF affichent vos vraies coordonnées au lieu d'un nom
                  d'utilisateur technique.
                </p>
              )}

              <div className="g-card g-animate g-animate--1" style={{ marginTop: '14px' }}>
                <p className="profile-section-title">Coordonnées du bailleur</p>
                <p className="profile-hint">
                  Utilisées dans le contrat de bail, les reçus et les états des lieux PDF générés pour vos locataires.
                </p>

                <div className="g-input-group">
                  <label className="g-label">Nom complet / Raison sociale</label>
                  <input className="g-input" placeholder="Ex : Jean Dupont, ou SCI Immobilière Lumière"
                    value={form.nom_complet}
                    onChange={e => setForm(f => ({ ...f, nom_complet: e.target.value }))} />
                </div>

                <div className="g-input-group">
                  <label className="g-label">Téléphone</label>
                  <PhoneInput
                    value={form.telephone}
                    onChange={v => setForm(f => ({ ...f, telephone: v }))}
                  />
                </div>

                <div className="g-input-group">
                  <label className="g-label">Adresse physique</label>
                  <AddressAutocomplete
                    placeholder="Quartier, ville"
                    value={form.adresse}
                    onChange={v => setForm(f => ({ ...f, adresse: v }))}
                  />
                </div>

                <div className="g-input-group">
                  <label className="g-label">NIU / CNI / RCCM <span className="tf-optional">(optionnel)</span></label>
                  <input className="g-input" placeholder="Numéro d'identification fiscale ou registre de commerce"
                    value={form.identifiant_fiscal}
                    onChange={e => setForm(f => ({ ...f, identifiant_fiscal: e.target.value }))} />
                </div>

                {error && <p className="tf-error">⚠ {error}</p>}
                {saved && <p className="profile-saved">✓ Profil mis à jour</p>}

                <button className="g-btn g-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>

              <button className="g-btn g-btn--outline" style={{ marginTop: '14px' }} onClick={() => history.goBack()}>
                ← Retour
              </button>
            </>
          </AsyncBoundary>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
