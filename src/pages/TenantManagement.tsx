import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar, IonModal, IonActionSheet,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import SkeletonLoader from '../components/SkeletonLoader';
import PhoneInput from '../components/common/PhoneInput';
import OccupantDocumentsHub from '../components/OccupantDocumentsHub';
import '../assets/css/TenantManagement.css';

interface Occupant {
  id: number; nom_complet: string; telephone: string; email: string;
  cni: string; numero_contrat: string; date_debut_contrat: string; date_fin_contrat: string | null;
  loyer: string; caution_versee: string; date_versement_caution: string | null;
  date_prochain_paiement: string; statut: string; actif: boolean; reste_a_payer: string;
  compartiment: number | null; compartiment_nom: string;
  logement: number | null; logement_nom: string; logement_loc: string;
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
  // qui surchargeaient le menu ⋮). Contenu factorisé dans OccupantDocumentsHub
  // (ÉTAPE 3 : réutilisé aussi pour les anciens occupants d'un logement).
  const [docsFor, setDocsFor] = useState<Occupant | null>(null);

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

  const openDocs = (o: Occupant) => setDocsFor(o);

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
            {docsFor && <OccupantDocumentsHub occupant={docsFor} />}
          </div>
        </IonModal>

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