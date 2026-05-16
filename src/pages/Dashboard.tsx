import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
} from '@ionic/react';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Dashboard.css';

interface Stats {
  logements: { total: number };
  compartiments: { total: number; libres: number; occupes: number };
  occupants: { total: number; actifs: number; en_retard: number };
  paiements: { total_revenus: number; payes: number; en_attente: number };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('dashboard/stats/')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="dash-title">Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dash-content">
        <div className="g-page">

          <div className="dash-header g-animate">
            <p className="dash-hello">Bonjour 👋</p>
            <h1 className="dash-main-title">Vue d'ensemble</h1>
          </div>

          {loading ? (
            <div className="dash-loading">
              <div className="dash-spinner" />
              <p>Chargement…</p>
            </div>
          ) : stats ? (
            <>
              {/* Hero revenus */}
              <div className="dash-hero g-animate g-animate--1">
                <p className="dash-hero__label">Revenus totaux</p>
                <p className="dash-hero__value">{fmt(stats.paiements.total_revenus)}</p>
                <div className="dash-hero__row">
                  <span className="g-badge g-badge--green">✓ {stats.paiements.payes} payés</span>
                  <span className="g-badge g-badge--red">⚠ {stats.paiements.en_attente} en attente</span>
                </div>
              </div>

              {/* Grille stats */}
              <div className="dash-grid">
                <div className="g-stat g-stat--gold g-animate g-animate--2">
                  <span className="g-stat__label">Logements</span>
                  <span className="g-stat__value">{stats.logements.total}</span>
                </div>
                <div className="g-stat g-animate g-animate--2">
                  <span className="g-stat__label">Compartiments</span>
                  <span className="g-stat__value">{stats.compartiments.total}</span>
                  <span className="g-stat__sub">{stats.compartiments.libres} libres · {stats.compartiments.occupes} occupés</span>
                </div>
                <div className="g-stat g-stat--green g-animate g-animate--3">
                  <span className="g-stat__label">Locataires actifs</span>
                  <span className="g-stat__value">{stats.occupants.actifs}</span>
                </div>
                <div className="g-stat g-stat--red g-animate g-animate--3">
                  <span className="g-stat__label">En retard</span>
                  <span className="g-stat__value">{stats.occupants.en_retard}</span>
                </div>
              </div>

              {/* Taux occupation */}
              <div className="dash-rate g-card g-animate g-animate--4">
                <div className="dash-rate__head">
                  <span className="g-stat__label">Taux d'occupation</span>
                  <span className="dash-rate__pct">
                    {stats.compartiments.total > 0
                      ? Math.round((stats.compartiments.occupes / stats.compartiments.total) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="dash-bar">
                  <div
                    className="dash-bar__fill"
                    style={{
                      width: stats.compartiments.total > 0
                        ? `${(stats.compartiments.occupes / stats.compartiments.total) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="g-empty">
              <div className="g-empty__icon">📊</div>
              <p className="g-empty__text">Impossible de charger les données</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;