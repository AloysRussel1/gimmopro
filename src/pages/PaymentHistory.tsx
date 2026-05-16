import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig';
import './../assets/css/PaymentHistory.css';

interface Paiement {
  id: number;
  montant_verse: string;
  date_paiement: string;
  date_prochain_paiement: string;
  statut: string;
}

const PaymentHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    axiosInstance.get(`paiements/?occupant_id=${id}`)
      .then(r => setPaiements(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" fill="clear" onClick={() => window.history.back()}>
            <IonIcon icon={arrowBack} style={{ color: 'var(--g-text)' }} />
          </IonButton>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
            Historique
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payment-history-content">
        <div className="ph-wrap">
          {loading ? (
            <div className="logement-loading">
              <div className="logement-spinner" />
            </div>
          ) : paiements.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">💳</div>
              <p className="g-empty__text">Aucun paiement enregistré</p>
            </div>
          ) : (
            <div className="ph-list">
              {paiements.map((p, i) => (
                <div key={p.id} className={`ph-card g-animate g-animate--${Math.min(i+1,5)}`}>
                  <div className="ph-card__row">
                    <span className="ph-card__key">Montant</span>
                    <span className="ph-card__val ph-card__val--gold">
                      {parseFloat(p.montant_verse).toLocaleString('fr-CA')} $
                    </span>
                  </div>
                  <div className="ph-card__row">
                    <span className="ph-card__key">Date de paiement</span>
                    <span className="ph-card__val">
                      {new Date(p.date_paiement).toLocaleDateString('fr-CA')}
                    </span>
                  </div>
                  <div className="ph-card__row">
                    <span className="ph-card__key">Prochain paiement</span>
                    <span className="ph-card__val">
                      {new Date(p.date_prochain_paiement).toLocaleDateString('fr-CA')}
                    </span>
                  </div>
                  <div className="ph-card__row">
                    <span className="ph-card__key">Statut</span>
                    <span className={`g-badge ${p.statut === 'Payé' ? 'g-badge--green' : 'g-badge--red'}`}>
                      {p.statut}
                    </span>
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

export default PaymentHistory;