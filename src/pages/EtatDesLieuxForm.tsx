import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/EtatDesLieuxForm.css';

interface OccupantOption {
  id: number; nom_complet: string; compartiment_nom: string; logement_nom: string;
}
interface PreselectState {
  occupantId?: number; occupantNom?: string;
}
interface Piece {
  nom: string;
  included: boolean;
  elements: { nom: string; etat: string }[];
}
interface EdlHistorique {
  id: number; type: string; type_display: string; date_realisation: string; etat_general: string;
}

const ETAT_GENERAL_LABEL: Record<string, string> = { BON: 'Bon', MOYEN: 'Moyen', MAUVAIS: 'Mauvais' };

const DEFAULT_PIECES: { nom: string; elements: string[] }[] = [
  { nom: 'Salon',                       elements: ['Peinture', 'Électricité', 'Sol / Carrelage'] },
  { nom: 'Cuisine',                     elements: ['Peinture', 'Plomberie', 'Électricité', 'Évier'] },
  { nom: 'Chambre 1',                   elements: ['Peinture', 'Serrure', 'Fenêtre'] },
  { nom: 'Chambre 2',                   elements: ['Peinture', 'Serrure', 'Fenêtre'] },
  { nom: 'Salle de bain',               elements: ['Plomberie', 'Carrelage', 'Robinetterie'] },
  { nom: "Portail / Porte d'entrée",    elements: ['Serrure', 'Peinture'] },
  { nom: 'Compteur ENEO',               elements: ['État général', 'Index relevé'] },
  { nom: 'Compteur eau',                elements: ['État général', 'Index relevé'] },
];

const ETAT_OPTIONS = ['Bon', 'Moyen', 'Mauvais'];

const buildInitialPieces = (): Piece[] => DEFAULT_PIECES.map(p => ({
  nom: p.nom,
  included: p.nom === 'Salon' || p.nom === 'Cuisine',
  elements: p.elements.map(e => ({ nom: e, etat: 'Bon' })),
}));

