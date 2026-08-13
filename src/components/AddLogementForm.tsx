import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import AddressAutocomplete from './common/AddressAutocomplete';
import '../assets/css/AddLogementForm.css';

const AddLogementForm: React.FC = () => {
  const history = useHistory();
  const [form, setForm] = useState({ nom: '', localisation: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.nom.trim())          { setError('Le nom du logement est requis.'); return; }
    if (!form.localisation.trim()) { setError('La localisation est requise.'); return; }

    setSaving(true); setError('');
    try {
      const res = await axiosInstance.post('logements/', {
        nom: form.nom.trim(),
        localisation: form.localisation.trim(),
        description: form.description.trim(),
      });
      const logementId = res.data.id;
      // Chaînage immédiat : on redirige directement vers l'ajout de compartiment,
      // avec un message affiché à l'arrivée plutôt qu'un toast qui disparaîtrait
      // pendant la transition de page.
      history.replace(`/logement/${logementId}/ajouter-compartiment`, {
        flashMessage: `"${form.nom.trim()}" enregistré ! Ajoutons maintenant ses compartiments.`,
      });
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.nom) setError('Ce nom de logement existe déjà.');
      else setError("Erreur lors de l'enregistrement. Vérifiez les informations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
            Nouveau logement
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="add-logement-content">
        <div className="form-wrap">
          <p className="al-intro" style={{ marginBottom: '20px' }}>
            Un logement regroupe les compartiments (appartements, studios, chambres, boutiques)
            que vous allez ensuite créer et louer séparément.
          </p>

          {error && <p className="al-error">⚠ {error}</p>}

          <div className="g-input-group">
            <label className="g-label">Nom du logement / immeuble *</label>
            <input
              className="g-input"
              placeholder="Ex : Résidence Bonapriso"
              value={form.nom}
              onChange={e => set('nom', e.target.value)}
            />
          </div>

          <div className="g-input-group">
            <label className="g-label">Localisation *</label>
            <AddressAutocomplete
              placeholder="Ex : Bonapriso, Douala"
              value={form.localisation}
              onChange={v => set('localisation', v)}
            />
          </div>

          <div className="g-input-group">
            <label className="g-label">Description <span className="al-optional">(optionnel)</span></label>
            <textarea
              className="g-input"
              rows={3}
              placeholder="Quelques précisions utiles sur l'immeuble…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <button className="g-btn g-btn--primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer et ajouter des compartiments →'}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddLogementForm;
