import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonModal, IonSearchbar,
} from '@ionic/react';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/PaymentManagement.css';

interface Paiement {
  id: number;
  occupant: number;
  occupant_nom: string;
  montant_verse: string;
  date_paiement: string;
  date_prochain_paiement: string;
  statut: string;
}

interface Occupant {
  id: number;
  nom_complet: string;
  loyer: string;
  statut: string;
  date_prochain_paiement: string;
}

const PaymentManagement: React.FC = () => {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Occupant | null>(null);
  const [form, setForm] = useState({ montant: '', date: '', next_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('occupants/'),
      axiosInstance.get('paiements/'),
    ]).then(([oRes, pRes]) => {
      setOccupants(oRes.data);
      setPaiements(pRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = occupants.filter(o =>
    o.nom_complet.toLowerCase().includes(search.toLowerCase())
  );

  const lastPaiement = (occupantId: number) =>
    paiements.find(p => p.occupant === occupantId);

  const openModal = (o: Occupant) => {
    setSelected(o);
    setForm({ montant: o.loyer, date: new Date().toISOString().split('T')[0], next_date: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selected || !form.montant || !form.date || !form.next_date) return;
    setSaving(true);
    try {
      const res = await axiosInstance.post('paiements/', {
        occupant: selected.id,
        montant_verse: form.montant,
        date_paiement: form.date,
        date_prochain_paiement: form.next_date,
      });
      setPaiements(prev => [res.data, ...prev]);
      setShowModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="pay-title">Paiements</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="pay-content">
        <div className="g-page">
          <IonSearchbar
            value={search}
            onIonInput={e => setSearch(e.detail.value!)}
            placeholder="Rechercher un locataire…"
            className="g-animate"
          />

          {loading ? (
            <div className="pay-loading">
              <div className="pay-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">💳</div>
              <p className="g-empty__text">Aucun locataire trouvé</p>
            </div>
          ) : (
            <div className="pay-list">
              {filtered.map((o, i) => {
                const last = lastPaiement(o.id);
                const overdue = new Date(o.date_prochain_paiement) < new Date();
                return (
                  <div
                    key={o.id}
                    className={`pay-card g-animate g-animate--${Math.min(i + 1, 5)}`}
                  >
                    <div className="pay-card__head">
                      <div className="pay-avatar">
                        {o.nom_complet.charAt(0).toUpperCase()}
                      </div>
                      <div className="pay-card__info">
                        <p className="pay-card__name">{o.nom_complet}</p>
                        <p className="pay-card__loyer">
                          {parseFloat(o.loyer).toLocaleString('fr-CA')} $ / mois
                        </p>
                      </div>
                      <span className={`g-badge ${overdue ? 'g-badge--red' : 'g-badge--green'}`}>
                        {overdue ? 'En retard' : 'À jour'}
                      </span>
                    </div>

                    {last && (
                      <div className="pay-last">
                        <span className="pay-last__label">Dernier paiement</span>
                        <span className="pay-last__val">
                          {parseFloat(last.montant_verse).toLocaleString('fr-CA')} $
                          &nbsp;·&nbsp;
                          {new Date(last.date_paiement).toLocaleDateString('fr-CA')}
                        </span>
                      </div>
                    )}

                    <div className="pay-card__due">
                      <span className="pay-due__label">Prochain paiement</span>
                      <span className={`pay-due__date ${overdue ? 'pay-due__date--red' : ''}`}>
                        {new Date(o.date_prochain_paiement).toLocaleDateString('fr-CA')}
                      </span>
                    </div>

                    <button
                      className="g-btn g-btn--primary pay-cta"
                      onClick={() => openModal(o)}
                    >
                      + Enregistrer un paiement
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <div className="pay-modal">
            <div className="pay-modal__head">
              <h2 className="pay-modal__title">Nouveau paiement</h2>
              <button className="pay-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {selected && (
              <p className="pay-modal__tenant">{selected.nom_complet}</p>
            )}

            <div className="g-input-group">
              <label className="g-label">Montant versé ($)</label>
              <input
                className="g-input"
                type="number"
                value={form.montant}
                onChange={e => setForm({ ...form, montant: e.target.value })}
              />
            </div>
            <div className="g-input-group">
              <label className="g-label">Date de paiement</label>
              <input
                className="g-input"
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="g-input-group">
              <label className="g-label">Prochain paiement</label>
              <input
                className="g-input"
                type="date"
                value={form.next_date}
                onChange={e => setForm({ ...form, next_date: e.target.value })}
              />
            </div>

            <button
              className="g-btn g-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement…' : 'Confirmer'}
            </button>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PaymentManagement;