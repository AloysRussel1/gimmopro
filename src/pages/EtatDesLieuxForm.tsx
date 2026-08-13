import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
} from '@ionic/react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { previewPdf as previewPdfBlob } from '../utils/pdf';
import '../assets/css/EtatDesLieuxForm.css';

interface OccupantOption {
  id: number; nom_complet: string; compartiment_nom: string; logement_nom: string;
}
interface PreselectState {
  occupantId?: number; occupantNom?: string;
}
interface ElementItem {
  nom: string;
  etat: string;
  remarque: string;
}
interface Piece {
  nom: string;
  elements: ElementItem[];
}
interface CleLigne {
  label: string;
  count: string;
}
interface EdlHistorique {
  id: number; type: string; type_display: string; date_realisation: string;
  etat_general: string; statut: string;
}
interface EdlDetail {
  id: number; occupant: number; type: 'ENTREE' | 'SORTIE'; date_realisation: string;
  etat_general: string; cles_remises: number; cles_details: Record<string, number>;
  compteurs: Record<string, string>; observations: string;
  champs_details: Record<string, Record<string, { etat: string; remarque?: string } | string>>;
  statut: string;
}

const ETAT_GENERAL_LABEL: Record<string, string> = { BON: 'Bon', MOYEN: 'Moyen', MAUVAIS: 'Mauvais' };

// Badge d'état par élément -- 5 niveaux demandés, regroupés sur les 3
// teintes déjà établies pour les statuts dans l'app (vert/orange/rouge,
// voir edl-etat-btn--bon/moyen/mauvais) plutôt que d'inventer une nouvelle
// palette à 5 teintes pour une nuance qui reste avant tout qualitative.
const ETAT_ELEMENT_OPTIONS: { value: string; classe: 'bon' | 'moyen' | 'mauvais' }[] = [
  { value: 'Neuf',           classe: 'bon' },
  { value: 'Bon état',       classe: 'bon' },
  { value: "État d'usage",   classe: 'moyen' },
  { value: 'Mauvais état',   classe: 'mauvais' },
  { value: 'Dégradé',        classe: 'mauvais' },
];

const DEFAULT_PIECES: { nom: string; elements: string[] }[] = [
  { nom: 'Salon',                    elements: ['Peinture', 'Électricité', 'Sol / Carrelage'] },
  { nom: 'Cuisine',                  elements: ['Peinture', 'Plomberie', 'Électricité', 'Évier'] },
  { nom: 'Salle de bain',            elements: ['Plomberie', 'Carrelage', 'Robinetterie'] },
  { nom: 'Chambre 1',                elements: ['Peinture', 'Serrure', 'Fenêtre'] },
];

const PIECES_SUGGESTIONS: { nom: string; elements: string[] }[] = [
  { nom: 'Chambre 2',                   elements: ['Peinture', 'Serrure', 'Fenêtre'] },
  { nom: 'Balcon',                      elements: ['État général', 'Garde-corps'] },
  { nom: "Portail / Porte d'entrée",    elements: ['Serrure', 'Peinture'] },
  { nom: 'Cave / Débarras',             elements: ['État général'] },
];

const CHAMPS_COMPTEURS: { cle: string; label: string }[] = [
  { cle: 'eau_froide',     label: 'Eau froide' },
  { cle: 'eau_chaude',     label: 'Eau chaude' },
  { cle: 'electricite_hp', label: 'Électricité (HP)' },
  { cle: 'electricite_hc', label: 'Électricité (HC)' },
  { cle: 'gaz',            label: 'Gaz' },
];

const CLES_PAR_DEFAUT: CleLigne[] = [
  { label: 'Clé logement',      count: '1' },
  { label: 'Boîte aux lettres', count: '1' },
  { label: 'Badge Vigik',       count: '0' },
];

const buildInitialPieces = (): Piece[] => DEFAULT_PIECES.map(p => ({
  nom: p.nom,
  elements: p.elements.map(e => ({ nom: e, etat: 'Bon état', remarque: '' })),
}));

