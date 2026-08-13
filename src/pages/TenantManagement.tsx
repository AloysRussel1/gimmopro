import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar, IonModal, IonActionSheet,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import DocumentsSection from '../components/DocumentsSection';
import SkeletonLoader from '../components/SkeletonLoader';
import PhoneInput from '../components/common/PhoneInput';
import PdfPreviewModal from '../components/common/PdfPreviewModal';
import SendReceiptModal from '../components/SendReceiptModal';
import '../assets/css/TenantManagement.css';

interface Occupant {
  id: number; nom_complet: string; telephone: string; email: string;
  cni: string; numero_contrat: string; date_debut_contrat: string; date_fin_contrat: string | null;
  loyer: string; caution_versee: string; date_versement_caution: string | null;
  date_prochain_paiement: string; statut: string; actif: boolean; reste_a_payer: string;
  compartiment: number | null; compartiment_nom: string;
  logement: number | null; logement_nom: string; logement_loc: string;
}

interface PaiementResume {
  id: number; montant_verse: string; nombre_mois: number;
  date_paiement: string; date_debut_periode: string; date_fin_periode: string;
  statut: string; recu_token: string;
}

const TenantManagement: React.FC = () => {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [filtered,  setFiltered]  = useState<Occupant[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<'tous' | 'actif' | 'retard'>('tous');

  // Modal modification
  const [showEdit,   setShowEdit]   = useState(false);
  const [editData,   setEditData]   = useState<Partial<Occupant>>({});
  const [editId,     setEditId]     = useState<number | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [editError,  setEditError]  = useState('');

  // Modal "Documents & Reçus" -- hub unique regroupant contrat, caution,
  // reçus de loyer et pièces jointes (ÉTAPE 2 : remplace les items séparés
  // qui surchargeaient le menu ⋮).
  const [docsFor,      setDocsFor]      = useState<Occupant | null>(null);
  const [loyerPaiements, setLoyerPaiements] = useState<PaiementResume[]>([]);
  const [loyerLoading, setLoyerLoading] = useState(false);

  // Aperçus PDF (contrat / caution) -- ouverts DEPUIS le hub "Documents &
  // Reçus", jamais directement depuis le menu ⋮ : le bouton "Envoyer par
  // e-mail" (quand disponible) vit maintenant à l'intérieur de l'aperçu,
  // plus dans le menu principal.
  const [contratPreviewOpen, setContratPreviewOpen] = useState(false);
  const [cautionPreviewOpen, setCautionPreviewOpen] = useState(false);
  // Reçu de loyer sélectionné dans la liste -- réutilise SendReceiptModal
  // (aperçu + WhatsApp/SMS/e-mail), déjà construit pour ce cas précis.
  const [loyerSendTarget, setLoyerSendTarget] = useState<PaiementResume | null>(null);

  // Menu d'actions secondaires (bottom sheet) -- déclenché par le bouton ⋮
  // sur chaque carte, pour ne garder que l'action principale visible en
  // permanence sur mobile (voir tenant-card__actions plus bas).
  const [actionsFor, setActionsFor] = useState<Occupant | null>(null);

  const history  = useHistory();
  const location = useLocation<{ openEditOccupantId?: number }>();

  useEffect(() => {
    axiosInstance.get('occupants/')
      .then(r => { setOccupants(r.data); setFiltered(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = occupants.filter(o =>
      o.nom_complet.toLowerCase().includes(q) ||
      o.telephone.includes(q) ||
      (o.compartiment_nom || '').toLowerCase().includes(q) ||
      (o.logement_nom || '').toLowerCase().includes(q)
    );
    if (filter === 'actif')  result = result.filter(o => o.statut === 'Actif');
    if (filter === 'retard') result = result.filter(o => o.statut === 'En retard');
    setFiltered(result);
  }, [search, occupants, filter]);

  const handleDelete = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer ${nom} ?`)) return;
    await axiosInstance.delete(`occupants/${id}/`);
    setOccupants(prev => prev.filter(o => o.id !== id));
  };

  const handleLiberer = async (id: number, nom: string) => {
    if (!window.confirm(`Confirmer le départ de ${nom} ?`)) return;
    await axiosInstance.post(`occupants/${id}/liberer/`);
    setOccupants(prev => prev.filter(o => o.id !== id));
  };

  const openDocs = (o: Occupant) => {
    setDocsFor(o);
    setLoyerLoading(true);
    axiosInstance.get(`paiements/?occupant_id=${o.id}`)
      .then(r => setLoyerPaiements(r.data))
      .catch(console.error)
      .finally(() => setLoyerLoading(false));
  };

  const openEdit = (o: Occupant) => {
    setEditId(o.id);
    setEditData({
      nom_complet:            o.nom_complet,
      telephone:              o.telephone,
      email:                  o.email,
      loyer:                  o.loyer,
      caution_versee:         o.caution_versee,
      date_versement_caution: o.date_versement_caution,
      date_prochain_paiement: o.date_prochain_paiement,
      date_fin_contrat:       o.date_fin_contrat,
    });
    setEditError('');
    setShowEdit(true);
  };

  // Ouvre directement la modale de modification quand on arrive depuis le
  // bloc "Alertes & Rappels" du Dashboard (bail à renouveler/réviser).
  useEffect(() => {
    const targetId = location.state?.openEditOccupantId;
    if (!targetId || occupants.length === 0) return;
    const occupant = occupants.find(o => o.id === targetId);
    if (occupant) openEdit(occupant);
    history.replace(location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupants]);

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSaving(true); setEditError('');
    try {
      const res = await axiosInstance.put(`occupants/${editId}/`, editData);
      setOccupants(prev => prev.map(o => o.id === editId ? { ...o, ...res.data } : o));
      setShowEdit(false);
    } catch (e: any) {
      const data = e?.response?.data;
      setEditError(data?.telephone?.[0] || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
            Locataires
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="tenant-content">
        <div className="g-page">

          <div className="tenant-top g-animate">
            <IonSearchbar
              value={search}
              onIonInput={e => setSearch(e.detail.value!)}
              placeholder="Nom, téléphone, logement…"
              className="tenant-search"
            />
            <button className="tenant-add-btn" onClick={() => history.push('/ajouter-locataire')}>
              + Ajouter
            </button>
          </div>

          <div className="tenant-filters g-animate g-animate--1">
            {(['tous', 'actif', 'retard'] as const).map(f => (
              <button
                key={f}
                className={`tenant-filter-btn ${filter === f ? 'tenant-filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'tous' ? 'Tous' : f === 'actif' ? '✓ Actifs' : '⚠ En retard'}
              </button>
            ))}
          </div>

          {loading ? (
            <SkeletonLoader variant="cards" count={4} />
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">👤</div>
              <p className="g-empty__text">Aucun locataire trouvé</p>
            </div>
          ) : (
            <div className="tenant-list">
              {filtered.map((o, i) => (
                <div key={o.id} className={`tenant-card g-animate g-animate--${Math.min(i+1,5)}`}>
                  <div className="tenant-card__head">
                    <div className="tenant-avatar">{o.nom_complet.charAt(0).toUpperCase()}</div>
                    <div className="tenant-card__info">
                      <p className="tenant-card__name">{o.nom_complet}</p>
                      <p className="tenant-card__phone">{o.telephone}</p>
                    </div>
                    <span className={`g-badge ${o.statut === 'Actif' ? 'g-badge--green' : 'g-badge--red'}`}>
                      {o.statut}
                    </span>
                  </div>

                  {(o.logement_nom || o.compartiment_nom) && (
                    <div className="tenant-location">
                      <span>🏠</span>
                      <span className="tenant-location__text">
                        {o.logement_nom}{o.compartiment_nom ? ` · ${o.compartiment_nom}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="g-divider" />

                  <div className="tenant-card__details">
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">N° Contrat</span>
                      <span className="tenant-detail__value" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {o.numero_contrat}
                      </span>
                    </div>
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">Loyer mensuel</span>
                      <span className="tenant-detail__value tenant-detail__value--gold">
                        {parseFloat(o.loyer).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">Prochain paiement</span>
                      <span className={`tenant-detail__value ${new Date(o.date_prochain_paiement) < new Date() ? 'tenant-detail__value--red' : ''}`}>
                        {new Date(o.date_prochain_paiement).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {parseFloat(o.reste_a_payer) > 0 && (
                      <div className="tenant-detail">
                        <span className="tenant-detail__label">Reste à payer</span>
                        <span className="tenant-detail__value tenant-detail__value--red">
                          {parseFloat(o.reste_a_payer).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="tenant-card__actions">
                    <button
                      className="g-btn g-btn--primary tenant-btn-primary"
                      onClick={() => history.push('/paiement', { openOccupantId: o.id })}
                    >
                      💳 Paiement
                    </button>
                    <button
                      className="tenant-kebab"
                      aria-label="Plus d'actions"
                      onClick={() => setActionsFor(o)}
                    >
                      ⋮
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal modification */}
        <IonModal isOpen={showEdit} onDidDismiss={() => setShowEdit(false)}>
          <div className="edit-modal">
            <div className="pay-modal__head" style={{ marginBottom: '20px' }}>
              <h2 className="pay-modal__title">Modifier le locataire</h2>
              <button className="pay-modal__close" onClick={() => setShowEdit(false)}>✕</button>
            </div>

            {editError && <p className="tf-error">⚠ {editError}</p>}

            <div className="g-input-group">
              <label className="g-label">Nom complet</label>
              <input className="g-input" value={editData.nom_complet || ''}
                onChange={e => setEditData(d => ({ ...d, nom_complet: e.target.value }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Téléphone</label>
              <PhoneInput
                value={editData.telephone || ''}
                onChange={v => setEditData(d => ({ ...d, telephone: v }))}
              />
            </div>
            <div className="g-input-group">
              <label className="g-label">Email</label>
              <input className="g-input" type="email" value={editData.email || ''}
                onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Loyer mensuel (FCFA)</label>
              <input className="g-input" type="number" value={editData.loyer || ''}
                onChange={e => setEditData(d => ({ ...d, loyer: e.target.value }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Dépôt de garantie / Caution versée (FCFA)</label>
              <input className="g-input" type="number" inputMode="numeric" value={editData.caution_versee ?? ''}
                onChange={e => setEditData(d => ({ ...d, caution_versee: e.target.value }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Date de versement de la caution <span className="tf-optional">(optionnel)</span></label>
              <input className="g-input" type="date" value={editData.date_versement_caution || ''}
                onChange={e => setEditData(d => ({ ...d, date_versement_caution: e.target.value || null }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Prochain paiement</label>
              <input className="g-input" type="date" value={editData.date_prochain_paiement || ''}
                onChange={e => setEditData(d => ({ ...d, date_prochain_paiement: e.target.value }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Date de fin de bail <span className="tf-optional">(optionnel)</span></label>
              <input className="g-input" type="date" value={editData.date_fin_contrat || ''}
                onChange={e => setEditData(d => ({ ...d, date_fin_contrat: e.target.value || null }))} />
            </div>

            <button className="g-btn g-btn--primary" onClick={handleSaveEdit} disabled={saving}>
              {saving ? '⏳ Enregistrement…' : '✓ Sauvegarder'}
            </button>
          </div>
        </IonModal>

        {/* Modal "Documents & Reçus" -- hub unique (ÉTAPE 2) : contrat,
            caution, reçus de loyer et pièces jointes, plutôt que des items
            séparés qui surchargeaient le menu ⋮. */}
        <IonModal isOpen={!!docsFor} onDidDismiss={() => setDocsFor(null)}>
          <div className="dep-modal">
            <div className="pay-modal__head" style={{ marginBottom: '20px' }}>
              <div>
                <h2 className="pay-modal__title">Documents & Reçus</h2>
                <p className="hist-modal__comp">{docsFor?.nom_complet}</p>
              </div>
              <button className="pay-modal__close" onClick={() => setDocsFor(null)}>✕</button>
            </div>

            {docsFor && (() => {
              const o = docsFor;
              const cautionPrete = parseFloat(o.caution_versee) > 0 && !!o.date_versement_caution;
              return (
                <>
                  <div className="docs-hub-section">
                    <p className="docs-hub-section__title">📄 Contrat de bail</p>
                    <button className="g-btn g-btn--outline" onClick={() => setContratPreviewOpen(true)}>
                      👁 Aperçu
                    </button>
                  </div>

                  <div className="docs-hub-section">
                    <p className="docs-hub-section__title">🔐 Reçu de caution</p>
                    {!cautionPrete && (
                      <p className="pdf-preview-modal__hint">
                        Renseignez d'abord le montant et la date de versement de la caution (bouton "Modifier").
                      </p>
                    )}
                    <button className="g-btn g-btn--outline" onClick={() => setCautionPreviewOpen(true)} disabled={!cautionPrete}>
                      👁 Aperçu
                    </button>
                  </div>

                  <div className="docs-hub-section">
                    <p className="docs-hub-section__title">🧾 Reçus de loyer</p>
                    {loyerLoading ? (
                      <p className="pdf-preview-modal__hint">Chargement…</p>
                    ) : loyerPaiements.length === 0 ? (
                      <p className="pdf-preview-modal__hint">Aucun paiement enregistré pour l'instant.</p>
                    ) : (
                      <div className="docs-hub-list">
                        {loyerPaiements.map(p => (
                          <button key={p.id} className="docs-hub-list__item" onClick={() => setLoyerSendTarget(p)}>
                            <span>{new Date(p.date_debut_periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                            <span>{parseFloat(p.montant_verse).toLocaleString('fr-FR')} FCFA</span>
                            <span className={`g-badge ${p.statut === 'Payé' ? 'g-badge--green' : p.statut === 'Partiel' ? 'g-badge--gold' : 'g-badge--red'}`}>
                              {p.statut}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="g-divider" />

                  <div className="docs-hub-section">
                    <p className="docs-hub-section__title">📎 Pièces jointes</p>
                    <DocumentsSection occupantId={o.id} />
                  </div>
                </>
              );
            })()}
          </div>
        </IonModal>

        {/* Aperçus PDF -- ouverts depuis le hub ci-dessus. Le bouton "Envoyer
            par e-mail" du reçu de caution vit ICI (dans l'aperçu), plus dans
            le menu ⋮ principal -- pas de bouton équivalent pour le contrat,
            faute d'un envoi serveur réel pour ce document (contrairement à
            la caution, qui envoie une vraie pièce jointe par e-mail). */}
        <PdfPreviewModal
          isOpen={contratPreviewOpen}
          onClose={() => setContratPreviewOpen(false)}
          title="Contrat de bail"
          fetchPath={docsFor ? `occupants/${docsFor.id}/contrat/` : null}
          downloadFilename={`contrat_${docsFor?.id}.pdf`}
        />
        <PdfPreviewModal
          isOpen={cautionPreviewOpen}
          onClose={() => setCautionPreviewOpen(false)}
          title="Reçu de caution"
          fetchPath={
            docsFor && parseFloat(docsFor.caution_versee) > 0 && docsFor.date_versement_caution
              ? `occupants/${docsFor.id}/caution/recu/` : null
          }
          downloadFilename={`recu_caution_${docsFor?.id}.pdf`}
          notReadyMessage="Renseignez d'abord le montant et la date de versement de la caution."
          onSendEmail={docsFor ? async () => {
            const res = await axiosInstance.post(`occupants/${docsFor.id}/caution/envoyer/`);
            return res.data;
          } : undefined}
        />
        {loyerSendTarget && docsFor && (
          <SendReceiptModal
            isOpen={!!loyerSendTarget}
            onClose={() => setLoyerSendTarget(null)}
            occupant={docsFor}
            paiement={loyerSendTarget}
          />
        )}

        {/* Actions secondaires -- tiroir natif remontant du bas sur mobile.
            Réduit à l'essentiel (ÉTAPE 2) : la gestion documentaire est
            regroupée dans un seul item ("Documents & Reçus" ci-dessus), et
            les deux actions à conséquence (départ/suppression) restent
            isolées en fin de liste avec confirmation explicite. */}
        <IonActionSheet
          isOpen={!!actionsFor}
          onDidDismiss={() => setActionsFor(null)}
          header={actionsFor?.nom_complet}
          buttons={actionsFor ? (() => {
            const o = actionsFor;
            return [
              { text: '✏️ Modifier',              handler: () => openEdit(o) },
              { text: '📎 Documents & Reçus',      handler: () => openDocs(o) },
              { text: '🚪 Marquer le départ',       handler: () => handleLiberer(o.id, o.nom_complet) },
              { text: '🗑 Supprimer',               role: 'destructive' as const, handler: () => handleDelete(o.id, o.nom_complet) },
              { text: 'Annuler',                   role: 'cancel' as const },
            ];
          })() : []}
        />
      </IonContent>
    </IonPage>
  );
};

export default TenantManagement;