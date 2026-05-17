import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonProgressBar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/AddTenantForm.css';

interface Logement { id: number; nom: string; }
interface Compartiment { id: number; nom: string; type: string; logement: number; }

const STEPS = [
  'Informations personnelles',
  'Contact & Identité',
  'Logement & Compartiment',
  'Contrat & Loyer',
  'Confirmation',
];

const AddTenantForm: React.FC = () => {
  const history = useHistory();
  const [step, setStep] = useState(1);
  const [loading, setSaving] = useState(false);
  const [error, setError]    = useState('');

  const [logements, setLogements]       = useState<Logement[]>([]);
  const [compartiments, setCompartiments] = useState<Compartiment[]>([]);

  const [form, setForm] = useState({
    nom_complet:           '',
    email:                 '',
    telephone:             '',
    cni:                   '',
    logement:              '',
    compartiment:          '',
    numero_contrat:        '',
    date_debut_contrat:    '',
    loyer:                 '',
    date_prochain_paiement: '',
    statut:                'Actif',
  });

  // Charger les logements
  useEffect(() => {
    axiosInstance.get('logements/').then(r => setLogements(r.data)).catch(console.error);
  }, []);

  // Charger les compartiments libres quand logement change
  useEffect(() => {
    if (!form.logement) { setCompartiments([]); return; }
    axiosInstance.get(`logements/${form.logement}/compartiments/?statut=LIBRE`)
      .then(r => setCompartiments(r.data))
      .catch(console.error);
  }, [form.logement]);

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = () => {
    if (step === 1 && !form.nom_complet) return 'Le nom est requis.';
    if (step === 2 && !form.telephone)   return 'Le téléphone est requis.';
    if (step === 2 && !form.cni)         return 'Le CNI est requis.';
    if (step === 3 && !form.logement)    return 'Sélectionnez un logement.';
    if (step === 3 && !form.compartiment) return 'Sélectionnez un compartiment.';
    if (step === 4 && !form.numero_contrat) return 'Le numéro de contrat est requis.';
    if (step === 4 && !form.date_debut_contrat) return 'La date de début est requise.';
    if (step === 4 && !form.loyer) return 'Le loyer est requis.';
    if (step === 4 && !form.date_prochain_paiement) return 'La date de prochain paiement est requise.';
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSaving(true); setError('');
    try {
      await axiosInstance.post('occupants/', {
        nom_complet:            form.nom_complet,
        email:                  form.email || `${form.telephone}@gimmopro.local`,
        telephone:              form.telephone,
        cni:                    form.cni,
        logement:               parseInt(form.logement),
        compartiment:           parseInt(form.compartiment),
        numero_contrat:         form.numero_contrat,
        date_debut_contrat:     form.date_debut_contrat,
        loyer:                  parseFloat(form.loyer),
        date_prochain_paiement: form.date_prochain_paiement,
        statut:                 'Actif',
        actif:                  true,
      });
      history.replace('/locataire');
    } catch (e: any) {
      const data = e?.response?.data;
      if (data) setError(JSON.stringify(data));
      else setError('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
            Nouveau locataire
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="tenant-form-content">
        <div className="tf-wrap">
          {/* Progress */}
          <IonProgressBar value={step / STEPS.length} />
          <p className="tf-step-label">Étape {step} / {STEPS.length} — {STEPS[step - 1]}</p>

          {error && <p className="tf-error">{error}</p>}

          {/* ÉTAPE 1 — Infos personnelles */}
          {step === 1 && (
            <div className="tf-section">
              <div className="g-input-group">
                <label className="g-label">Nom complet *</label>
                <input className="g-input" placeholder="Jean Dupont"
                  value={form.nom_complet} onChange={e => set('nom_complet', e.target.value)} />
              </div>
              <div className="g-input-group">
                <label className="g-label">Email (optionnel)</label>
                <input className="g-input" type="email" placeholder="jean@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — Contact & Identité */}
          {step === 2 && (
            <div className="tf-section">
              <div className="g-input-group">
                <label className="g-label">Téléphone *</label>
                <input className="g-input" placeholder="+237 6XX XXX XXX"
                  value={form.telephone} onChange={e => set('telephone', e.target.value)} />
              </div>
              <div className="g-input-group">
                <label className="g-label">Numéro CNI *</label>
                <input className="g-input" placeholder="CNI123456"
                  value={form.cni} onChange={e => set('cni', e.target.value)} />
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — Logement & Compartiment */}
          {step === 3 && (
            <div className="tf-section">
              <div className="g-input-group">
                <label className="g-label">Logement *</label>
                <select className="g-input" value={form.logement}
                  onChange={e => { set('logement', e.target.value); set('compartiment', ''); }}>
                  <option value="">— Sélectionnez un logement —</option>
                  {logements.map(l => (
                    <option key={l.id} value={l.id}>{l.nom}</option>
                  ))}
                </select>
              </div>

              {form.logement && (
                <div className="g-input-group">
                  <label className="g-label">Compartiment libre *</label>
                  {compartiments.length === 0 ? (
                    <p className="tf-no-comp">Aucun compartiment libre dans ce logement.</p>
                  ) : (
                    <select className="g-input" value={form.compartiment}
                      onChange={e => set('compartiment', e.target.value)}>
                      <option value="">— Sélectionnez un compartiment —</option>
                      {compartiments.map(c => (
                        <option key={c.id} value={c.id}>{c.nom} ({c.type})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 4 — Contrat */}
          {step === 4 && (
            <div className="tf-section">
              <div className="g-input-group">
                <label className="g-label">Numéro de contrat *</label>
                <input className="g-input" placeholder="CONT-001"
                  value={form.numero_contrat} onChange={e => set('numero_contrat', e.target.value)} />
              </div>
              <div className="g-input-group">
                <label className="g-label">Date de début du contrat *</label>
                <input className="g-input" type="date"
                  value={form.date_debut_contrat} onChange={e => set('date_debut_contrat', e.target.value)} />
              </div>
              <div className="g-input-group">
                <label className="g-label">Loyer mensuel *</label>
                <input className="g-input" type="number" placeholder="50000"
                  value={form.loyer} onChange={e => set('loyer', e.target.value)} />
              </div>
              <div className="g-input-group">
                <label className="g-label">Date du prochain paiement *</label>
                <input className="g-input" type="date"
                  value={form.date_prochain_paiement} onChange={e => set('date_prochain_paiement', e.target.value)} />
              </div>
            </div>
          )}

          {/* ÉTAPE 5 — Confirmation */}
          {step === 5 && (
            <div className="tf-section">
              <div className="tf-confirm">
                <p className="tf-confirm__title">Récapitulatif</p>
                {[
                  ['Nom', form.nom_complet],
                  ['Téléphone', form.telephone],
                  ['CNI', form.cni],
                  ['Compartiment', compartiments.find(c => String(c.id) === form.compartiment)?.nom || '—'],
                  ['Contrat', form.numero_contrat],
                  ['Loyer', `${form.loyer} / mois`],
                  ['Début contrat', form.date_debut_contrat],
                  ['Prochain paiement', form.date_prochain_paiement],
                ].map(([k, v]) => (
                  <div className="tf-confirm__row" key={k}>
                    <span className="tf-confirm__key">{k}</span>
                    <span className="tf-confirm__val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="tf-nav">
            {step > 1 && (
              <button className="g-btn g-btn--outline" onClick={() => setStep(s => s - 1)}>
                ← Précédent
              </button>
            )}
            {step < 5 ? (
              <button className="g-btn g-btn--primary" onClick={next}>
                Suivant →
              </button>
            ) : (
              <button className="g-btn g-btn--primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enregistrement…' : '✓ Confirmer'}
              </button>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddTenantForm;