import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig';
import './../assets/css/CompartimentDetails.css';

interface Compartiment {
  id: number; type: string; nom: string; statut: string;
  occupant: string | null; loyer?: number;
  chambres: number; salons: number; douches: number; cuisines: number;
}

const CompartimentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [c, setC]           = useState<Compartiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    axiosInstance.get(`compartiments/${id}/`)
      .then(r => setC(r.data))
      .catch(() => setError('Impossible de charger ce compartiment.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce compartiment ?')) return;
    await axiosInstance.delete(`compartiments/${id}/`);
    history.goBack();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
            Compartiment
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="compartiment-details-content">
        <div className="g-page">
          {loading ? (
            <div className="logement-loading">
              <div className="logement-spinner" />
            </div>
          ) : error ? (
            <div className="g-empty"><p className="g-empty__text">{error}</p></div>
          ) : c ? (
            <>
              {/* Hero */}
              <div className="cd-hero g-animate">
                <p className="cd-hero__name">{c.nom}</p>
                <div className="cd-hero__badges">
                  <span className="g-badge g-badge--gold">{c.type}</span>
                  <span className={`g-badge ${c.statut === 'LIBRE' ? 'g-badge--green' : 'g-badge--gray'}`}>
                    {c.statut === 'LIBRE' ? 'Libre' : 'Occupé'}
                  </span>
                </div>
              </div>

              {/* Détails */}
              <div className="cd-section g-animate g-animate--1">
                <p className="cd-section__title">Informations</p>
                <div className="cd-row">
                  <span className="cd-row__key">Occupant</span>
                  <span className="cd-row__val">{c.occupant || '—'}</span>
                </div>
                {c.loyer && (
                  <div className="cd-row">
                    <span className="cd-row__key">Loyer</span>
                    <span className="cd-row__val" style={{ color: 'var(--g-gold)' }}>
                      {Number(c.loyer).toLocaleString('fr-CA')} $
                    </span>
                  </div>
                )}
              </div>

              {/* Pièces */}
              <div className="cd-section g-animate g-animate--2">
                <p className="cd-section__title">Composition</p>
                <div className="cd-row">
                  <span className="cd-row__key">🛏 Chambres</span>
                  <span className="cd-row__val">{c.chambres}</span>
                </div>
                <div className="cd-row">
                  <span className="cd-row__key">🛋 Salons</span>
                  <span className="cd-row__val">{c.salons}</span>
                </div>
                <div className="cd-row">
                  <span className="cd-row__key">🚿 Douches</span>
                  <span className="cd-row__val">{c.douches}</span>
                </div>
                <div className="cd-row">
                  <span className="cd-row__key">🍳 Cuisines</span>
                  <span className="cd-row__val">{c.cuisines}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="cd-actions g-animate g-animate--3">
                <button className="g-btn g-btn--outline cd-btn" onClick={() => history.goBack()}>
                  ← Retour
                </button>
                <button className="g-btn g-btn--danger cd-btn" onClick={handleDelete}>
                  🗑 Supprimer
                </button>
              </div>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CompartimentDetailsPage;