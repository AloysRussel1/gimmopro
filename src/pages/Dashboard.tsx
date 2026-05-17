import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import '../assets/css/Dashboard.css';

interface Retardataire { id: number; nom: string; compartiment: string; depuis: string; loyer: number; }
interface Stats {
  logements:    { total: number };
  compartiments:{ total: number; libres: number; occupes: number };
  occupants:    { total: number; actifs: number; en_retard: number; retardataires: Retardataire[] };
  paiements:    { total_revenus: number; revenus_mois: number; payes: number; en_attente: number };
}

const MOIS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const Dashboard: React.FC = () => {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dlLoading, setDlLoading] = useState(false);
  const history = useHistory();

  const now   = new Date();
  const mois  = now.getMonth() + 1;
  const annee = now.getFullYear();

  useEffect(() => {
    axiosInstance.get('dashboard/stats/')
      .then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

  const tauxOccupation = stats
    ? stats.compartiments.total > 0
      ? Math.round((stats.compartiments.occupes / stats.compartiments.total) * 100) : 0
    : 0;

  const downloadRapport = async (m: number, a: number) => {
    setDlLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url   = `${axiosInstance.defaults.baseURL}rapports/mensuel/?mois=${m}&annee=${a}`;
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob  = await res.blob();
      const link  = document.createElement('a');
      link.href   = URL.createObjectURL(blob);
      link.download = `rapport_${MOIS[m]}_${a}.pdf`;
      link.click();
    } catch (e) { console.error(e); }
    finally { setDlLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tableau de bord</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dash-content">
        <div className="g-page">

          <div className="dash-greeting g-animate">
            <p className="dash-hello">Bonjour 👋</p>
            <h1 className="dash-main-title">Vue d'ensemble</h1>
          </div>

          {loading ? (
            <div className="g-loading"><div className="g-spinner" /></div>
          ) : !stats ? (
            <div className="g-empty"><p className="g-empty__text">Impossible de charger</p></div>
          ) : (
            <>
              {/* Alerte retards */}
              {stats.occupants.en_retard > 0 && (
                <div className="dash-alert g-animate">
                  <div className="dash-alert__icon">⚠️</div>
                  <div className="dash-alert__text">
                    <p className="dash-alert__title">{stats.occupants.en_retard} locataire{stats.occupants.en_retard > 1 ? 's' : ''} en retard</p>
                    <p className="dash-alert__sub">Paiements en attente</p>
                  </div>
                  <button className="dash-alert__btn" onClick={() => history.push('/paiement')}>Voir →</button>
                </div>
              )}

              {/* Hero revenus */}
              <div className="dash-hero g-animate g-animate--1">
                <div>
                  <p className="dash-hero__label">Revenus totaux</p>
                  <p className="dash-hero__value">{fmt(stats.paiements.total_revenus)} F</p>
                  <p className="dash-hero__mois">Ce mois : <strong>{fmt(stats.paiements.revenus_mois)} F</strong></p>
                </div>
                <div className="dash-hero__badges">
                  <span className="g-badge g-badge--green">✓ {stats.paiements.payes} payés</span>
                  <span className="g-badge g-badge--red">⚠ {stats.paiements.en_attente} en attente</span>
                </div>
              </div>

              {/* Grille stats */}
              <div className="dash-grid g-animate g-animate--2">
                <div className="g-stat g-stat--gold" onClick={() => history.push('/logement')}>
                  <span className="g-stat__label">🏠 Logements</span>
                  <span className="g-stat__value">{stats.logements.total}</span>
                  <span className="g-stat__sub">Propriétés</span>
                </div>
                <div className="g-stat" onClick={() => history.push('/locataire')}>
                  <span className="g-stat__label">👤 Locataires</span>
                  <span className="g-stat__value">{stats.occupants.total}</span>
                  <span className="g-stat__sub">{stats.occupants.actifs} actifs · {stats.occupants.en_retard} en retard</span>
                </div>
                <div className="g-stat g-stat--green">
                  <span className="g-stat__label">🔓 Libres</span>
                  <span className="g-stat__value">{stats.compartiments.libres}</span>
                  <span className="g-stat__sub">Disponibles</span>
                </div>
                <div className="g-stat g-stat--red">
                  <span className="g-stat__label">🔒 Occupés</span>
                  <span className="g-stat__value">{stats.compartiments.occupes}</span>
                  <span className="g-stat__sub">Sur {stats.compartiments.total}</span>
                </div>
              </div>

              {/* Taux occupation */}
              <div className="dash-taux g-card g-animate g-animate--3">
                <div className="dash-taux__head">
                  <span className="g-stat__label">Taux d'occupation</span>
                  <span className="dash-taux__pct" style={{
                    color: tauxOccupation >= 80 ? 'var(--g-success)' : tauxOccupation >= 50 ? 'var(--g-gold)' : 'var(--g-danger)'
                  }}>{tauxOccupation}%</span>
                </div>
                <div className="dash-bar"><div className="dash-bar__fill" style={{ width: `${tauxOccupation}%` }} /></div>
                <p className="dash-taux__sub">{stats.compartiments.occupes} occupés sur {stats.compartiments.total} compartiments</p>
              </div>

              {/* Rapport mensuel */}
              <div className="dash-rapport g-card g-animate g-animate--4">
                <div className="dash-rapport__head">
                  <div>
                    <p className="dash-rapport__title">📋 Rapport mensuel</p>
                    <p className="dash-rapport__sub">{MOIS[mois]} {annee}</p>
                  </div>
                  <button
                    className="dash-rapport__btn"
                    onClick={() => downloadRapport(mois, annee)}
                    disabled={dlLoading}
                  >
                    {dlLoading ? '⏳' : '⬇️ PDF'}
                  </button>
                </div>
                {/* Mois précédent */}
                <button
                  className="dash-rapport__prev"
                  onClick={() => {
                    const prevMois  = mois === 1 ? 12 : mois - 1;
                    const prevAnnee = mois === 1 ? annee - 1 : annee;
                    downloadRapport(prevMois, prevAnnee);
                  }}
                >
                  Télécharger {MOIS[mois === 1 ? 12 : mois - 1]} →
                </button>
              </div>

              {/* Retardataires */}
              {stats.occupants.retardataires.length > 0 && (
                <div className="dash-retards g-animate g-animate--5">
                  <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
                    🚨 Retards de paiement
                  </p>
                  {stats.occupants.retardataires.map(r => (
                    <div key={r.id} className="dash-retard-card">
                      <div className="dash-retard__info">
                        <p className="dash-retard__nom">{r.nom}</p>
                        <p className="dash-retard__comp">{r.compartiment}</p>
                      </div>
                      <div className="dash-retard__right">
                        <p className="dash-retard__loyer">{fmt(r.loyer)} F</p>
                        <p className="dash-retard__date">Dû le {new Date(r.depuis).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ))}
                  <button className="g-btn g-btn--outline" style={{ marginTop: '12px' }} onClick={() => history.push('/paiement')}>
                    Gérer les paiements →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;