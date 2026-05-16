import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig';
import {
  IonContent, IonHeader, IonPage,
  IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/react';
import './../assets/css/LogementPage.css';

interface Logement {
  id: number;
  nom: string;
  localisation: string;
  description: string;
}

const LogementPage: React.FC = () => {
  const [logements, setLogements]   = useState<Logement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const history = useHistory();

  useEffect(() => {
    axiosInstance.get('logements/')
      .then(r => setLogements(r.data))
      .catch(() => setError('Impossible de charger les logements.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logements.filter(l =>
    l.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
            Logements
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="custom-content">
        <div className="logement-page">

          <div className="logement-page__top g-animate">
            <IonSearchbar
              placeholder="Rechercher…"
              value={searchTerm}
              onIonInput={e => setSearchTerm(e.detail.value || '')}
              className="logement-page__search"
            />
            <button
              className="logement-page__add"
              onClick={() => history.push('/ajouter-logement')}
            >
              + Ajouter
            </button>
          </div>

          {loading ? (
            <div className="logement-loading">
              <div className="logement-spinner" />
              <p>Chargement…</p>
            </div>
          ) : error ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">⚠️</div>
              <p className="g-empty__text">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">🏠</div>
              <p className="g-empty__text">Aucun logement trouvé</p>
            </div>
          ) : (
            <div className="logement-list">
              {filtered.map((l, i) => (
                <div
                  key={l.id}
                  className={`logement-card g-animate g-animate--${Math.min(i + 1, 5)}`}
                >
                  <div className="logement-header">
                    <p className="logement-title">{l.nom}</p>
                  </div>
                  <div className="logement-content">
                    <p><strong>Localisation</strong><br />{l.localisation}</p>
                    {l.description && <p style={{ marginTop: '8px' }}>{l.description}</p>}
                    <button
                      className="g-btn g-btn--primary"
                      style={{ marginTop: '14px' }}
                      onClick={() => history.push(`/logement/${l.id}`)}
                    >
                      Voir les compartiments →
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

export default LogementPage;