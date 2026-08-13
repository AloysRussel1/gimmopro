import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar, IonModal, IonToast,
} from '@ionic/react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig';
import DocumentsSection from '../components/DocumentsSection';
import OccupantDocumentsHub, { OccupantDocumentsRef } from '../components/OccupantDocumentsHub';
import './../assets/css/LogementDetails.css';

interface OccupantMini {
  id: number; nom_complet: string; telephone: string;
  loyer: string; date_prochain_paiement: string; statut: string;
}
interface Compartiment {
  id: number; type: string; nom: string; statut: string;
  logement: number; chambres: number; salons: number;
  douches: number; cuisines: number;
  loyer_reference: string | null; mezzanine: boolean;
  occupant_actuel: OccupantMini | null;
}
interface Logement {
  id: number; nom: string; localisation: string; description: string;
  nb_compartiments: number; nb_occupes: number; nb_libres: number;
}
interface Historique {
  id: number; nom_occupant: string; date_entree: string;
  date_sortie: string | null; loyer: string; duree_jours: number;
}
interface HistoriqueLocataire {
  id: number; occupant: number | null; nom_occupant: string; compartiment_nom: string;
  date_entree: string; date_sortie: string | null; loyer: string; duree_jours: number;
}
interface Depense {
  id: number; logement: number; libelle: string;
  montant: string; date: string; categorie: string; note: string;
}

const TYPE_LABEL: Record<string, string> = {
  STUDIO: 'Studio', CHAMBRE: 'Chambre',
  APPARTEMENT: 'Appartement', BOUTIQUE: 'Boutique',
};

const CATEGORIE_LABEL: Record<string, string> = {
  REPARATION: '🔧 Réparations', ELECTRICITE: '⚡ Électricité', EAU: '💧 Eau',
  TAXE: '📋 Taxe', ENTRETIEN: '🧹 Entretien', AUTRE: '📌 Autre',
};

