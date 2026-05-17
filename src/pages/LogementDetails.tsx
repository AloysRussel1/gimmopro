import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonSearchbar,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig';
import './../assets/css/LogementDetails.css';

interface OccupantMini {
  id: number; nom_complet: string; telephone: string;
  loyer: string; date_prochain_paiement: string; statut: string;
}
interface Compartiment {
  id: number; type: string; nom: string; statut: string;
  logement: number; chambres: number; salons: number;
  douches: number; cuisines: number;
  occupant_actuel: OccupantMini | null;
}
interface Logement {
  id: number; nom: string; localisation: string; description: string;
  nb_compartiments: number; nb_occupes: number; nb_libres: number;
}

const LogementDetailsPage: React.FC = () => {
  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('Tous');
  const [compartiments, setCompartiments] = useState<Compartiment[]>([]);
  const [logement,      setLogement]      = useState<Logement | null>(null);
  const [loading,       setLoading]       = useState(true);
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

  const handleLiberer = async (occupantId: number, nom: string) => {
    if (!window.confirm(`Confirmer le départ de ${nom} ?`)) return;
    await axiosInstance.post(`occupants/${occupantId}/liberer/`);
    // Rafraîchir les compartiments
    const res = await axiosInstance.get(`logements/${id}/compartiments/`);
    setCompartiments(res.data);
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

          {/* Stats logement */}
          {logement && (
            <div className="ld-header g-animate">
              <p className="ld-header__name">{logement.nom}</p>
              <p className="ld-header__loc">📍 {logement.localisation}</p>
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

          <select className="ld-filter g-animate g-animate--1"
            value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="Tous">Tous les types</option>
            <option value="APPARTEMENT">Appartement</option>
            <option value="STUDIO">Studio</option>
            <option value="CHAMBRE">Chambre</option>
            <option value="BOUTIQUE">Boutique</option>
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
                  {/* Header compartiment */}
                  <div className="ld-card__head">
                    <div>
                      <p className="ld-card__name">{c.nom}</p>
                      <p className="ld-card__type">{c.type}</p>
                    </div>
                    <span className={`g-badge ${c.statut === 'LIBRE' ? 'g-badge--green' : 'g-badge--gold'}`}>
                      {c.statut === 'LIBRE' ? 'Libre' : 'Occupé'}
                    </span>
                  </div>

                  {/* Pièces */}
                  <div className="ld-rooms">
                    {c.chambres > 0 && <span className="ld-room-pill">🛏 {c.chambres}</span>}
                    {c.salons   > 0 && <span className="ld-room-pill">🛋 {c.salons}</span>}
                    {c.douches  > 0 && <span className="ld-room-pill">🚿 {c.douches}</span>}
                    {c.cuisines > 0 && <span className="ld-room-pill">🍳 {c.cuisines}</span>}
                  </div>

                  {/* Occupant actuel */}
                  {c.occupant_actuel ? (
                    <div className="ld-occupant">
                      <div className="ld-occupant__info">
                        <p className="ld-occupant__name">{c.occupant_actuel.nom_complet}</p>
                        <p className="ld-occupant__detail">
                          {parseFloat(c.occupant_actuel.loyer).toLocaleString('fr-CA')} / mois ·{' '}
                          <span className={c.occupant_actuel.statut === 'En retard' ? 'ld-retard' : 'ld-actif'}>
                            {c.occupant_actuel.statut}
                          </span>
                        </p>
                        <p className="ld-occupant__next">
                          Prochain paiement : {new Date(c.occupant_actuel.date_prochain_paiement).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                      <button
                        className="g-btn g-btn--danger ld-liberer-btn"
                        onClick={() => handleLiberer(c.occupant_actuel!.id, c.occupant_actuel!.nom_complet)}
                      >
                        Libérer
                      </button>
                    </div>
                  ) : (
                    <div className="ld-libre-msg">
                      <span>Compartiment libre</span>
                      <button
                        className="g-btn g-btn--primary ld-assign-btn"
                        onClick={() => history.push('/ajouter-locataire')}
                      >
                        + Assigner
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="ld-card__actions">
                    <button className="g-btn g-btn--outline ld-btn"
                      onClick={() => history.push(`/compartiment/${c.id}`)}>
                      Détails
                    </button>
                    <button className="g-btn g-btn--danger ld-btn"
                      onClick={() => handleDelete(c.id)}>
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