// Reconstruit `pieces`/`cles` (structure éditable côté formulaire) à partir
// de la forme JSON stockée côté API -- gère aussi la rétrocompatibilité
// d'anciens constats où un élément est une simple chaîne ("Bon") plutôt
// qu'un objet {etat, remarque}.
const piecesDepuisChampsDetails = (champs: EdlDetail['champs_details']): Piece[] =>
  Object.entries(champs || {}).map(([nomPiece, elements]) => ({
    nom: nomPiece,
    elements: Object.entries(elements || {}).map(([nomEl, valeur]) => ({
      nom: nomEl,
      etat: typeof valeur === 'string' ? valeur : (valeur?.etat || 'Bon état'),
      remarque: typeof valeur === 'string' ? '' : (valeur?.remarque || ''),
    })),
  }));

const clesDepuisDetails = (details: Record<string, number> | undefined): CleLigne[] => {
  const entries = Object.entries(details || {});
  if (entries.length === 0) return CLES_PAR_DEFAUT;
  return entries.map(([label, count]) => ({ label, count: String(count) }));
};

const EtatDesLieuxForm: React.FC = () => {
  const history  = useHistory();
  const location = useLocation<PreselectState>();
  const { id: idParam } = useParams<{ id?: string }>();
  const editId = idParam ? parseInt(idParam, 10) : null;
  const preselectId  = location.state?.occupantId;
  const preselectNom = location.state?.occupantNom;

  const [occupants,     setOccupants]     = useState<OccupantOption[]>([]);
  const [occupantId,    setOccupantId]    = useState<number | ''>(preselectId || '');
  const [type,           setType]          = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [dateRealisation, setDateRealisation] = useState(new Date().toISOString().split('T')[0]);
  const [etatGeneral,    setEtatGeneral]   = useState('BON');
  const [cles,           setCles]          = useState<CleLigne[]>(CLES_PAR_DEFAUT);
  const [compteurs,      setCompteurs]     = useState<Record<string, string>>({});
  const [observations,   setObservations]  = useState('');
  const [pieces,         setPieces]        = useState<Piece[]>(buildInitialPieces());
  const [nouvellePiece,  setNouvellePiece]  = useState('');
  const [nouvelElement,  setNouvelElement]  = useState<Record<string, string>>({});
  const [statutActuel,   setStatutActuel]   = useState('Brouillon');

  const [loadingEdl, setLoadingEdl] = useState(!!editId);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState<number | null>(null);

  const [historique, setHistorique] = useState<EdlHistorique[]>([]);

  useEffect(() => {
    if (preselectId) return; // pas besoin de la liste si déjà pré-sélectionné depuis la fiche du compartiment
    axiosInstance.get('occupants/').then(r => setOccupants(r.data)).catch(console.error);
  }, [preselectId]);

  // Mode édition : charge un brouillon existant et pré-remplit le formulaire.
  useEffect(() => {
    if (!editId) return;
    axiosInstance.get<EdlDetail>(`etat-des-lieux/${editId}/`).then(r => {
      const d = r.data;
      setOccupantId(d.occupant);
      setType(d.type);
      setDateRealisation(d.date_realisation);
      setEtatGeneral(d.etat_general);
      setCompteurs(d.compteurs || {});
      setCles(clesDepuisDetails(d.cles_details));
      setObservations(d.observations || '');
      setPieces(piecesDepuisChampsDetails(d.champs_details));
      setStatutActuel(d.statut);
    }).catch(() => setError("Impossible de charger cet état des lieux.")).finally(() => setLoadingEdl(false));
  }, [editId]);

  useEffect(() => {
    if (!occupantId) { setHistorique([]); return; }
    axiosInstance.get(`etat-des-lieux/?occupant_id=${occupantId}`)
      .then(r => setHistorique(r.data))
      .catch(console.error);
  }, [occupantId, success]);

  const nomsPiecesExistants = useMemo(() => new Set(pieces.map(p => p.nom.toLowerCase())), [pieces]);

  const supprimerPiece = (nom: string) => {
    setPieces(prev => prev.filter(p => p.nom !== nom));
  };

  const setElementChamp = (pieceNom: string, elementNom: string, champ: 'etat' | 'remarque', valeur: string) => {
    setPieces(prev => prev.map(p => p.nom !== pieceNom ? p : {
      ...p,
      elements: p.elements.map(e => e.nom === elementNom ? { ...e, [champ]: valeur } : e),
    }));
  };

  const supprimerElement = (pieceNom: string, elementNom: string) => {
    setPieces(prev => prev.map(p => p.nom !== pieceNom ? p : {
      ...p, elements: p.elements.filter(e => e.nom !== elementNom),
    }));
  };

  const ajouterElement = (pieceNom: string) => {
    const nom = (nouvelElement[pieceNom] || '').trim();
    if (!nom) return;
    setPieces(prev => prev.map(p => p.nom !== pieceNom ? p : {
      ...p,
      elements: p.elements.some(e => e.nom.toLowerCase() === nom.toLowerCase())
        ? p.elements
        : [...p.elements, { nom, etat: 'Bon état', remarque: '' }],
    }));
    setNouvelElement(prev => ({ ...prev, [pieceNom]: '' }));
  };

  const ajouterPiece = (nom: string, elements: string[] = ['État général']) => {
    const nomPropre = nom.trim();
    if (!nomPropre || nomsPiecesExistants.has(nomPropre.toLowerCase())) { setNouvellePiece(''); return; }
    setPieces(prev => [...prev, { nom: nomPropre, elements: elements.map(e => ({ nom: e, etat: 'Bon état', remarque: '' })) }]);
    setNouvellePiece('');
  };

  const setCleLigne = (index: number, champ: 'label' | 'count', valeur: string) => {
    setCles(prev => prev.map((c, i) => i === index ? { ...c, [champ]: valeur } : c));
  };
  const ajouterCleLigne = () => setCles(prev => [...prev, { label: '', count: '1' }]);
  const supprimerCleLigne = (index: number) => setCles(prev => prev.filter((_, i) => i !== index));

  const totalCles = cles.reduce((somme, c) => somme + (parseInt(c.count) || 0), 0);

  const handleSubmit = async () => {
    if (!occupantId) { setError('Sélectionnez un locataire.'); return; }
    setSaving(true); setError(''); setSuccess(null);

    const champs_details: Record<string, Record<string, { etat: string; remarque: string }>> = {};
    pieces.forEach(p => {
      champs_details[p.nom] = {};
      p.elements.forEach(e => { champs_details[p.nom][e.nom] = { etat: e.etat, remarque: e.remarque }; });
    });

    const cles_details: Record<string, number> = {};
    cles.forEach(c => {
      const nom = c.label.trim();
      if (nom) cles_details[nom] = parseInt(c.count) || 0;
    });

    const compteursPropres = Object.fromEntries(
      Object.entries(compteurs).filter(([, v]) => (v || '').trim() !== '')
    );

    const payload = {
      occupant: occupantId,
      type,
      date_realisation: dateRealisation,
      etat_general: etatGeneral,
      cles_remises: totalCles,
      cles_details,
      compteurs: compteursPropres,
      observations,
      champs_details,
    };

    try {
      const res = editId
        ? await axiosInstance.put(`etat-des-lieux/${editId}/`, payload)
        : await axiosInstance.post('etat-des-lieux/', payload);
      setSuccess(res.data.id);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.occupant?.[0] || "Erreur lors de l'enregistrement de l'état des lieux.");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = (edlId: number) => {
    previewPdfBlob(`etat-des-lieux/${edlId}/pdf/`).catch(console.error);
  };

  const occupantNomAffiche = preselectNom || occupants.find(o => o.id === occupantId)?.nom_complet;
  const verrouille = statutActuel === 'Signé';

  if (loadingEdl) {
    return (
      <IonPage>
        <IonHeader><IonToolbar><IonTitle>État des lieux</IonTitle></IonToolbar></IonHeader>
        <IonContent className="edl-content"><div className="g-page"><p className="edl-hint">Chargement…</p></div></IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
            État des lieux {editId ? '— Brouillon' : ''}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="edl-content">
        <div className="g-page edl-wrap">

          {error && <p className="tf-error">⚠ {error}</p>}

          {verrouille ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">🔒</div>
              <p className="g-empty__text">Ce constat est signé et ne peut plus être modifié.</p>
              <button className="g-btn g-btn--primary" style={{ marginTop: '16px' }} onClick={() => editId && downloadPdf(editId)}>
                📄 Télécharger le PDF
              </button>
            </div>
          ) : success ? (
            <div className="edl-success g-animate">
              <div className="g-empty__icon">✅</div>
              <p className="edl-success__title">Brouillon enregistré</p>
              <p className="edl-success__sub">{occupantNomAffiche}</p>
              <div className="edl-success__actions">
                <button className="g-btn g-btn--primary" onClick={() => downloadPdf(success)}>
                  📄 Télécharger le PDF (brouillon)
                </button>
                <button className="g-btn g-btn--outline" onClick={() => {
                  setSuccess(null);
                  setObservations('');
                  setPieces(buildInitialPieces());
                  setCompteurs({});
                  setCles(CLES_PAR_DEFAUT);
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
                {preselectId || editId ? (
                  <div className="tf-locked-field">👤 {occupantNomAffiche}</div>
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

              <div className="g-input-group">
                <label className="g-label">État général constaté</label>
                <select className="g-input" value={etatGeneral} onChange={e => setEtatGeneral(e.target.value)}>
                  <option value="BON">Bon</option>
                  <option value="MOYEN">Moyen</option>
                  <option value="MAUVAIS">Mauvais</option>
                </select>
              </div>

              {/* Détail par pièce */}
              <div className="g-divider" />
              <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '4px' }}>Pièces & éléments</p>
              <p className="edl-hint">Ajoutez ou supprimez une pièce, puis précisez l'état de chaque élément.</p>

              <div className="edl-pieces">
                {pieces.map(piece => (
                  <div key={piece.nom} className="edl-piece">
                    <div className="edl-piece__head">
                      <span style={{ flex: 1 }}>{piece.nom}</span>
                      <button type="button" className="edl-remove-btn" title="Supprimer cette pièce" onClick={() => supprimerPiece(piece.nom)}>✕</button>
                    </div>

                    <div className="edl-piece__elements">
                      {piece.elements.map(el => (
                        <div key={el.nom} className="edl-element">
                          <div className="edl-element__top">
                            <span className="edl-element__nom">{el.nom}</span>
                            <button type="button" className="edl-remove-btn edl-remove-btn--sm" title="Supprimer cet élément" onClick={() => supprimerElement(piece.nom, el.nom)}>✕</button>
                          </div>
                          <div className="edl-element__etats">
                            {ETAT_ELEMENT_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                className={`edl-etat-btn edl-etat-btn--${opt.classe} ${el.etat === opt.value ? 'edl-etat-btn--active' : ''}`}
                                onClick={() => setElementChamp(piece.nom, el.nom, 'etat', opt.value)}
                              >
                                {opt.value}
                              </button>
                            ))}
                          </div>
                          <input
                            className="g-input edl-remarque-input"
                            placeholder="Remarque rapide (optionnel)…"
                            value={el.remarque}
                            onChange={e => setElementChamp(piece.nom, el.nom, 'remarque', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="edl-add-element">
                      <input
                        className="g-input" placeholder="+ élément (ex : Prise électrique Sud)"
                        value={nouvelElement[piece.nom] || ''}
                        onChange={e => setNouvelElement(prev => ({ ...prev, [piece.nom]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') ajouterElement(piece.nom); }}
                      />
                      <button type="button" className="g-btn g-btn--outline edl-add-piece__btn" onClick={() => ajouterElement(piece.nom)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="edl-add-piece">
                <input
                  className="g-input" placeholder="Ajouter une pièce (ex : Garage…)"
                  value={nouvellePiece}
                  onChange={e => setNouvellePiece(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') ajouterPiece(nouvellePiece); }}
                />
                <button className="g-btn g-btn--outline edl-add-piece__btn" onClick={() => ajouterPiece(nouvellePiece)}>+ Ajouter</button>
              </div>

              {PIECES_SUGGESTIONS.some(s => !nomsPiecesExistants.has(s.nom.toLowerCase())) && (
                <div className="edl-suggestions">
                  {PIECES_SUGGESTIONS.filter(s => !nomsPiecesExistants.has(s.nom.toLowerCase())).map(s => (
                    <button key={s.nom} type="button" className="edl-suggestion-chip" onClick={() => ajouterPiece(s.nom, s.elements)}>
                      + {s.nom}
                    </button>
                  ))}
                </div>
              )}

              {/* Compteurs */}
              <div className="g-divider" />
              <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '10px' }}>Compteurs</p>
              <div className="edl-compteurs-grid">
                {CHAMPS_COMPTEURS.map(c => (
                  <div className="g-input-group" key={c.cle} style={{ margin: 0 }}>
                    <label className="g-label">{c.label}</label>
                    <input
                      className="g-input" placeholder="Index relevé"
                      value={compteurs[c.cle] || ''}
                      onChange={e => setCompteurs(prev => ({ ...prev, [c.cle]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              {/* Clés & badges */}
              <div className="g-divider" />
              <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '10px' }}>Clés & badges remis</p>
              <div className="edl-cles">
                {cles.map((c, i) => (
                  <div className="edl-cle-row" key={i}>
                    <input
                      className="g-input" placeholder="Ex : Clé logement"
                      value={c.label} onChange={e => setCleLigne(i, 'label', e.target.value)}
                    />
                    <input
                      className="g-input edl-cle-row__count" type="number" min="0"
                      value={c.count} onChange={e => setCleLigne(i, 'count', e.target.value)}
                    />
                    <button type="button" className="edl-remove-btn" title="Supprimer" onClick={() => supprimerCleLigne(i)}>✕</button>
                  </div>
                ))}
                <button type="button" className="g-btn g-btn--outline edl-add-piece__btn" onClick={ajouterCleLigne}>+ Ajouter une clé</button>
              </div>
              <p className="edl-hint" style={{ marginTop: '6px' }}>Total : {totalCles} clé{totalCles !== 1 ? 's' : ''}/badge{totalCles !== 1 ? 's' : ''}</p>

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
                {saving ? '⏳ Enregistrement…' : '💾 Enregistrer le brouillon'}
              </button>
              <p className="edl-hint" style={{ textAlign: 'center', marginTop: '8px' }}>
                La signature et la finalisation du constat se feront dans une étape à venir.
              </p>

              {/* Historique */}
              {occupantId !== '' && historique.length > 0 && (
                <>
                  <div className="g-divider" />
                  <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '10px' }}>États des lieux précédents</p>
                  <div className="edl-historique">
                    {historique.map(h => (
                      <div key={h.id} className="edl-hist-card">
                        <div>
                          <p className="edl-hist-card__type">
                            {h.type_display}
                            <span className={`g-badge ${h.statut === 'Signé' ? 'g-badge--green' : 'g-badge--gray'}`} style={{ marginLeft: '8px' }}>
                              {h.statut}
                            </span>
                          </p>
                          <p className="edl-hist-card__date">{new Date(h.date_realisation).toLocaleDateString('fr-FR')} · {ETAT_GENERAL_LABEL[h.etat_general] || h.etat_general}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {h.statut === 'Brouillon' && h.id !== editId && (
                            <button className="g-btn g-btn--outline edl-hist-card__btn" onClick={() => history.push(`/etat-des-lieux/${h.id}/modifier`)}>✏️ Modifier</button>
                          )}
                          <button className="g-btn g-btn--outline edl-hist-card__btn" onClick={() => downloadPdf(h.id)}>📄 PDF</button>
                        </div>
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