const EtatDesLieuxForm: React.FC = () => {
  const history  = useHistory();
  const location = useLocation<PreselectState>();
  const preselectId  = location.state?.occupantId;
  const preselectNom = location.state?.occupantNom;

  const [occupants,     setOccupants]     = useState<OccupantOption[]>([]);
  const [occupantId,    setOccupantId]    = useState<number | ''>(preselectId || '');
  const [type,           setType]          = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [dateRealisation, setDateRealisation] = useState(new Date().toISOString().split('T')[0]);
  const [etatGeneral,    setEtatGeneral]   = useState('BON');
  const [clesRemises,    setClesRemises]   = useState('1');
  const [observations,   setObservations]  = useState('');
  const [pieces,         setPieces]        = useState<Piece[]>(buildInitialPieces());
  const [nouvellePiece,  setNouvellePiece]  = useState('');

  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState<number | null>(null);

  const [historique, setHistorique] = useState<EdlHistorique[]>([]);

  useEffect(() => {
    if (preselectId) return; // pas besoin de la liste si déjà pré-sélectionné depuis la fiche du compartiment
    axiosInstance.get('occupants/').then(r => setOccupants(r.data)).catch(console.error);
  }, [preselectId]);

  useEffect(() => {
    if (!occupantId) { setHistorique([]); return; }
    axiosInstance.get(`etat-des-lieux/?occupant_id=${occupantId}`)
      .then(r => setHistorique(r.data))
      .catch(console.error);
  }, [occupantId, success]);

  const togglePiece = (nom: string) => {
    setPieces(prev => prev.map(p => p.nom === nom ? { ...p, included: !p.included } : p));
  };

  const setElementEtat = (pieceNom: string, elementNom: string, etat: string) => {
    setPieces(prev => prev.map(p => p.nom !== pieceNom ? p : {
      ...p,
      elements: p.elements.map(e => e.nom === elementNom ? { ...e, etat } : e),
    }));
  };

  const ajouterPiece = () => {
    const nom = nouvellePiece.trim();
    if (!nom) return;
    if (pieces.some(p => p.nom.toLowerCase() === nom.toLowerCase())) { setNouvellePiece(''); return; }
    setPieces(prev => [...prev, { nom, included: true, elements: [{ nom: 'État général', etat: 'Bon' }] }]);
    setNouvellePiece('');
  };

  const handleSubmit = async () => {
    if (!occupantId) { setError('Sélectionnez un locataire.'); return; }
    setSaving(true); setError(''); setSuccess(null);

    const champs_details: Record<string, Record<string, string>> = {};
    pieces.filter(p => p.included).forEach(p => {
      champs_details[p.nom] = {};
      p.elements.forEach(e => { champs_details[p.nom][e.nom] = e.etat; });
    });

    try {
      const res = await axiosInstance.post('etat-des-lieux/', {
        occupant: occupantId,
        type,
        date_realisation: dateRealisation,
        etat_general: etatGeneral,
        cles_remises: parseInt(clesRemises) || 0,
        observations,
        champs_details,
      });
      setSuccess(res.data.id);
    } catch (e: any) {
      setError(e?.response?.data?.occupant?.[0] || "Erreur lors de l'enregistrement de l'état des lieux.");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = (edlId: number) => {
    const url = `${axiosInstance.defaults.baseURL}etat-des-lieux/${edlId}/pdf/`;
    fetch(url, { credentials: 'include' })
      .then(res => res.blob())
      .then(blob => window.open(URL.createObjectURL(blob), '_blank'))
      .catch(console.error);
  };

  const occupantNomAffiche = preselectNom || occupants.find(o => o.id === occupantId)?.nom_complet;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
            État des lieux
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="edl-content">
        <div className="g-page edl-wrap">

          {error && <p className="tf-error">⚠ {error}</p>}

          {success ? (
            <div className="edl-success g-animate">
              <div className="g-empty__icon">✅</div>
              <p className="edl-success__title">État des lieux enregistré</p>
              <p className="edl-success__sub">{occupantNomAffiche}</p>
              <div className="edl-success__actions">
                <button className="g-btn g-btn--primary" onClick={() => downloadPdf(success)}>
                  📄 Télécharger le PDF
                </button>
                <button className="g-btn g-btn--outline" onClick={() => {
                  setSuccess(null);
                  setObservations('');
                  setPieces(buildInitialPieces());
                }}>
                  + Nouvel état des lieux
                </button>
                <button className="g-btn g-btn--outline" onClick={() => history.goBack()}>
                  ← Retour
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Locataire */}
              <div className="g-input-group">
                <label className="g-label">Locataire *</label>
                {preselectId ? (
                  <div className="tf-locked-field">👤 {preselectNom}</div>
                ) : (
                  <select className="g-input" value={occupantId}
                    onChange={e => setOccupantId(e.target.value ? parseInt(e.target.value) : '')}>
                    <option value="">— Choisir un locataire —</option>
                    {occupants.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.nom_complet} — {o.logement_nom}{o.compartiment_nom ? ` / ${o.compartiment_nom}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Type + date */}
              <div className="edl-row">
                <div className="g-input-group">
                  <label className="g-label">Type</label>
                  <div className="edl-type-toggle">
                    <button
                      type="button"
                      className={`edl-type-btn ${type === 'ENTREE' ? 'edl-type-btn--active' : ''}`}
                      onClick={() => setType('ENTREE')}
                    >
                      🔑 Entrée
                    </button>
                    <button
                      type="button"
                      className={`edl-type-btn ${type === 'SORTIE' ? 'edl-type-btn--active' : ''}`}
                      onClick={() => setType('SORTIE')}
                    >
                      🚪 Sortie
                    </button>
                  </div>
                </div>
                <div className="g-input-group">
                  <label className="g-label">Date de réalisation</label>
                  <input className="g-input" type="date" value={dateRealisation}
                    onChange={e => setDateRealisation(e.target.value)} />
                </div>
              </div>

              <div className="edl-row">
                <div className="g-input-group">
                  <label className="g-label">État général constaté</label>
                  <select className="g-input" value={etatGeneral} onChange={e => setEtatGeneral(e.target.value)}>
                    <option value="BON">Bon</option>
                    <option value="MOYEN">Moyen</option>
                    <option value="MAUVAIS">Mauvais</option>
                  </select>
                </div>
                <div className="g-input-group">
                  <label className="g-label">Nombre de clés remises</label>
                  <input className="g-input" type="number" min="0" value={clesRemises}
                    onChange={e => setClesRemises(e.target.value)} />
                </div>
              </div>

              {/* Détail par pièce */}
              <div className="g-divider" />
              <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '10px' }}>Détail par pièce</p>
              <p className="edl-hint">Cochez les pièces concernées, puis précisez l'état de chaque élément.</p>

              <div className="edl-pieces">
                {pieces.map(piece => (
                  <div key={piece.nom} className={`edl-piece ${piece.included ? 'edl-piece--active' : ''}`}>
                    <label className="edl-piece__head">
                      <input type="checkbox" checked={piece.included} onChange={() => togglePiece(piece.nom)} />
                      <span>{piece.nom}</span>
                    </label>
                    {piece.included && (
                      <div className="edl-piece__elements">
                        {piece.elements.map(el => (
                          <div key={el.nom} className="edl-element">
                            <span className="edl-element__nom">{el.nom}</span>
                            <div className="edl-element__etats">
                              {ETAT_OPTIONS.map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`edl-etat-btn edl-etat-btn--${opt.toLowerCase()} ${el.etat === opt ? 'edl-etat-btn--active' : ''}`}
                                  onClick={() => setElementEtat(piece.nom, el.nom, opt)}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="edl-add-piece">
                <input
                  className="g-input" placeholder="Ajouter une pièce (ex : Balcon, Garage…)"
                  value={nouvellePiece}
                  onChange={e => setNouvellePiece(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') ajouterPiece(); }}
                />
                <button className="g-btn g-btn--outline edl-add-piece__btn" onClick={ajouterPiece}>+ Ajouter</button>
              </div>

              {/* Observations */}
              <div className="g-input-group" style={{ marginTop: '16px' }}>
                <label className="g-label">Observations</label>
                <textarea
                  className="g-input edl-textarea" rows={4}
                  placeholder="Traces d'usure, dégâts constatés, remarques diverses…"
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                />
              </div>

              <button className="g-btn g-btn--primary" onClick={handleSubmit} disabled={saving} style={{ marginTop: '8px' }}>
                {saving ? '⏳ Enregistrement…' : "✓ Enregistrer l'état des lieux"}
              </button>

              {/* Historique */}
              {occupantId !== '' && historique.length > 0 && (
                <>
                  <div className="g-divider" />
                  <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '10px' }}>États des lieux précédents</p>
                  <div className="edl-historique">
                    {historique.map(h => (
                      <div key={h.id} className="edl-hist-card">
                        <div>
                          <p className="edl-hist-card__type">{h.type_display}</p>
                          <p className="edl-hist-card__date">{new Date(h.date_realisation).toLocaleDateString('fr-FR')} · {ETAT_GENERAL_LABEL[h.etat_general] || h.etat_general}</p>
                        </div>
                        <button className="g-btn g-btn--outline edl-hist-card__btn" onClick={() => downloadPdf(h.id)}>📄 PDF</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EtatDesLieuxForm;
