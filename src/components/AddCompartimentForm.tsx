import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonProgressBar,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/AddCompartimentForm.css';

const TYPES = [
  { value: 'APPARTEMENT', label: 'Appartement', icon: '🏠', desc: 'Plusieurs chambres, salon, cuisine' },
  { value: 'STUDIO',      label: 'Studio',      icon: '🛏', desc: '1 chambre, cuisine, douche' },
  { value: 'CHAMBRE',     label: 'Chambre',      icon: '🚪', desc: '1 chambre, douche' },
  { value: 'BOUTIQUE',    label: 'Boutique',     icon: '🏪', desc: 'Local commercial' },
];

const STEPS = ['Type', 'Nom', 'Composition', 'Confirmation'];

const AddCompartimentForm: React.FC = () => {
  const { logement_id } = useParams<{ logement_id: string }>();
  const history = useHistory();
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const [form, setForm] = useState({
    type:      '',
    nom:       '',
    chambres:  '0',
    salons:    '0',
    douches:   '0',
    cuisines:  '0',
  });

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Pré-remplir selon le type
  const selectType = (type: string) => {
    set('type', type);
    if (type === 'STUDIO')  setForm(f => ({ ...f, type, chambres: '1', salons: '0', douches: '1', cuisines: '1' }));
    if (type === 'CHAMBRE') setForm(f => ({ ...f, type, chambres: '1', salons: '0', douches: '1', cuisines: '0' }));
    if (type === 'BOUTIQUE') setForm(f => ({ ...f, type, chambres: '0', salons: '1', douches: '1', cuisines: '0' }));
    if (type === 'APPARTEMENT') setForm(f => ({ ...f, type, chambres: '2', salons: '1', douches: '1', cuisines: '1' }));
  };

  const validate = (): string => {
    if (step === 1 && !form.type) return 'Sélectionnez un type.';
    if (step === 2 && !form.nom)  return 'Le nom est requis.';
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const selectedType = TYPES.find(t => t.value === form.type);

  const handleSubmit = async () => {
    setSaving(true); setError('');
    try {
      await axiosInstance.post(`logements/${logement_id}/compartiments/ajouter/`, {
        type:      form.type,
        nom:       form.nom,
        statut:    'LIBRE',
        chambres:  parseInt(form.chambres),
        salons:    parseInt(form.salons),
        douches:   parseInt(form.douches),
        cuisines:  parseInt(form.cuisines),
        logement:  parseInt(logement_id),
      });
      history.replace(`/logement/${logement_id}`);
    } catch (e: any) {
      setError('Erreur lors de l\'ajout. Vérifiez les informations.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
            Ajouter un compartiment
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="comp-form-content">
        <div className="tf-wrap">
          <IonProgressBar value={step / STEPS.length} />
          <p className="tf-step-label">Étape {step}/{STEPS.length} — {STEPS[step - 1]}</p>

          {error && <p className="tf-error">⚠ {error}</p>}

          {/* ── ÉTAPE 1 — Type ── */}
          {step === 1 && (
            <div className="tf-section">
              <p className="comp-section-title">Quel type de compartiment ?</p>
              <div className="comp-type-grid">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`comp-type-btn ${form.type === t.value ? 'comp-type-btn--active' : ''}`}
                    onClick={() => selectType(t.value)}
                  >
                    <span className="comp-type-btn__icon">{t.icon}</span>
                    <span className="comp-type-btn__label">{t.label}</span>
                    <span className="comp-type-btn__desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 — Nom ── */}
          {step === 2 && (
            <div className="tf-section">
              {selectedType && (
                <div className="tf-info-box">
                  <p>{selectedType.icon} <strong>{selectedType.label}</strong></p>
                  <p className="tf-info-note">{selectedType.desc}</p>
                </div>
              )}
              <div className="g-input-group">
                <label className="g-label">Nom du compartiment *</label>
                <input
                  className="g-input"
                  placeholder={`Ex: ${form.type === 'APPARTEMENT' ? 'Appartement A1' : form.type === 'STUDIO' ? 'Studio S1' : form.type === 'CHAMBRE' ? 'Chambre C1' : 'Boutique B1'}`}
                  value={form.nom}
                  onChange={e => set('nom', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 — Composition ── */}
          {step === 3 && (
            <div className="tf-section">
              <p className="comp-section-title">Composition du compartiment</p>

              <div className="comp-counter-grid">
                {form.type !== 'BOUTIQUE' && (
                  <div className="comp-counter">
                    <p className="comp-counter__label">🛏 Chambres</p>
                    <div className="comp-counter__controls">
                      <button onClick={() => set('chambres', String(Math.max(0, parseInt(form.chambres) - 1)))}>−</button>
                      <span>{form.chambres}</span>
                      <button onClick={() => set('chambres', String(parseInt(form.chambres) + 1))}>+</button>
                    </div>
                  </div>
                )}

                <div className="comp-counter">
                  <p className="comp-counter__label">🛋 Salons</p>
                  <div className="comp-counter__controls">
                    <button onClick={() => set('salons', String(Math.max(0, parseInt(form.salons) - 1)))}>−</button>
                    <span>{form.salons}</span>
                    <button onClick={() => set('salons', String(parseInt(form.salons) + 1))}>+</button>
                  </div>
                </div>

                <div className="comp-counter">
                  <p className="comp-counter__label">🚿 Douches</p>
                  <div className="comp-counter__controls">
                    <button onClick={() => set('douches', String(Math.max(0, parseInt(form.douches) - 1)))}>−</button>
                    <span>{form.douches}</span>
                    <button onClick={() => set('douches', String(parseInt(form.douches) + 1))}>+</button>
                  </div>
                </div>

                {form.type !== 'CHAMBRE' && (
                  <div className="comp-counter">
                    <p className="comp-counter__label">🍳 Cuisines</p>
                    <div className="comp-counter__controls">
                      <button onClick={() => set('cuisines', String(Math.max(0, parseInt(form.cuisines) - 1)))}>−</button>
                      <span>{form.cuisines}</span>
                      <button onClick={() => set('cuisines', String(parseInt(form.cuisines) + 1))}>+</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 — Confirmation ── */}
          {step === 4 && (
            <div className="tf-section">
              <div className="tf-confirm">
                <p className="tf-confirm__title">✓ Récapitulatif</p>
                {[
                  ['Type',      `${selectedType?.icon} ${selectedType?.label}`],
                  ['Nom',       form.nom],
                  ['Chambres',  form.chambres],
                  ['Salons',    form.salons],
                  ['Douches',   form.douches],
                  ['Cuisines',  form.cuisines],
                  ['Statut',    '🔓 Libre'],
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
              <button className="g-btn g-btn--outline" onClick={() => { setStep(s => s - 1); setError(''); }}>
                ← Retour
              </button>
            )}
            {step < 4 ? (
              <button className="g-btn g-btn--primary" onClick={next}>
                Suivant →
              </button>
            ) : (
              <button className="g-btn g-btn--primary" onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ Enregistrement…' : '✓ Ajouter'}
              </button>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddCompartimentForm;