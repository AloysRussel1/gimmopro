import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonModal, IonSearchbar,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { FiSend, FiDollarSign, FiAlertTriangle, FiClock } from 'react-icons/fi';
import axiosInstance from '../api/axiosConfig';
import SendReceiptModal from '../components/SendReceiptModal';
import { downloadFile } from '../utils/pdf';
import SkeletonLoader from '../components/SkeletonLoader';
import '../assets/css/PaymentManagement.css';

interface Occupant {
  id: number; nom_complet: string; loyer: string;
  statut: string; date_prochain_paiement: string;
  compartiment_nom: string; logement_nom: string;
  telephone: string; email: string; reste_a_payer: string;
}
interface Paiement {
  id: number; occupant: number; occupant_nom: string;
  montant_verse: string; nombre_mois: number; mode_paiement: string;
  date_paiement: string; date_debut_periode: string;
  date_fin_periode: string; statut: string; recu_token: string;
}
interface DashboardStats {
  paiements: { revenus_mois: number; total_attendu_mois: number };
  retards:   { montant_total: number; nombre: number };
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const MODES_PAIEMENT = [
  { value: 'ESPECES',  label: 'Espèces' },
  { value: 'OM',       label: 'Orange Money' },
  { value: 'MOMO',     label: 'MTN MoMo' },
  { value: 'VIREMENT', label: 'Virement' },
];

const PaymentManagement: React.FC = () => {
  const history  = useHistory();
  const location = useLocation<{ openOccupantId?: number }>();
  const [occupants,  setOccupants]  = useState<Occupant[]>([]);
  const [paiements,  setPaiements]  = useState<Paiement[]>([]);
  const [stats,      setStats]      = useState<DashboardStats | null>(null);
  const [search,     setSearch]     = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'complet' | 'partiel' | 'retard'>('tous');
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [selected,   setSelected]   = useState<Occupant | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({ nombre_mois: '1', montant: '', date_debut: '', date_paiement: new Date().toISOString().split('T')[0], note: '', mode_paiement: 'ESPECES' });
  const [sendTarget, setSendTarget] = useState<{ occupant: Occupant; paiement: Paiement } | null>(null);

  // Export comptable (Excel / CSV)
  const anneeActuelle = new Date().getFullYear();
  const [exportType,  setExportType]  = useState<'paiements' | 'depenses' | 'recapitulatif'>('paiements');
  const [exportAnnee, setExportAnnee] = useState(String(anneeActuelle));
  const [exporting,   setExporting]   = useState(false);

  useEffect(() => {
    Promise.all([axiosInstance.get('occupants/'), axiosInstance.get('paiements/')])
      .then(([oRes, pRes]) => { setOccupants(oRes.data); setPaiements(pRes.data); })
      .catch(console.error).finally(() => setLoading(false));
    axiosInstance.get('dashboard/stats/')
      .then(r => setStats(r.data))
      .catch(() => { /* la page reste utilisable sans le bandeau KPI */ });
  }, []);

  const lastPay = (id: number) => paiements.find(p => p.occupant === id);

  // Statut unique et clair par locataire (Complet / Partiel / En retard) --
  // remplace les deux badges précédents (statut occupant + statut du
  // dernier paiement) qui pouvaient se contredire visuellement. `last` est
  // déjà le paiement le plus récent (Paiement.Meta.ordering = -date_paiement) ;
  // "Partiel" n'est retenu que s'il couvre bien la période actuellement
  // ouverte -- un ancien versement partiel sur une période déjà soldée ne
  // doit pas ressurgir comme "Partiel" aujourd'hui.
  const statutPaiement = (o: Occupant): 'complet' | 'partiel' | 'retard' => {
    const resteDu = parseFloat(o.reste_a_payer);
    if (resteDu <= 0) return 'complet';
    const last = lastPay(o.id);
    if (last && last.date_debut_periode === o.date_prochain_paiement && last.statut === 'Partiel') return 'partiel';
    return 'retard';
  };

  const compteurs = useMemo(() => {
    const parStatut = { tous: occupants.length, complet: 0, partiel: 0, retard: 0 };
    occupants.forEach(o => { parStatut[statutPaiement(o)]++; });
    return parStatut;
  }, [occupants, paiements]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = occupants
    .filter(o => o.nom_complet.toLowerCase().includes(search.toLowerCase()) || (o.compartiment_nom || '').toLowerCase().includes(search.toLowerCase()))
    .filter(o => filtreStatut === 'tous' || statutPaiement(o) === filtreStatut);

  const tauxEncaissement = stats && stats.paiements.total_attendu_mois > 0
    ? Math.min(100, Math.round((stats.paiements.revenus_mois / stats.paiements.total_attendu_mois) * 100)) : 0;

  const openModal  = (o: Occupant) => {
    setSelected(o);
    // Si un solde reste dû sur la période en cours (paiement partiel déjà
    // versé), on pré-remplit avec CE reste plutôt que le loyer plein --
    // évite de laisser croire par défaut qu'un mois entier est encore dû.
    const resteDu = parseFloat(o.reste_a_payer);
    const montantDefaut = resteDu > 0 ? o.reste_a_payer : o.loyer;
    setForm({ nombre_mois: '1', montant: montantDefaut, date_debut: o.date_prochain_paiement, date_paiement: new Date().toISOString().split('T')[0], note: '', mode_paiement: 'ESPECES' });
    setShowModal(true);
  };

  // Arrivée depuis le Dashboard ("Enregistrer le paiement" sur un retardataire) :
  // ouvre directement la modale pré-remplie pour ce locataire précis.
  useEffect(() => {
    const targetId = location.state?.openOccupantId;
    if (!targetId || occupants.length === 0) return;
    const occupant = occupants.find(o => o.id === targetId);
    if (occupant) openModal(occupant);
    history.replace(location.pathname); // évite de rouvrir la modale au retour arrière
  }, [occupants]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMois = (nb: string) => {
    const n = parseInt(nb) || 1;
    setForm(f => ({ ...f, nombre_mois: String(n), montant: String(parseFloat(selected?.loyer || '0') * n) }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await axiosInstance.post('paiements/', {
        occupant: selected.id, montant_verse: parseFloat(form.montant),
        nombre_mois: parseInt(form.nombre_mois), date_paiement: form.date_paiement,
        date_debut_periode: form.date_debut, note: form.note,
        mode_paiement: form.mode_paiement,
      });
      setPaiements(prev => [res.data, ...prev]);
      setOccupants(prev => prev.map(o => o.id === selected.id ? { ...o, date_prochain_paiement: res.data.date_fin_periode, statut: 'Actif' } : o));
      setShowModal(false);
      // Enchaînement immédiat : le reçu vient d'être généré côté serveur (recu_token
      // dans la réponse), on ouvre directement la modale d'envoi plutôt que de laisser
      // l'utilisateur revenir chercher le bouton reçu sur la carte du locataire.
      // Le blur() évite l'avertissement "aria-hidden retains focus" — Ionic marque
      // le fond (dont le bouton "Confirmer" encore focus) comme aria-hidden à
      // l'ouverture de la modale, ce que le navigateur refuse tant qu'un élément
      // caché garde le focus.
      (document.activeElement as HTMLElement)?.blur();
      setSendTarget({ occupant: selected, paiement: res.data });
    } catch (e: any) { console.error(e?.response?.data || e); }
    finally { setSaving(false); }
  };

  const EXPORT_ENDPOINTS: Record<typeof exportType, { path: string; nom: string }> = {
    paiements:     { path: 'export/paiements/',            nom: `paiements_${exportAnnee}` },
    depenses:      { path: 'export/depenses/',              nom: `depenses_${exportAnnee}` },
    recapitulatif: { path: 'export/recapitulatif-annuel/',  nom: `recapitulatif_annuel_${exportAnnee}` },
  };

  const handleExport = async (fmt: 'xlsx' | 'csv') => {
    setExporting(true);
    try {
      const { path, nom } = EXPORT_ENDPOINTS[exportType];
      await downloadFile(`${path}?annee=${exportAnnee}&export_format=${fmt}`, `${nom}.${fmt}`);
    } catch (e) {
      console.error(e);
      window.alert("Erreur lors de l'export. Réessayez dans quelques instants.");
    } finally {
      setExporting(false);
    }
  };

  const downloadRecu = (paiementId: number) => {
    downloadFile(`paiements/${paiementId}/recu/`, `recu_${paiementId}.pdf`).catch(console.error);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>Paiements</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="pay-content">
        <div className="g-page">
          {!loading && (
            <div className="kpi-grid g-animate">
              <div className="kpi-card">
                <div className="kpi-card__head">
                  <span className="kpi-card__icon kpi-card__icon--accent"><FiDollarSign /></span>
                  <span className="kpi-card__label">Collecté ce mois</span>
                </div>
                <p className="kpi-card__value">{fmt(stats?.paiements.revenus_mois ?? 0)} <span className="kpi-card__unit">FCFA</span></p>
                <div className="kpi-card__gauge"><div className="kpi-card__gauge-fill" style={{ width: `${tauxEncaissement}%` }} /></div>
                <p className="kpi-card__sub">{tauxEncaissement}% des {fmt(stats?.paiements.total_attendu_mois ?? 0)} FCFA attendus</p>
              </div>

              <div className={`kpi-card ${(stats?.retards.nombre ?? 0) > 0 ? 'kpi-card--danger' : ''}`}>
                <div className="kpi-card__head">
                  <span className="kpi-card__icon kpi-card__icon--danger"><FiAlertTriangle /></span>
                  <span className="kpi-card__label">Reste à recouvrir</span>
                </div>
                <p className={`kpi-card__value ${(stats?.retards.montant_total ?? 0) > 0 ? 'kpi-card__value--danger' : ''}`}>
                  {fmt(stats?.retards.montant_total ?? 0)} <span className="kpi-card__unit">FCFA</span>
                </p>
                <p className="kpi-card__sub">Loyers impayés cumulés</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-card__head">
                  <span className="kpi-card__icon kpi-card__icon--accent"><FiClock /></span>
                  <span className="kpi-card__label">Paiements en attente</span>
                </div>
                <p className="kpi-card__value">{stats?.retards.nombre ?? 0}</p>
                <p className="kpi-card__sub">locataire{(stats?.retards.nombre ?? 0) > 1 ? 's' : ''} à relancer</p>
              </div>
            </div>
          )}

          <IonSearchbar value={search} onIonInput={e => setSearch(e.detail.value!)} placeholder="Rechercher…" className="g-animate" />

          {!loading && occupants.length > 0 && (
            <div className="g-chip-row g-animate">
              {(['tous', 'complet', 'partiel', 'retard'] as const).map(f => (
                <button
                  key={f}
                  className={`g-filter-chip ${filtreStatut === f ? 'active' : ''} ${f === 'retard' ? 'g-filter-chip--danger' : ''}`}
                  onClick={() => setFiltreStatut(f)}
                >
                  {f === 'tous' ? 'Tous' : f === 'complet' ? 'Complet' : f === 'partiel' ? 'Partiel' : 'En retard'}
                  <span className="g-filter-chip__count">{compteurs[f]}</span>
                </button>
              ))}
            </div>
          )}

          <div className="g-card g-animate" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <div className="g-input-group" style={{ margin: 0, flex: '1 1 160px' }}>
              <label className="g-label">📊 Export comptable</label>
              <select
                className="g-input"
                value={exportType}
                onChange={e => setExportType(e.target.value as typeof exportType)}
              >
                <option value="paiements">Paiements / loyers perçus</option>
                <option value="depenses">Dépenses & charges</option>
                <option value="recapitulatif">Récapitulatif annuel</option>
              </select>
            </div>
            <div className="g-input-group" style={{ margin: 0, flex: '0 1 110px' }}>
              <label className="g-label">Année</label>
              <select className="g-input" value={exportAnnee} onChange={e => setExportAnnee(e.target.value)}>
                {[0, 1, 2, 3].map(offset => {
                  const a = anneeActuelle - offset;
                  return <option key={a} value={a}>{a}</option>;
                })}
              </select>
            </div>
            <button className="g-btn g-btn--outline" disabled={exporting} onClick={() => handleExport('xlsx')}>
              {exporting ? '⏳' : '⬇️ Excel (.xlsx)'}
            </button>
            <button className="g-btn g-btn--outline" disabled={exporting} onClick={() => handleExport('csv')}>
              {exporting ? '⏳' : '⬇️ CSV'}
            </button>
          </div>

          {loading ? (
            <SkeletonLoader variant="table-rows" count={5} />
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate"><div className="g-empty__icon">💳</div><p className="g-empty__text">Aucun locataire</p></div>
          ) : (
            <div className="pay-list">
              {filtered.map((o, i) => {
                const last    = lastPay(o.id);
                const overdue = new Date(o.date_prochain_paiement) < new Date();
                const statut  = statutPaiement(o);
                const resteDu = parseFloat(o.reste_a_payer);
                const badgeClasse = statut === 'complet' ? 'g-badge--green' : statut === 'partiel' ? 'g-badge--gold' : 'g-badge--red';
                const badgeLabel  = statut === 'complet' ? 'Complet' : statut === 'partiel' ? 'Partiel' : 'En retard';
                return (
                  <div key={o.id} className={`pay-card g-animate g-animate--${Math.min(i+1,5)}`}>
                    <div className="pay-card__head">
                      <div className="pay-avatar">{o.nom_complet.charAt(0).toUpperCase()}</div>
                      <div className="pay-card__info">
                        <p className="pay-card__name">{o.nom_complet}</p>
                        <p className="pay-card__loyer">
                          {parseFloat(o.loyer).toLocaleString('fr-FR')} FCFA/mois
                          {o.compartiment_nom ? ` · ${o.compartiment_nom}` : ''}
                        </p>
                      </div>
                      <span className={`g-badge ${badgeClasse}`}>{badgeLabel}</span>
                    </div>

                    {/* Solde restant réel (Occupant.reste_a_payer, recalculé
                        côté backend -- jamais figé à 0 sur un versement
                        partiel) -- mis en évidence dès qu'un montant est dû. */}
                    {resteDu > 0 && (
                      <div className="pay-solde">
                        <span className="pay-solde__label">Solde restant à payer</span>
                        <span className="pay-solde__val">{resteDu.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    )}

                    {last && (
                      <div className="pay-last">
                        <span className="pay-last__label">Dernier paiement</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="pay-last__val">
                            {parseFloat(last.montant_verse).toLocaleString('fr-FR')} FCFA · {last.nombre_mois} mois · {new Date(last.date_paiement).toLocaleDateString('fr-FR')}
                          </span>
                          <button
                            className="pay-recu-btn"
                            onClick={() => downloadRecu(last.id)}
                            title="Télécharger le reçu PDF"
                          >
                            🧾
                          </button>
                          <button
                            className="pay-recu-btn"
                            onClick={(e) => { e.currentTarget.blur(); setSendTarget({ occupant: o, paiement: last }); }}
                            title="Envoyer le reçu au locataire"
                          >
                            <FiSend size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pay-card__due">
                      <span className="pay-due__label">Prochain paiement</span>
                      <span className={`pay-due__date ${overdue ? 'pay-due__date--red' : ''}`}>
                        {new Date(o.date_prochain_paiement).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div className="pay-card__actions">
                      <button className="g-btn g-btn--primary pay-cta" onClick={() => openModal(o)}>
                        + Enregistrer paiement
                      </button>
                      <button className="g-btn g-btn--outline pay-cta" onClick={() => history.push(`/historique/${o.id}`)}>
                        Historique
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <div className="pay-modal">
            <div className="pay-modal__head">
              <h2 className="pay-modal__title">Nouveau paiement</h2>
              <button className="pay-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {selected && <p className="pay-modal__tenant">{selected.nom_complet}{selected.compartiment_nom ? ` · ${selected.compartiment_nom}` : ''}</p>}

            <div className="g-input-group">
              <label className="g-label">Nombre de mois</label>
              <div className="pay-mois-row">
                {[1,2,3,6,12].map(n => (
                  <button key={n} className={`pay-mois-btn ${form.nombre_mois === String(n) ? 'pay-mois-btn--active' : ''}`} onClick={() => updateMois(String(n))}>
                    {n} mois
                  </button>
                ))}
              </div>
            </div>
            <div className="g-input-group">
              <label className="g-label">Montant total (FCFA)</label>
              <input className="g-input" type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
            </div>

            {/* Aperçu en direct -- recalculé à chaque frappe, sans attendre la
                soumission : ce que verra le reçu (statut, reste à payer,
                trop-perçu éventuel) une fois ce paiement enregistré. */}
            {selected && (() => {
              const resteAvant = parseFloat(selected.reste_a_payer) > 0
                ? parseFloat(selected.reste_a_payer)
                : parseFloat(selected.loyer) * (parseInt(form.nombre_mois) || 1);
              const montantSaisi = parseFloat(form.montant) || 0;
              const resteApres  = Math.max(0, resteAvant - montantSaisi);
              const tropPercu   = Math.max(0, montantSaisi - resteAvant);
              const statutPrevu = montantSaisi <= 0 ? 'En attente' : montantSaisi >= resteAvant ? 'Payé' : 'Partiel';
              return (
                <div className="pay-preview">
                  <span className={`g-badge ${statutPrevu === 'Payé' ? 'g-badge--green' : statutPrevu === 'Partiel' ? 'g-badge--gold' : 'g-badge--red'}`}>
                    {statutPrevu}
                  </span>
                  <span className="pay-preview__text">
                    Reste après ce paiement : <strong>{resteApres.toLocaleString('fr-FR')} FCFA</strong>
                    {tropPercu > 0 && <> · Trop-perçu : {tropPercu.toLocaleString('fr-FR')} FCFA</>}
                  </span>
                </div>
              );
            })()}

            <div className="g-input-group">
              <label className="g-label">Mode de paiement</label>
              <div className="pay-mois-row">
                {MODES_PAIEMENT.map(m => (
                  <button
                    key={m.value}
                    className={`pay-mois-btn ${form.mode_paiement === m.value ? 'pay-mois-btn--active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, mode_paiement: m.value }))}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="g-input-group">
              <label className="g-label">Début de la période couverte</label>
              <div className="pay-date-row">
                <input className="g-input" type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} />
                {form.date_debut && (
                  <button type="button" className="pay-date-clear" title="Effacer la date" onClick={() => setForm(f => ({ ...f, date_debut: '' }))}>✕</button>
                )}
              </div>
            </div>
            <div className="g-input-group">
              <label className="g-label">Date du paiement</label>
              <div className="pay-date-row">
                <input className="g-input" type="date" value={form.date_paiement} onChange={e => setForm(f => ({ ...f, date_paiement: e.target.value }))} />
                {form.date_paiement && (
                  <button type="button" className="pay-date-clear" title="Effacer la date" onClick={() => setForm(f => ({ ...f, date_paiement: '' }))}>✕</button>
                )}
              </div>
            </div>
            <div className="g-input-group">
              <label className="g-label">Note (optionnel)</label>
              <input className="g-input" placeholder="Ex: espèces, virement…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <button
              className="g-btn g-btn--primary"
              onClick={handleSave}
              disabled={saving || !form.montant || !form.date_debut || !form.date_paiement}
            >
              {saving ? '⏳ Enregistrement…' : '✓ Confirmer'}
            </button>
          </div>
        </IonModal>

        {sendTarget && (
          <SendReceiptModal
            isOpen={!!sendTarget}
            onClose={() => setSendTarget(null)}
            occupant={sendTarget.occupant}
            paiement={sendTarget.paiement}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default PaymentManagement;