import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonModal, IonSearchbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/PaymentManagement.css';

interface Occupant {
  id: number; nom_complet: string; loyer: string;
  statut: string; date_prochain_paiement: string;
  compartiment_nom: string; logement_nom: string;
}
interface Paiement {
  id: number; occupant: number; occupant_nom: string;
  montant_verse: string; nombre_mois: number;
  date_paiement: string; date_debut_periode: string;
  date_fin_periode: string; statut: string;
}

const PaymentManagement: React.FC = () => {
  const history = useHistory();
  const [occupants,  setOccupants]  = useState<Occupant[]>([]);
  const [paiements,  setPaiements]  = useState<Paiement[]>([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [selected,   setSelected]   = useState<Occupant | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({ nombre_mois: '1', montant: '', date_debut: '', date_paiement: new Date().toISOString().split('T')[0], note: '' });

  useEffect(() => {
    Promise.all([axiosInstance.get('occupants/'), axiosInstance.get('paiements/')])
      .then(([oRes, pRes]) => { setOccupants(oRes.data); setPaiements(pRes.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered   = occupants.filter(o => o.nom_complet.toLowerCase().includes(search.toLowerCase()) || (o.compartiment_nom || '').toLowerCase().includes(search.toLowerCase()));
  const lastPay    = (id: number) => paiements.find(p => p.occupant === id);

  const openModal  = (o: Occupant) => {
    setSelected(o);
    setForm({ nombre_mois: '1', montant: o.loyer, date_debut: o.date_prochain_paiement, date_paiement: new Date().toISOString().split('T')[0], note: '' });
    setShowModal(true);
  };

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
      });
      setPaiements(prev => [res.data, ...prev]);
      setOccupants(prev => prev.map(o => o.id === selected.id ? { ...o, date_prochain_paiement: res.data.date_fin_periode, statut: 'Actif' } : o));
      setShowModal(false);
    } catch (e: any) { console.error(e?.response?.data || e); }
    finally { setSaving(false); }
  };

  const downloadRecu = (paiementId: number) => {
    const token = localStorage.getItem('access_token');
    const url   = `${axiosInstance.defaults.baseURL}paiements/${paiementId}/recu/`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const link  = document.createElement('a');
        link.href   = URL.createObjectURL(blob);
        link.download = `recu_${paiementId}.pdf`;
        link.click();
      }).catch(console.error);
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
          <IonSearchbar value={search} onIonInput={e => setSearch(e.detail.value!)} placeholder="Rechercher…" className="g-animate" />

          {loading ? (
            <div className="g-loading"><div className="g-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate"><div className="g-empty__icon">💳</div><p className="g-empty__text">Aucun locataire</p></div>
          ) : (
            <div className="pay-list">
              {filtered.map((o, i) => {
                const last    = lastPay(o.id);
                const overdue = new Date(o.date_prochain_paiement) < new Date();
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
                      <span className={`g-badge ${overdue ? 'g-badge--red' : 'g-badge--green'}`}>
                        {overdue ? 'En retard' : 'À jour'}
                      </span>
                    </div>

                    {last && (
                      <div className="pay-last">
                        <span className="pay-last__label">Dernier paiement</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="pay-last__val">
                            {parseFloat(last.montant_verse).toLocaleString('fr-FR')} · {last.nombre_mois} mois · {new Date(last.date_paiement).toLocaleDateString('fr-FR')}
                          </span>
                          <button
                            className="pay-recu-btn"
                            onClick={() => downloadRecu(last.id)}
                            title="Télécharger le reçu"
                          >
                            🧾
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
            <div className="g-input-group">
              <label className="g-label">Début de la période couverte</label>
              <input className="g-input" type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Date du paiement</label>
              <input className="g-input" type="date" value={form.date_paiement} onChange={e => setForm(f => ({ ...f, date_paiement: e.target.value }))} />
            </div>
            <div className="g-input-group">
              <label className="g-label">Note (optionnel)</label>
              <input className="g-input" placeholder="Ex: espèces, virement…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <button className="g-btn g-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Enregistrement…' : '✓ Confirmer'}
            </button>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PaymentManagement;