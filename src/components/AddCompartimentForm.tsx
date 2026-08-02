import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonProgressBar, IonToast,
} from '@ionic/react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/AddCompartimentForm.css';

const TYPES = [
  { value: 'APPARTEMENT', label: 'Appartement', icon: '🏠', desc: 'Plusieurs chambres, salle(s) de bain, cuisine' },
  { value: 'STUDIO',      label: 'Studio',      icon: '🛏', desc: 'Pièce(s), douche, cuisine' },
  { value: 'CHAMBRE',     label: 'Chambre',      icon: '🚪', desc: '1 pièce, avec ou sans commodités privées' },
  { value: 'BOUTIQUE',    label: 'Boutique',     icon: '🏪', desc: 'Local commercial' },
];

const STEPS = ['Type', 'Désignation & loyer', 'Composition', 'Confirmation'];

const EMPTY_FORM = {
  type: '', nom: '', loyer_reference: '',
  chambres: '0', douches: '0', cuisines: '0', mezzanine: false,
};

const AddCompartimentForm: React.FC = () => {
  const { logement_id } = useParams<{ logement_id: string }>();
  const history  = useHistory();
  const location = useLocation<{ flashMessage?: string }>();

  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [ajoutesCount, setAjoutesCount] = useState(0);
  const [showToast, setShowToast] = useState(!!location.state?.flashMessage);
  const [afterSaveMsg, setAfterSaveMsg] = useState('');

  const set = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const selectType = (type: string) => {
    setForm(f => ({ ...EMPTY_FORM, type, nom: f.nom, loyer_reference: f.loyer_reference }));
  };

  const validate = (): string => {
    if (step === 1 && !form.type) return 'Sélectionnez un type de compartiment.';
    if (step === 2 && !form.nom.trim()) return 'La désignation est requise.';
    if (step === 2 && !form.loyer_reference) return 'Le loyer mensuel est requis.';
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const selectedType = TYPES.find(t => t.value === form.type);

  const buildPayload = () => {
    const base = {
      type: form.type, nom: form.nom.trim(), statut: 'LIBRE',
      loyer_reference: form.loyer_reference ? parseFloat(form.loyer_reference) : null,
      logement: parseInt(logement_id),
      salons: 0, chambres: 0, douches: 0, cuisines: 0, mezzanine: false,
    };
    if (form.type === 'CHAMBRE') {
      return { ...base, cuisines: parseInt(form.cuisines), douches: parseInt(form.douches) };
    }
    if (form.type === 'APPARTEMENT' || form.type === 'STUDIO') {
      return { ...base, chambres: parseInt(form.chambres), douches: parseInt(form.douches), cuisines: parseInt(form.cuisines) };
    }
    if (form.type === 'BOUTIQUE') {
      return { ...base, douches: parseInt(form.douches), mezzanine: form.mezzanine };
    }
    return base;
  };

  const save = async (): Promise<boolean> => {
    setSaving(true); setError('');
    try {
      await axiosInstance.post(`logements/${logement_id}/compartiments/ajouter/`, buildPayload());
      return true;
    } catch (e: any) {
      setError("Erreur lors de l'ajout. Vérifiez les informations.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    const ok = await save();
    if (!ok) return;
    setAjoutesCount(c => c + 1);
    setAfterSaveMsg(`"${form.nom.trim()}" ajouté ✓ — enchaînons avec le suivant.`);
    setShowToast(true);
    setForm({ ...EMPTY_FORM });
    setStep(1);
  };

  const handleSaveAndFinish = async () => {
    const ok = await save();
    if (!ok) return;
    history.replace(`/logement/${logement_id}`, {
      flashMessage: ajoutesCount > 0
        ? `${ajoutesCount + 1} compartiments ajoutés à cet immeuble.`
        : `"${form.nom.trim()}" ajouté à cet immeuble.`,
    });
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
          {ajoutesCount > 0 && (
            <div className="comp-progress-banner g-animate">
              ✓ {ajoutesCount} compartiment{ajoutesCount > 1 ? 's' : ''} déjà ajouté{ajoutesCount > 1 ? 's' : ''} à cet immeuble
            </div>
          )}

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

          {/* ── ÉTAPE 2 — Désignation & loyer ── */}
          {step === 2 && (
            <div className="tf-section">
              {selectedType && (
                <div className="tf-info-box">
                  <p>{selectedType.icon} <strong>{selectedType.label}</strong></p>
                  <p className="tf-info-note">{selectedType.desc}</p>
                </div>
              )}
              <div className="g-input-group">
                <label className="g-label">Désignation / N° {form.type === 'BOUTIQUE' ? 'du local' : `du ${selectedType?.label.toLowerCase()}`} *</label>
                <input
                  className="g-input"
                  placeholder={`Ex: ${form.type === 'APPARTEMENT' ? 'Appartement A1' : form.type === 'STUDIO' ? 'Studio S1' : form.type === 'CHAMBRE' ? 'Chambre C1' : 'Boutique B1'}`}
                  value={form.nom}
                  onChange={e => set('nom', e.target.value)}
                />
              </div>
              <div className="g-input-group">
                <label className="g-label">Loyer mensuel (FCFA) *</label>
                <input
                  className="g-input"
                  type="number" inputMode="numeric" placeholder="50 000"
                  value={form.loyer_reference}
                  onChange={e => set('loyer_reference', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 — Composition (dynamique par type) ── */}
          {step === 3 && (
            <div className="tf-section">
              <p className="comp-section-title">Composition du compartiment</p>

              {form.type === 'CHAMBRE' && (
                <div className="comp-check-list">
                  <label className="comp-checkbox">
                    <input type="checkbox" checked={form.cuisines === '1'} onChange={e => set('cuisines', e.target.checked ? '1' : '0')} />
                    <span>🍳 Espace cuisine présent</span>
                  </label>
                  <label className="comp-checkbox">
                    <input type="checkbox" checked={form.douches === '1'} onChange={e => set('douches', e.target.checked ? '1' : '0')} />
                    <span>🚿 Salle de bain privée</span>
                  </label>
                </div>
              )}

              {(form.type === 'APPARTEMENT' || form.type === 'STUDIO') && (
                <>
                  <div className="comp-counter-grid">
                    <div className="comp-counter">
                      <p className="comp-counter__label">🛏 {form.type === 'STUDIO' ? 'Pièces / chambres' : 'Chambres'}</p>
                      <div className="comp-counter__controls">
                        <button onClick={() => set('chambres', String(Math.max(0, parseInt(form.chambres) - 1)))}>−</button>
                        <span>{form.chambres}</span>
                        <button onClick={() => set('chambres', String(parseInt(form.chambres) + 1))}>+</button>
                      </div>
                    </div>
                    <div className="comp-counter">
                      <p className="comp-counter__label">🚿 {form.type === 'STUDIO' ? 'Douches' : 'Salles de bain'}</p>
                      <div className="comp-counter__controls">
                        <button onClick={() => set('douches', String(Math.max(0, parseInt(form.douches) - 1)))}>−</button>
                        <span>{form.douches}</span>
                        <button onClick={() => set('douches', String(parseInt(form.douches) + 1))}>+</button>
                      </div>
                    </div>
                  </div>
                  <div className="comp-check-list" style={{ marginTop: '14px' }}>
                    <label className="comp-checkbox">
                      <input type="checkbox" checked={form.cuisines === '1'} onChange={e => set('cuisines', e.target.checked ? '1' : '0')} />
                      <span>🍳 {form.type === 'STUDIO' ? 'Espace cuisine' : 'Cuisine équipée / présente'}</span>
                    </label>
                  </div>
                </>
              )}

              {form.type === 'BOUTIQUE' && (
                <>
                  <div className="comp-check-list">
                    <label className="comp-checkbox">
                      <input type="checkbox" checked={form.mezzanine} onChange={e => set('mezzanine', e.target.checked)} />
                      <span>🏗 Présence d'une mezzanine</span>
                    </label>
                  </div>
                  <div className="comp-counter-grid" style={{ marginTop: '14px' }}>
                    <div className="comp-counter">
                      <p className="comp-counter__label">🚽 Salles de bain / WC</p>
                      <div className="comp-counter__controls">
                        <button onClick={() => set('douches', String(Math.max(0, parseInt(form.douches) - 1)))}>−</button>
                        <span>{form.douches}</span>
                        <button onClick={() => set('douches', String(parseInt(form.douches) + 1))}>+</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ÉTAPE 4 — Confirmation ── */}
          {step === 4 && (
            <div className="tf-section">
              <div className="tf-confirm">
                <p className="tf-confirm__title">✓ Récapitulatif</p>
                {[
                  ['Type', `${selectedType?.icon} ${selectedType?.label}`],
                  ['Désignation', form.nom],
                  ['Loyer mensuel', form.loyer_reference ? `${parseFloat(form.loyer_reference).toLocaleString('fr-FR')} FCFA` : '—'],
                  ...(form.type === 'CHAMBRE' ? [
                    ['Cuisine', form.cuisines === '1' ? 'Oui' : 'Non'],
                    ['Salle de bain privée', form.douches === '1' ? 'Oui' : 'Non'],
                  ] : []),
                  ...(form.type === 'APPARTEMENT' || form.type === 'STUDIO' ? [
                    [form.type === 'STUDIO' ? 'Pièces / chambres' : 'Chambres', form.chambres],
                    [form.type === 'STUDIO' ? 'Douches' : 'Salles de bain', form.douches],
                    ['Cuisine', form.cuisines === '1' ? 'Oui' : 'Non'],
                  ] : []),
                  ...(form.type === 'BOUTIQUE' ? [
                    ['Mezzanine', form.mezzanine ? 'Oui' : 'Non'],
                    ['Salles de bain / WC', form.douches],
                  ] : []),
                  ['Statut', '🔓 Libre'],
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
            {step < 4 && (
              <button className="g-btn g-btn--primary" onClick={next}>
                Suivant →
              </button>
            )}
          </div>

          {step === 4 && (
            <div className="comp-final-actions">
              <button className="g-btn g-btn--primary" onClick={handleSaveAndAddAnother} disabled={saving}>
                {saving ? '⏳ Enregistrement…' : '+ Enregistrer et ajouter un autre'}
              </button>
              <button className="g-btn g-btn--outline" onClick={handleSaveAndFinish} disabled={saving}>
                {saving ? '⏳ Enregistrement…' : 'Terminer et voir le logement →'}
              </button>
            </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          message={afterSaveMsg || location.state?.flashMessage || ''}
          duration={2500}
          position="top"
          color="success"
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddCompartimentForm;