const LogementDetailsPage: React.FC = () => {
  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('Tous');
  const [compartiments, setCompartiments] = useState<Compartiment[]>([]);
  const [logement,      setLogement]      = useState<Logement | null>(null);
  const [loading,       setLoading]       = useState(true);

  // Historique (par compartiment -- vue rapide existante)
  const [showHistorique,   setShowHistorique]   = useState(false);
  const [historiqueData,   setHistoriqueData]   = useState<Historique[]>([]);
  const [historiqueComp,   setHistoriqueComp]   = useState<string>('');
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  // Historique des locataires -- ÉTAPE 3 : chronologie complète à l'échelle
  // du LOGEMENT entier (tous compartiments confondus), avec accès aux
  // documents/paiements de chaque ancien occupant. Rien n'est masqué au
  // départ d'un locataire (voir HistoriqueLogementView côté backend).
  const [showHistLocataires,  setShowHistLocataires]  = useState(false);
  const [histLocataires,      setHistLocataires]      = useState<HistoriqueLocataire[]>([]);
  const [loadingHistLoc,      setLoadingHistLoc]      = useState(false);
  const [histDocsOccupant,    setHistDocsOccupant]    = useState<OccupantDocumentsRef | null>(null);
  const [loadingHistDocs,     setLoadingHistDocs]     = useState(false);

  // Documents
  const [showDocuments, setShowDocuments] = useState(false);

  // Dépenses
  const [showDepenses,  setShowDepenses]  = useState(false);
  const [depenses,      setDepenses]      = useState<Depense[]>([]);
  const [savingDepense, setSavingDepense] = useState(false);
  const [depenseError,  setDepenseError]  = useState('');
  const [depenseForm, setDepenseForm] = useState({
    libelle: '', montant: '', date: new Date().toISOString().split('T')[0], categorie: 'AUTRE',
  });

  const history  = useHistory();
  const location = useLocation<{ flashMessage?: string }>();
  const { id }   = useParams<{ id: string }>();
  const [showToast, setShowToast] = useState(!!location.state?.flashMessage);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      axiosInstance.get(`logements/${id}/`),
      axiosInstance.get(`logements/${id}/compartiments/`),
      axiosInstance.get(`depenses/?logement_id=${id}`),
    ]).then(([lRes, cRes, dRes]) => {
      setLogement(lRes.data);
      setCompartiments(cRes.data);
      setDepenses(dRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const totalDepenses = depenses.reduce((sum, d) => sum + parseFloat(d.montant), 0);

  const handleAddDepense = async () => {
    if (!depenseForm.libelle.trim()) { setDepenseError('Le libellé est requis.'); return; }
    if (!depenseForm.montant)        { setDepenseError('Le montant est requis.'); return; }
    setSavingDepense(true); setDepenseError('');
    try {
      const res = await axiosInstance.post('depenses/', {
        logement: parseInt(id), libelle: depenseForm.libelle.trim(),
        montant: parseFloat(depenseForm.montant), date: depenseForm.date,
        categorie: depenseForm.categorie,
      });
      setDepenses(prev => [res.data, ...prev]);
      setDepenseForm({ libelle: '', montant: '', date: new Date().toISOString().split('T')[0], categorie: 'AUTRE' });
    } catch {
      setDepenseError("Erreur lors de l'enregistrement.");
    } finally {
      setSavingDepense(false);
    }
  };

  const handleDeleteDepense = async (depenseId: number) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    await axiosInstance.delete(`depenses/${depenseId}/`);
    setDepenses(prev => prev.filter(d => d.id !== depenseId));
  };

  const filtered = compartiments.filter(c => {
    const typeOk = filter === 'Tous' || c.type === filter;
    const nameOk = c.nom.toLowerCase().includes(search.toLowerCase());
    return typeOk && nameOk;
  });

  const handleDelete = async (cid: number) => {
    if (!window.confirm('Supprimer ce compartiment ?')) return;
    await axiosInstance.delete(`compartiments/${cid}/`);
    setCompartiments(prev => prev.filter(c => c.id !== cid));
  };

  const handleLiberer = async (occupantId: number, nom: string) => {
    if (!window.confirm(`Confirmer le départ de ${nom} ?`)) return;
    await axiosInstance.post(`occupants/${occupantId}/liberer/`);
    const res = await axiosInstance.get(`logements/${id}/compartiments/`);
    setCompartiments(res.data);
    // Refresh logement stats
    const lRes = await axiosInstance.get(`logements/${id}/`);
    setLogement(lRes.data);
  };

  const handleHistorique = async (cid: number, nom: string) => {
    setHistoriqueComp(nom);
    setShowHistorique(true);
    setLoadingHistorique(true);
    try {
      const res = await axiosInstance.get(`compartiments/${cid}/historique/`);
      setHistoriqueData(res.data);
    } catch {
      setHistoriqueData([]);
    } finally {
      setLoadingHistorique(false);
    }
  };

  const handleHistoriqueLocataires = async () => {
    setShowHistLocataires(true);
    setLoadingHistLoc(true);
    try {
      const res = await axiosInstance.get(`logements/${id}/historique-locataires/`);
      setHistLocataires(res.data);
    } catch {
      setHistLocataires([]);
    } finally {
      setLoadingHistLoc(false);
    }
  };

  // Ouvre le hub Documents & Reçus pour un ANCIEN occupant -- fonctionne
  // aussi bien pour un locataire actuel que pour un locataire parti :
  // get_occupant_or_404 (backend) ne filtre jamais par actif=True.
  const openHistDocs = async (occupantId: number) => {
    setLoadingHistDocs(true);
    try {
      const res = await axiosInstance.get(`occupants/${occupantId}/`);
      setHistDocsOccupant(res.data);
    } catch {
      window.alert("Ce locataire n'existe plus (supprimé) -- ses documents ne sont plus disponibles, seul l'historique de séjour ci-contre subsiste.");
    } finally {
      setLoadingHistDocs(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
            {logement?.nom || 'Logement'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="logement-details-content">
        <div className="g-page">

          {/* Stats */}
          {logement && (
            <div className="ld-header g-animate">
              <p className="ld-header__name">{logement.nom}</p>
              <p className="ld-header__loc">📍 {logement.localisation}</p>
              {logement.description && (
                <p className="ld-header__desc">{logement.description}</p>
              )}
              <div className="ld-stats">
                <div className="ld-stat">
                  <span className="ld-stat__val">{logement.nb_compartiments}</span>
                  <span className="ld-stat__label">Total</span>
                </div>
                <div className="ld-stat ld-stat--green">
                  <span className="ld-stat__val">{logement.nb_libres}</span>
                  <span className="ld-stat__label">Libres</span>
                </div>
                <div className="ld-stat ld-stat--gold">
                  <span className="ld-stat__val">{logement.nb_occupes}</span>
                  <span className="ld-stat__label">Occupés</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="ld-controls g-animate g-animate--1">
            <IonSearchbar
              className="ld-search"
              value={search}
              onIonInput={e => setSearch(e.detail.value!)}
              placeholder="Rechercher…"
            />
            <div className="ld-actions-row">
              <button
                className="ld-add-btn"
                onClick={() => history.push(`/logement/${id}/ajouter-compartiment`)}
              >
                + Compartiment
              </button>
              <button className="ld-add-btn ld-add-btn--outline" onClick={() => setShowDepenses(true)}>
                💰 Dépenses{depenses.length > 0 ? ` (${totalDepenses.toLocaleString('fr-FR')} F)` : ''}
              </button>
              <button className="ld-add-btn ld-add-btn--outline" onClick={() => setShowDocuments(true)}>
                📎 Documents
              </button>
              <button className="ld-add-btn ld-add-btn--outline" onClick={handleHistoriqueLocataires}>
                🕓 Historique locataires
              </button>
            </div>
          </div>

          <select className="ld-filter g-animate g-animate--1"
            value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="Tous">Tous les types</option>
            <option value="APPARTEMENT">Appartements</option>
            <option value="STUDIO">Studios</option>
            <option value="CHAMBRE">Chambres</option>
            <option value="BOUTIQUE">Boutiques</option>
          </select>

          {loading ? (
            <div className="g-loading"><div className="g-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">🏘️</div>
              <p className="g-empty__text">Aucun compartiment trouvé</p>
            </div>
          ) : (
            <div className="ld-list">
              {filtered.map((c, i) => (
                <div key={c.id} className={`ld-card g-animate g-animate--${Math.min(i+1,5)}`}>

                  {/* Header */}
                  <div className="ld-card__head">
                    <div>
                      <p className="ld-card__name">{c.nom}</p>
                      <p className="ld-card__type">{TYPE_LABEL[c.type] || c.type}</p>
                    </div>
                    <span className={`g-badge ${c.statut === 'LIBRE' ? 'g-badge--green' : 'g-badge--gold'}`}>
                      {c.statut === 'LIBRE' ? '🔓 Libre' : '🔒 Occupé'}
                    </span>
                  </div>

                  {/* Pièces */}
                  <div className="ld-rooms">
                    {c.chambres > 0 && <span className="ld-room-pill">🛏 {c.chambres} ch.</span>}
                    {c.salons   > 0 && <span className="ld-room-pill">🛋 {c.salons} sal.</span>}
                    {c.douches  > 0 && <span className="ld-room-pill">🚿 {c.douches} dch.</span>}
                    {c.cuisines > 0 && <span className="ld-room-pill">🍳 {c.cuisines > 1 ? `${c.cuisines} cuisines` : 'cuisine'}</span>}
                    {c.mezzanine && <span className="ld-room-pill">🏗 mezzanine</span>}
                  </div>

                  {/* Loyer de référence (utile surtout tant que le compartiment est libre) */}
                  {c.loyer_reference && !c.occupant_actuel && (
                    <p className="ld-loyer-ref">
                      Loyer demandé : <strong>{parseFloat(c.loyer_reference).toLocaleString('fr-FR')} FCFA/mois</strong>
                    </p>
                  )}

                  {/* Occupant actuel */}
                  {c.occupant_actuel ? (
                    <div className="ld-occupant">
                      <div className="ld-occupant__info">
                        <p className="ld-occupant__name">👤 {c.occupant_actuel.nom_complet}</p>
                        <p className="ld-occupant__detail">
                          {parseFloat(c.occupant_actuel.loyer).toLocaleString('fr-FR')} FCFA/mois
                        </p>
                        <p className={`ld-occupant__statut ${c.occupant_actuel.statut === 'En retard' ? 'ld-retard' : 'ld-actif'}`}>
                          {c.occupant_actuel.statut === 'En retard' ? '⚠ En retard' : '✓ À jour'}
                          {' · Prochain : '}{new Date(c.occupant_actuel.date_prochain_paiement).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="ld-occupant__btns">
                        <button
                          className="g-btn g-btn--outline ld-liberer-btn"
                          onClick={() => history.push('/etat-des-lieux/nouveau', {
                            occupantId: c.occupant_actuel!.id,
                            occupantNom: c.occupant_actuel!.nom_complet,
                          })}
                        >
                          📝 État des lieux
                        </button>
                        <button
                          className="g-btn g-btn--danger ld-liberer-btn"
                          onClick={() => handleLiberer(c.occupant_actuel!.id, c.occupant_actuel!.nom_complet)}
                        >
                          🚪 Départ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ld-libre-msg">
                      <span>🔓 Compartiment libre</span>
                      <button
                        className="g-btn g-btn--primary ld-assign-btn"
                        onClick={() => history.push('/ajouter-locataire', {
                          preselectLogementId: logement!.id,
                          preselectLogementNom: logement!.nom,
                          preselectCompartimentId: c.id,
                          preselectCompartimentNom: c.nom,
                          preselectCompartimentType: c.type,
                          preselectLoyerReference: c.loyer_reference,
                        })}
                      >
                        + Assigner
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="ld-card__actions">
                    <button
                      className="g-btn g-btn--outline ld-btn"
                      onClick={() => handleHistorique(c.id, c.nom)}
                    >
                      📋 Historique
                    </button>
                    <button
                      className="g-btn g-btn--danger ld-btn"
                      onClick={() => handleDelete(c.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Historique */}
        <IonModal isOpen={showHistorique} onDidDismiss={() => setShowHistorique(false)}>
          <div className="hist-modal">
            <div className="hist-modal__head">
              <div>
                <p className="hist-modal__title">Historique</p>
                <p className="hist-modal__comp">{historiqueComp}</p>
              </div>
              <button className="pay-modal__close" onClick={() => setShowHistorique(false)}>✕</button>
            </div>

            {loadingHistorique ? (
              <div className="g-loading"><div className="g-spinner" /></div>
            ) : historiqueData.length === 0 ? (
              <div className="g-empty">
                <div className="g-empty__icon">📋</div>
                <p className="g-empty__text">Aucun historique disponible</p>
              </div>
            ) : (
              <div className="hist-list">
                {historiqueData.map((h, i) => (
                  <div key={h.id} className={`hist-card ${!h.date_sortie ? 'hist-card--actif' : ''}`}>
                    <div className="hist-card__head">
                      <p className="hist-card__nom">👤 {h.nom_occupant}</p>
                      <span className={`g-badge ${!h.date_sortie ? 'g-badge--green' : 'g-badge--gray'}`}>
                        {!h.date_sortie ? 'Actuel' : 'Parti'}
                      </span>
                    </div>
                    <div className="hist-card__dates">
                      <div className="hist-card__date">
                        <span className="hist-card__date-label">Entrée</span>
                        <span className="hist-card__date-val">
                          {new Date(h.date_entree).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="hist-card__date">
                        <span className="hist-card__date-label">Sortie</span>
                        <span className="hist-card__date-val">
                          {h.date_sortie
                            ? new Date(h.date_sortie).toLocaleDateString('fr-FR')
                            : '—'}
                        </span>
                      </div>
                      <div className="hist-card__date">
                        <span className="hist-card__date-label">Durée</span>
                        <span className="hist-card__date-val">{h.duree_jours} jours</span>
                      </div>
                    </div>
                    <div className="hist-card__loyer">
                      Loyer : <strong>{parseFloat(h.loyer).toLocaleString('fr-FR')} FCFA/mois</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </IonModal>

        {/* Modal Historique des locataires -- ÉTAPE 3 : chronologie complète
            à l'échelle du logement (tous compartiments), avec accès direct
            aux documents/paiements de chaque ancien occupant. */}
        <IonModal isOpen={showHistLocataires} onDidDismiss={() => setShowHistLocataires(false)}>
          <div className="hist-modal">
            <div className="hist-modal__head">
              <div>
                <p className="hist-modal__title">Historique des locataires</p>
                <p className="hist-modal__comp">{logement?.nom}</p>
              </div>
              <button className="pay-modal__close" onClick={() => setShowHistLocataires(false)}>✕</button>
            </div>

            {loadingHistLoc ? (
              <div className="g-loading"><div className="g-spinner" /></div>
            ) : histLocataires.length === 0 ? (
              <div className="g-empty">
                <div className="g-empty__icon">🕓</div>
                <p className="g-empty__text">Aucun locataire enregistré pour ce logement</p>
              </div>
            ) : (
              <div className="hist-list">
                {histLocataires.map(h => (
                  <div key={h.id} className={`hist-card ${!h.date_sortie ? 'hist-card--actif' : ''}`}>
                    <div className="hist-card__head">
                      <p className="hist-card__nom">👤 {h.nom_occupant}</p>
                      <span className={`g-badge ${!h.date_sortie ? 'g-badge--green' : 'g-badge--gray'}`}>
                        {!h.date_sortie ? 'Actuel' : 'Parti'}
                      </span>
                    </div>
                    <p className="hist-card__comp">{h.compartiment_nom}</p>
                    <div className="hist-card__dates">
                      <div className="hist-card__date">
                        <span className="hist-card__date-label">Entrée</span>
                        <span className="hist-card__date-val">
                          {new Date(h.date_entree).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="hist-card__date">
                        <span className="hist-card__date-label">Sortie</span>
                        <span className="hist-card__date-val">
                          {h.date_sortie ? new Date(h.date_sortie).toLocaleDateString('fr-FR') : '—'}
                        </span>
                      </div>
                      <div className="hist-card__date">
                        <span className="hist-card__date-label">Durée</span>
                        <span className="hist-card__date-val">{h.duree_jours} jours</span>
                      </div>
                    </div>
                    <div className="hist-card__loyer">
                      Loyer : <strong>{parseFloat(h.loyer).toLocaleString('fr-FR')} FCFA/mois</strong>
                    </div>
                    {h.occupant ? (
                      <button
                        className="g-btn g-btn--outline" style={{ marginTop: '10px' }}
                        onClick={() => openHistDocs(h.occupant!)} disabled={loadingHistDocs}
                      >
                        📄 Documents & Reçus
                      </button>
                    ) : (
                      <p className="pdf-preview-modal__hint" style={{ marginTop: '10px' }}>
                        Locataire supprimé — documents indisponibles.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </IonModal>

        {/* Sous-hub Documents & Reçus pour le locataire (actuel ou parti)
            sélectionné depuis l'historique ci-dessus -- même composant que
            le menu ⋮ de la page Locataires (ÉTAPE 2). */}
        <IonModal isOpen={!!histDocsOccupant} onDidDismiss={() => setHistDocsOccupant(null)}>
          <div className="dep-modal">
            <div className="pay-modal__head" style={{ marginBottom: '20px' }}>
              <div>
                <h2 className="pay-modal__title">Documents & Reçus</h2>
                <p className="hist-modal__comp">{histDocsOccupant?.nom_complet}</p>
              </div>
              <button className="pay-modal__close" onClick={() => setHistDocsOccupant(null)}>✕</button>
            </div>
            {histDocsOccupant && <OccupantDocumentsHub occupant={histDocsOccupant} />}
          </div>
        </IonModal>

        {/* Modal Documents */}
        <IonModal isOpen={showDocuments} onDidDismiss={() => setShowDocuments(false)}>
          <div className="dep-modal">
            <div className="hist-modal__head">
              <div>
                <p className="hist-modal__title">Documents & Pièces jointes</p>
                <p className="hist-modal__comp">{logement?.nom}</p>
              </div>
              <button className="pay-modal__close" onClick={() => setShowDocuments(false)}>✕</button>
            </div>
            {id && <DocumentsSection logementId={parseInt(id)} />}
          </div>
        </IonModal>

        {/* Modal Dépenses */}
        <IonModal isOpen={showDepenses} onDidDismiss={() => setShowDepenses(false)}>
          <div className="dep-modal">
            <div className="hist-modal__head">
              <div>
                <p className="hist-modal__title">Dépenses</p>
                <p className="hist-modal__comp">{logement?.nom}</p>
              </div>
              <button className="pay-modal__close" onClick={() => setShowDepenses(false)}>✕</button>
            </div>

            {depenses.length > 0 && (
              <div className="dep-total">
                Total enregistré <strong>{totalDepenses.toLocaleString('fr-FR')} FCFA</strong>
              </div>
            )}

            <div className="dep-form">
              {depenseError && <p className="tf-error">⚠ {depenseError}</p>}
              <div className="g-input-group">
                <label className="g-label">Libellé</label>
                <input
                  className="g-input" placeholder="Ex : Réparation plomberie"
                  value={depenseForm.libelle}
                  onChange={e => setDepenseForm(f => ({ ...f, libelle: e.target.value }))}
                />
              </div>
              <div className="dep-form__row">
                <div className="g-input-group">
                  <label className="g-label">Montant (FCFA)</label>
                  <input
                    className="g-input" type="number" inputMode="numeric" placeholder="0"
                    value={depenseForm.montant}
                    onChange={e => setDepenseForm(f => ({ ...f, montant: e.target.value }))}
                  />
                </div>
                <div className="g-input-group">
                  <label className="g-label">Date</label>
                  <input
                    className="g-input" type="date"
                    value={depenseForm.date}
                    onChange={e => setDepenseForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="g-input-group">
                <label className="g-label">Catégorie</label>
                <select
                  className="g-input" value={depenseForm.categorie}
                  onChange={e => setDepenseForm(f => ({ ...f, categorie: e.target.value }))}
                >
                  {Object.entries(CATEGORIE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <button className="g-btn g-btn--primary" onClick={handleAddDepense} disabled={savingDepense}>
                {savingDepense ? 'Enregistrement…' : '+ Ajouter la dépense'}
              </button>
            </div>

            <div className="g-divider" />

            {depenses.length === 0 ? (
              <div className="g-empty">
                <div className="g-empty__icon">💰</div>
                <p className="g-empty__text">Aucune dépense enregistrée pour ce logement</p>
              </div>
            ) : (
              <div className="dep-list">
                {depenses.map(d => (
                  <div key={d.id} className="dep-card">
                    <div className="dep-card__info">
                      <p className="dep-card__libelle">{d.libelle}</p>
                      <p className="dep-card__meta">
                        {CATEGORIE_LABEL[d.categorie] || d.categorie} · {new Date(d.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="dep-card__right">
                      <p className="dep-card__montant">{parseFloat(d.montant).toLocaleString('fr-FR')} F</p>
                      <button className="dep-card__delete" onClick={() => handleDeleteDepense(d.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </IonModal>

        <IonToast
          isOpen={showToast}
          message={location.state?.flashMessage || ''}
          duration={2500}
          position="top"
          color="success"
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default LogementDetailsPage;