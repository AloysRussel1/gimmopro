import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/TenantManagement.css';

interface Occupant {
  id: number;
  nom_complet: string;
  telephone: string;
  email: string;
  cni: string;
  numero_contrat: string;
  date_debut_contrat: string;
  loyer: string;
  date_prochain_paiement: string;
  statut: string;
  logement: number | null;
}

const TenantManagement: React.FC = () => {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [filtered, setFiltered] = useState<Occupant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    axiosInstance.get('occupants/')
      .then(r => { setOccupants(r.data); setFiltered(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(occupants.filter(o =>
      o.nom_complet.toLowerCase().includes(q) ||
      o.telephone.includes(q) ||
      o.email.toLowerCase().includes(q)
    ));
  }, [search, occupants]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce locataire ?')) return;
    await axiosInstance.delete(`occupants/${id}/`);
    setOccupants(prev => prev.filter(o => o.id !== id));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="tenant-title">Locataires</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="tenant-content">
        <div className="g-page">

          <div className="tenant-top g-animate">
            <IonSearchbar
              value={search}
              onIonInput={e => setSearch(e.detail.value!)}
              placeholder="Rechercher un locataire…"
              className="tenant-search"
            />
            <button
              className="tenant-add-btn"
              onClick={() => history.push('/ajouter-locataire')}
            >
              + Ajouter
            </button>
          </div>

          {loading ? (
            <div className="dash-loading">
              <div className="dash-spinner" />
              <p>Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">👤</div>
              <p className="g-empty__text">Aucun locataire trouvé</p>
            </div>
          ) : (
            <div className="tenant-list">
              {filtered.map((o, i) => (
                <div
                  key={o.id}
                  className={`tenant-card g-animate g-animate--${Math.min(i + 1, 5)}`}
                >
                  {/* Header */}
                  <div className="tenant-card__head">
                    <div className="tenant-avatar">
                      {o.nom_complet.charAt(0).toUpperCase()}
                    </div>
                    <div className="tenant-card__info">
                      <p className="tenant-card__name">{o.nom_complet}</p>
                      <p className="tenant-card__phone">{o.telephone}</p>
                    </div>
                    <span className={`g-badge ${o.statut === 'Actif' ? 'g-badge--green' : 'g-badge--red'}`}>
                      {o.statut}
                    </span>
                  </div>

                  <div className="g-divider" />

                  {/* Details */}
                  <div className="tenant-card__details">
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">Loyer</span>
                      <span className="tenant-detail__value tenant-detail__value--gold">
                        {parseFloat(o.loyer).toLocaleString('fr-CA')} $
                      </span>
                    </div>
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">Contrat</span>
                      <span className="tenant-detail__value">{o.numero_contrat}</span>
                    </div>
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">Prochain paiement</span>
                      <span className={`tenant-detail__value ${new Date(o.date_prochain_paiement) < new Date()
                          ? 'tenant-detail__value--red'
                          : ''
                        }`}>
                        {new Date(o.date_prochain_paiement).toLocaleDateString('fr-CA')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="tenant-card__actions">
                    <button
                      className="g-btn g-btn--outline tenant-btn"
                      onClick={() => history.push(`/ajouter-locataire`, { tenant: o })}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      className="g-btn g-btn--danger tenant-btn"
                      onClick={() => handleDelete(o.id)}
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TenantManagement;