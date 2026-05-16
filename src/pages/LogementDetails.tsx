import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig';
import './../assets/css/LogementDetails.css';

interface Compartiment {
  id: number; type: string; nom: string;
  statut: string; occupant: string | null; logement: number;
  chambres: number; salons: number; douches: number; cuisines: number;
}
interface Logement {
  id: number; nom: string; localisation: string; description: string;
}

const LogementDetailsPage: React.FC = () => {
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('Tous');
  const [compartiments, setCompartiments] = useState<Compartiment[]>([]);
  const [logement, setLogement]       = useState<Logement | null>(null);
  const [loading, setLoading]         = useState(true);
  const history = useHistory();
  const { id }  = useParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      axiosInstance.get(`logements/${id}/`),
      axiosInstance.get(`logements/${id}/compartiments/`),
    ]).then(([lRes, cRes]) => {
      setLogement(lRes.data);
      setCompartiments(cRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
            Détails
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="logement-details-content">
        <div className="g-page">

          {/* Logement info */}
          {logement && (
            <div className="ld-header g-animate">
              <p className="ld-header__name">{logement.nom}</p>
              <p className="ld-header__loc">📍 {logement.localisation}</p>
              {logement.description && (
                <p className="ld-header__desc">{logement.description}</p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="ld-controls g-animate g-animate--1">
            <IonSearchbar
              value={search}
              onIonInput={e => setSearch(e.detail.value!)}
              placeholder="Rechercher…"
            />
            <button
              className="ld-add-btn"
              onClick={() => history.push(`/logement/${id}/ajouter-compartiment`)}
            >
              + Ajouter
            </button>
          </div>

          <select
            className="ld-filter g-animate g-animate--1"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="Tous">Tous les types</option>
            <option value="APPARTEMENT">Appartement</option>
            <option value="STUDIO">Studio</option>
            <option value="CHAMBRE">Chambre</option>
            <option value="BOUTIQUE">Boutique</option>
          </select>

          {loading ? (
            <div className="logement-loading">
              <div className="logement-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">🏘️</div>
              <p className="g-empty__text">Aucun compartiment trouvé</p>
            </div>
          ) : (
            <div className="ld-list">
              {filtered.map((c, i) => (
                <div key={c.id} className={`ld-card g-animate g-animate--${Math.min(i+1,5)}`}>
                  <div className="ld-card__head">
                    <div>
                      <p className="ld-card__name">{c.nom}</p>
                      <p className="ld-card__type">{c.type}</p>
                    </div>
                    <span className={`g-badge ${c.statut === 'LIBRE' ? 'g-badge--green' : 'g-badge--gold'}`}>
                      {c.statut === 'LIBRE' ? 'Libre' : 'Occupé'}
                    </span>
                  </div>

                  <div className="ld-rooms">
                    {c.chambres > 0 && <span className="ld-room-pill">🛏 {c.chambres} chambre{c.chambres > 1 ? 's' : ''}</span>}
                    {c.salons   > 0 && <span className="ld-room-pill">🛋 {c.salons} salon{c.salons > 1 ? 's' : ''}</span>}
                    {c.douches  > 0 && <span className="ld-room-pill">🚿 {c.douches} douche{c.douches > 1 ? 's' : ''}</span>}
                    {c.cuisines > 0 && <span className="ld-room-pill">🍳 {c.cuisines} cuisine{c.cuisines > 1 ? 's' : ''}</span>}
                  </div>

                  <div className="ld-card__body">
                    <div className="ld-card__row">
                      <span className="ld-card__key">Occupant</span>
                      <span className="ld-card__val">{c.occupant || '—'}</span>
                    </div>
                  </div>

                  <div className="ld-card__actions">
                    <button
                      className="g-btn g-btn--outline ld-btn"
                      onClick={() => history.push(`/compartiment/${c.id}`)}
                    >
                      Détails
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
      </IonContent>
    </IonPage>
  );
};

export default LogementDetailsPage;