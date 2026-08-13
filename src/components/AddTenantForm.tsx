import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonProgressBar,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { isPossiblePhoneNumber } from 'react-phone-number-input';
import axiosInstance from '../api/axiosConfig';
import PhoneInput from './common/PhoneInput';
import '../assets/css/AddTenantForm.css';

interface Logement     { id: number; nom: string; }
interface Compartiment { id: number; nom: string; type: string; loyer_reference: string | null; }
interface PreselectState {
  preselectLogementId?: number; preselectLogementNom?: string;
  preselectCompartimentId?: number; preselectCompartimentNom?: string;
  preselectCompartimentType?: string; preselectLoyerReference?: string | null;
}

const STEPS = [
  'Informations personnelles',
  'Contact & Identité',
  'Logement & Compartiment',
  'Conditions du bail',
  'Confirmation',
];

const TYPE_LABEL: Record<string, string> = {
  STUDIO: 'Studio', CHAMBRE: 'Chambre',
  APPARTEMENT: 'Appartement', BOUTIQUE: 'Boutique',
};

const AddTenantForm: React.FC = () => {
  const history  = useHistory();
  const location = useLocation<PreselectState>();
  const [step,    setStep]   = useState(1);
  const [saving,  setSaving] = useState(false);
  const [error,   setError]  = useState('');

  const [logements,     setLogements]     = useState<Logement[]>([]);
  const [compartiments, setCompartiments] = useState<Compartiment[]>([]);

  const preselect = location.state?.preselectCompartimentId ? location.state : null;
  const locked = !!preselect;

  const [form, setForm] = useState({
    nom_complet:            '',
    email:                  '',
    telephone:              '',
    cni:                    '',
    logement:               preselect ? String(preselect.preselectLogementId) : '',
    compartiment:           preselect ? String(preselect.preselectCompartimentId) : '',
    date_debut_contrat:     '',
    date_fin_contrat:       '',
    loyer:                  preselect?.preselectLoyerReference ? String(preselect.preselectLoyerReference) : '',
    caution:                '',
    date_versement_caution: '',
    date_prochain_paiement: '',
  });

  useEffect(() => {
    if (locked) return; // pas besoin de la liste des logements si déjà pré-sélectionné
    axiosInstance.get('logements/').then(r => setLogements(r.data)).catch(console.error);
  }, [locked]);

  useEffect(() => {
    if (locked || !form.logement) { setCompartiments([]); return; }
    axiosInstance.get(`logements/${form.logement}/compartiments/?statut=LIBRE`)
      .then(r => setCompartiments(r.data))
      .catch(console.error);
  }, [form.logement, locked]);

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = (): string => {
    if (step === 1 && !form.nom_complet)  return 'Le nom complet est requis.';
    if (step === 2 && !form.telephone)    return 'Le téléphone est requis.';
    // Cohérent avec is_possible_number() côté backend (voir normaliser_telephone_e164) --
    // signale une saisie incomplète tout de suite plutôt qu'un 400 tardif au moment
    // du "Confirmer" final, plusieurs étapes plus loin.
    if (step === 2 && !isPossiblePhoneNumber(form.telephone)) return 'Numéro de téléphone incomplet ou invalide.';
    if (step === 2 && !form.cni)          return 'Le numéro CNI est requis.';
    if (step === 3 && !form.logement)     return 'Sélectionnez un logement.';
    if (step === 3 && !form.compartiment) return 'Sélectionnez un compartiment.';
    if (step === 4 && !form.date_debut_contrat) return 'La date d\'entrée est requise.';
    if (step === 4 && !form.loyer)        return 'Le loyer est requis.';
    if (step === 4 && !form.date_prochain_paiement) return 'La date du prochain paiement est requise.';
    return '';
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const selectedComp = locked
    ? { id: preselect!.preselectCompartimentId!, nom: preselect!.preselectCompartimentNom!, type: preselect!.preselectCompartimentType! }
    : compartiments.find(c => String(c.id) === form.compartiment);
  const selectedLog = locked
    ? { id: preselect!.preselectLogementId!, nom: preselect!.preselectLogementNom! }
    : logements.find(l => String(l.id) === form.logement);

  const handleSubmit = async () => {
    setSaving(true); setError('');
    try {
      await axiosInstance.post('occupants/', {
        nom_complet:            form.nom_complet,
        email:                  form.email || `${form.cni.toLowerCase()}@gimmopro.local`,
        telephone:              form.telephone,
        cni:                    form.cni,
        logement:               parseInt(form.logement),
        compartiment:           parseInt(form.compartiment),
        date_debut_contrat:     form.date_debut_contrat,
        date_fin_contrat:       form.date_fin_contrat || null,
        loyer:                  parseFloat(form.loyer),
        caution_versee:         form.caution ? parseFloat(form.caution) : 0,
        date_versement_caution: form.date_versement_caution || null,
        date_prochain_paiement: form.date_prochain_paiement,
        statut:                 'Actif',
        actif:                  true,
      });
      history.replace('/locataire');
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.compartiment) setError(data.compartiment[0] || 'Compartiment invalide.');
      else if (data?.cni)       setError('Ce numéro CNI existe déjà.');
      else if (data?.email)     setError('Cet email est déjà utilisé.');
      else if (data?.telephone) setError(data.telephone[0] || 'Numéro de téléphone invalide.');
      else setError('Erreur lors de l\'enregistrement. Vérifiez les informations.');
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

          <IonProgressBar value={step / STEPS.length} />
          <p className="tf-step-label">Étape {step}/{STEPS.length} — {STEPS[step - 1]}</p>

          {error && <p className="tf-error">⚠ {error}</p>}

          {/* ── ÉTAPE 1 — Infos personnelles ── */}
          {step === 1 && (
            <div className="tf-section">
              <div className="g-input-group">
                <label className="g-label">Nom complet *</label>
                <input className="g-input" placeholder="Jean Dupont"
                  value={form.nom_complet}
                  onChange={e => set('nom_complet', e.target.value)} />
              </div>
              <div className="g-input-group">
                <label className="g-label">Email <span className="tf-optional">(optionnel)</span></label>
                <input className="g-input" type="email" placeholder="jean@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 — Contact & Identité ── */}
          {step === 2 && (
            <div className="tf-section">
              <div className="g-input-group">
                <label className="g-label">Téléphone *</label>
                <PhoneInput
                  value={form.telephone}
                  onChange={v => set('telephone', v)}
                  required
                />
              </div>
              <div className="g-input-group">
                <label className="g-label">Numéro CNI *</label>
                <input className="g-input" placeholder="1234567890123"
                  value={form.cni}
                  onChange={e => set('cni', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 — Logement & Compartiment ── */}
          {step === 3 && (
            <div className="tf-section">
              {locked ? (
                <>
                  <p className="tf-info-note" style={{ marginBottom: '14px' }}>
                    Pré-sélectionnés depuis la fiche du compartiment — pas besoin de les rechoisir.
                  </p>
                  <div className="g-input-group">
                    <label className="g-label">Logement</label>
                    <div className="tf-locked-field">🏠 {selectedLog?.nom}</div>
                  </div>
                  <div className="g-input-group">
                    <label className="g-label">Compartiment</label>
                    <div className="tf-locked-field">🚪 {selectedComp?.nom} ({TYPE_LABEL[selectedComp?.type || ''] || selectedComp?.type})</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="g-input-group">
                    <label className="g-label">Logement *</label>
                    <select className="g-input" value={form.logement}
                      onChange={e => { set('logement', e.target.value); set('compartiment', ''); }}>
                      <option value="">— Choisir un logement —</option>
                      {logements.map(l => (
                        <option key={l.id} value={l.id}>{l.nom}</option>
                      ))}
                    </select>
                  </div>

                  {form.logement && (
                    <div className="g-input-group">
                      <label className="g-label">Compartiment disponible *</label>
                      {compartiments.length === 0 ? (
                        <div className="tf-no-comp">
                          <span>🔒</span>
                          <span>Aucun compartiment libre dans ce logement</span>
                        </div>
                      ) : (
                        <div className="tf-comp-list">
                          {compartiments.map(c => (
                            <button
                              key={c.id}
                              className={`tf-comp-btn ${form.compartiment === String(c.id) ? 'tf-comp-btn--active' : ''}`}
                              onClick={() => {
                                set('compartiment', String(c.id));
                                if (!form.loyer && c.loyer_reference) set('loyer', String(c.loyer_reference));
                              }}
                            >
                              <span className="tf-comp-btn__nom">{c.nom}</span>
                              <span className="tf-comp-btn__type">{TYPE_LABEL[c.type] || c.type}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ÉTAPE 4 — Conditions du bail ── */}
          {step === 4 && (
            <div className="tf-section">
              <div className="tf-info-box">
                <p>🏠 <strong>{selectedLog?.nom}</strong></p>
                <p>🚪 {selectedComp?.nom} ({TYPE_LABEL[selectedComp?.type || ''] || selectedComp?.type})</p>
                <p className="tf-info-note">Le numéro de contrat sera généré automatiquement</p>
              </div>

              <div className="g-input-group">
                <label className="g-label">Date d'entrée *</label>
                <input className="g-input" type="date"
                  value={form.date_debut_contrat}
                  onChange={e => set('date_debut_contrat', e.target.value)} />
              </div>

              <div className="g-input-group">
                <label className="g-label">Loyer mensuel (FCFA) *</label>
                <input className="g-input" type="number" placeholder="50 000"
                  value={form.loyer}
                  onChange={e => set('loyer', e.target.value)} />
              </div>

              <div className="g-input-group">
                <label className="g-label">Dépôt de garantie / Caution versée (FCFA) <span className="tf-optional">(optionnel)</span></label>
                <input className="g-input" type="number" inputMode="numeric" placeholder="0"
                  value={form.caution}
                  onChange={e => set('caution', e.target.value)} />
              </div>

              <div className="g-input-group">
                <label className="g-label">Date de versement de la caution <span className="tf-optional">(optionnel)</span></label>
                <input className="g-input" type="date"
                  value={form.date_versement_caution}
                  onChange={e => set('date_versement_caution', e.target.value)} />
              </div>

              <div className="g-input-group">
                <label className="g-label">Date de fin de bail <span className="tf-optional">(optionnel — laisser vide si durée indéterminée)</span></label>
                <input className="g-input" type="date"
                  value={form.date_fin_contrat}
                  onChange={e => set('date_fin_contrat', e.target.value)} />
              </div>

              <div className="g-input-group">
                <label className="g-label">Date du prochain paiement *</label>
                <input className="g-input" type="date"
                  value={form.date_prochain_paiement}
                  onChange={e => set('date_prochain_paiement', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── ÉTAPE 5 — Confirmation ── */}
          {step === 5 && (
            <div className="tf-section">
              <div className="tf-confirm">
                <p className="tf-confirm__title">✓ Récapitulatif</p>
                {[
                  ['Nom complet',       form.nom_complet],
                  ['Téléphone',         form.telephone],
                  ['CNI',               form.cni],
                  ['Logement',          selectedLog?.nom || '—'],
                  ['Compartiment',      selectedComp ? `${selectedComp.nom} (${TYPE_LABEL[selectedComp.type]})` : '—'],
                  ['Date d\'entrée',    form.date_debut_contrat],
                  ['Loyer',             `${parseFloat(form.loyer || '0').toLocaleString('fr-FR')} FCFA / mois`],
                  ['Dépôt de garantie', form.caution ? `${parseFloat(form.caution).toLocaleString('fr-FR')} FCFA` : 'Aucun'],
                  ['Fin de bail',       form.date_fin_contrat || 'Durée indéterminée'],
                  ['Prochain paiement', form.date_prochain_paiement],
                  ['N° Contrat',        '🔄 Généré automatiquement'],
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
            {step < 5 ? (
              <button className="g-btn g-btn--primary" onClick={next}>
                Suivant →
              </button>
            ) : (
              <button className="g-btn g-btn--primary" onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ Enregistrement…' : '✓ Confirmer'}
              </button>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddTenantForm;