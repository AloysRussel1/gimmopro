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
  actif: boolean;
  compartiment: number | null;
  compartiment_nom: string;
  logement: number | null;
  logement_nom: string;
  logement_loc: string;
}

const TenantManagement: React.FC = () => {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [filtered,  setFiltered]  = useState<Occupant[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<'tous' | 'actif' | 'retard'>('tous');
  const history = useHistory();

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

  const handleContrat = (id: number) => {
    const token = localStorage.getItem('access_token');
    const url   = `${axiosInstance.defaults.baseURL}occupants/${id}/contrat/`;
    // Ouvrir dans un nouvel onglet avec le token
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href  = URL.createObjectURL(blob);
        link.download = `contrat_${id}.pdf`;
        link.click();
      })
      .catch(console.error);
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

          {/* Top bar */}
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

          {/* Filtres */}
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
            <div className="g-loading"><div className="g-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">👤</div>
              <p className="g-empty__text">Aucun locataire trouvé</p>
            </div>
          ) : (
            <div className="tenant-list">
              {filtered.map((o, i) => (
                <div key={o.id} className={`tenant-card g-animate g-animate--${Math.min(i+1,5)}`}>

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

                  {/* Localisation */}
                  {(o.logement_nom || o.compartiment_nom) && (
                    <div className="tenant-location">
                      <span className="tenant-location__icon">🏠</span>
                      <span className="tenant-location__text">
                        {o.logement_nom}{o.compartiment_nom ? ` · ${o.compartiment_nom}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="g-divider" />

                  {/* Détails */}
                  <div className="tenant-card__details">
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">N° Contrat</span>
                      <span className="tenant-detail__value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
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
                      <span className={`tenant-detail__value ${
                        new Date(o.date_prochain_paiement) < new Date()
                          ? 'tenant-detail__value--red' : ''
                      }`}>
                        {new Date(o.date_prochain_paiement).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="tenant-detail">
                      <span className="tenant-detail__label">Entrée</span>
                      <span className="tenant-detail__value">
                        {new Date(o.date_debut_contrat).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="tenant-card__actions">
                    <button
                      className="g-btn g-btn--outline tenant-btn"
                      onClick={() => handleContrat(o.id)}
                      title="Télécharger le contrat PDF"
                    >
                      📄 Contrat
                    </button>
                    <button
                      className="g-btn g-btn--outline tenant-btn"
                      onClick={() => handleLiberer(o.id, o.nom_complet)}
                    >
                      🚪 Libérer
                    </button>
                    <button
                      className="g-btn g-btn--danger tenant-btn"
                      onClick={() => handleDelete(o.id, o.nom_complet)}
                    >
                      🗑
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