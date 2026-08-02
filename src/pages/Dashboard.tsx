import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { FiDollarSign, FiAlertTriangle, FiGrid, FiShield, FiMessageCircle, FiCreditCard } from 'react-icons/fi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axiosInstance from '../api/axiosConfig';
import { openWhatsApp } from '../utils/whatsapp';
import '../assets/css/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface Retardataire {
  id: number; nom: string; telephone: string;
  compartiment: string; logement: string;
  depuis: string; jours_retard: number; mois_retard: number;
  loyer: number; montant_du: number;
}
interface MoisHistorique { mois: string; annee: number; total: number; }
interface BailExpirant {
  occupant_id: number; nom: string; telephone: string;
  compartiment: string; logement: string;
  date_fin_contrat: string; jours_restants: number; expire: boolean;
}
interface Renouvellement {
  occupant_id: number; nom: string; telephone: string;
  compartiment: string; logement: string;
  date_anniversaire: string; jours_restants: number;
}
interface CompartimentVacant {
  compartiment_id: number; nom: string; type: string;
  logement_id: number; logement: string; depuis: string; jours_vacants: number;
}
interface Notifications {
  baux_expirants: BailExpirant[];
  loyers_en_retard: any[];
  renouvellements: Renouvellement[];
  compartiments_vacants: CompartimentVacant[];
  total: number;
}
interface Stats {
  logements:    { total: number };
  compartiments:{ total: number; libres: number; occupes: number };
  occupants:    { total: number; actifs: number; en_retard: number; retardataires: Retardataire[] };
  paiements:    { total_revenus: number; revenus_mois: number; total_attendu_mois: number; payes: number; en_attente: number };
  retards:      { montant_total: number; nombre: number };
  caution_totale: number;
  depenses: { total_mois: number };
  revenu_net_mois: number;
  historique_mensuel: MoisHistorique[];
}

const MOIS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const Dashboard: React.FC = () => {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dlLoading, setDlLoading] = useState(false);
  const [notifs,  setNotifs]  = useState<Notifications | null>(null);
  const history = useHistory();

  const now   = new Date();
  const mois  = now.getMonth() + 1;
  const annee = now.getFullYear();

  useEffect(() => {
    axiosInstance.get('dashboard/stats/')
      .then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
    axiosInstance.get('notifications/dashboard/')
      .then(r => setNotifs(r.data)).catch(console.error);
  }, []);

  const renouvelerOccupant = (occupantId: number) => {
    history.push('/locataire', { openEditOccupantId: occupantId });
  };

  const assignerCompartiment = (c: CompartimentVacant) => {
    history.push('/ajouter-locataire', {
      preselectLogementId: c.logement_id,
      preselectLogementNom: c.logement,
      preselectCompartimentId: c.compartiment_id,
      preselectCompartimentNom: c.nom,
      preselectCompartimentType: c.type,
      preselectLoyerReference: null,
    });
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

  const tauxOccupation = stats
    ? stats.compartiments.total > 0
      ? Math.round((stats.compartiments.occupes / stats.compartiments.total) * 100) : 0
    : 0;

  const tauxEncaissement = stats && stats.paiements.total_attendu_mois > 0
    ? Math.min(100, Math.round((stats.paiements.revenus_mois / stats.paiements.total_attendu_mois) * 100))
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

  const relancer = (r: Retardataire) => {
    const moisTexte = MOIS[new Date(r.depuis).getMonth() + 1];
    const lieu = r.compartiment !== '—' ? `${r.logement} - ${r.compartiment}` : r.logement;
    const message = `Bonjour ${r.nom}, sauf erreur de notre part, le loyer de ${moisTexte} pour ${lieu} d'un montant de ${fmt(r.montant_du)} FCFA est en attente. Merci de régulariser la situation dès que possible.`;
    openWhatsApp(r.telephone, message);
  };

  const enregistrerPaiement = (r: Retardataire) => {
    history.push('/paiement', { openOccupantId: r.id });
  };

  const chartData = stats ? {
    labels: stats.historique_mensuel.map(m => m.mois),
    datasets: [{
      label: 'Encaissements',
      data: stats.historique_mensuel.map(m => m.total),
      backgroundColor: '#4F46E5',
      borderRadius: 6,
      maxBarThickness: 34,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: (ctx: any) => `${fmt(ctx.parsed.y)} FCFA` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B', font: { size: 11, family: 'Inter' } } },
      y: {
        grid: { color: '#E2E8F0' },
        ticks: {
          color: '#64748B', font: { size: 10, family: 'Inter' },
          callback: (v: any) => v >= 1000 ? `${Math.round(v / 1000)}k` : v,
        },
      },
    },
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
            <div>
              <p className="dash-hello">Bonjour 👋</p>
              <h1 className="dash-main-title">Vue d'ensemble</h1>
              {stats && (
                <p className="dash-portfolio-sub">
                  {stats.logements.total} logement{stats.logements.total > 1 ? 's' : ''} · {stats.occupants.total} locataire{stats.occupants.total > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button onClick={() => history.push('/profil')} title="Mon profil" className="dash-settings-btn">⚙️</button>
          </div>

          {loading ? (
            <div className="g-loading"><div className="g-spinner" /></div>
          ) : !stats ? (
            <div className="g-empty"><p className="g-empty__text">Impossible de charger</p></div>
          ) : (
            <>
              {/* ── 4 KPI cards ── */}
              <div className="kpi-grid g-animate g-animate--1">
                <div className="kpi-card">
                  <div className="kpi-card__head">
                    <span className="kpi-card__icon kpi-card__icon--accent"><FiDollarSign /></span>
                    <span className="kpi-card__label">Revenus du mois</span>
                  </div>
                  <p className="kpi-card__value">{fmt(stats.paiements.revenus_mois)} <span className="kpi-card__unit">FCFA</span></p>
                  <div className="kpi-card__gauge">
                    <div className="kpi-card__gauge-fill" style={{ width: `${tauxEncaissement}%` }} />
                  </div>
                  <p className="kpi-card__sub">{tauxEncaissement}% des {fmt(stats.paiements.total_attendu_mois)} FCFA attendus</p>
                  {stats.depenses.total_mois > 0 && (
                    <p className="kpi-card__net">
                      Net après charges : <strong>{fmt(stats.revenu_net_mois)} FCFA</strong>
                      <span className="kpi-card__net-charges"> (−{fmt(stats.depenses.total_mois)} F de charges)</span>
                    </p>
                  )}
                </div>

                <div className="kpi-card kpi-card--danger">
                  <div className="kpi-card__head">
                    <span className="kpi-card__icon kpi-card__icon--danger"><FiAlertTriangle /></span>
                    <span className="kpi-card__label">Loyers en retard</span>
                  </div>
                  <p className="kpi-card__value kpi-card__value--danger">{fmt(stats.retards.montant_total)} <span className="kpi-card__unit">FCFA</span></p>
                  <p className="kpi-card__sub">{stats.retards.nombre} locataire{stats.retards.nombre > 1 ? 's' : ''} en retard</p>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card__head">
                    <span className="kpi-card__icon kpi-card__icon--accent"><FiGrid /></span>
                    <span className="kpi-card__label">Taux d'occupation</span>
                  </div>
                  <p className="kpi-card__value">{tauxOccupation}<span className="kpi-card__unit">%</span></p>
                  <p className="kpi-card__sub">{stats.compartiments.occupes} / {stats.compartiments.total} compartiments</p>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card__head">
                    <span className="kpi-card__icon kpi-card__icon--accent"><FiShield /></span>
                    <span className="kpi-card__label">Cautions sous gestion</span>
                  </div>
                  <p className="kpi-card__value">{fmt(stats.caution_totale)} <span className="kpi-card__unit">FCFA</span></p>
                  <p className="kpi-card__sub">Locataires actifs uniquement</p>
                </div>
              </div>

              {/* ── Alertes & Rappels d'Échéances ── */}
              {(stats.occupants.retardataires.length > 0 ||
                (notifs && (notifs.baux_expirants.length + notifs.renouvellements.length + notifs.compartiments_vacants.length) > 0)) && (
                <div className="dash-section g-animate g-animate--2">
                  <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
                    🚨 Alertes & Rappels d'Échéances
                  </p>

                  {stats.occupants.retardataires.length > 0 && (
                    <>
                      <p className="alert-subtitle">🔴 Loyers en retard</p>
                      <div className="alert-list">
                        {stats.occupants.retardataires.map(r => (
                          <div key={r.id} className="alert-row">
                            <div className="alert-row__top">
                              <div>
                                <p className="alert-row__nom">{r.nom}</p>
                                <p className="alert-row__lieu">{r.logement}{r.compartiment !== '—' ? ` · ${r.compartiment}` : ''}</p>
                              </div>
                              <div className="alert-row__right">
                                <p className="alert-row__montant">{fmt(r.montant_du)} F</p>
                                <p className="alert-row__jours">{r.jours_retard} jour{r.jours_retard > 1 ? 's' : ''} de retard</p>
                              </div>
                            </div>
                            <div className="alert-row__actions">
                              <button className="alert-row__btn alert-row__btn--whatsapp" onClick={() => relancer(r)} disabled={!r.telephone}>
                                <FiMessageCircle /> Relancer via WhatsApp
                              </button>
                              <button className="alert-row__btn alert-row__btn--pay" onClick={() => enregistrerPaiement(r)}>
                                <FiCreditCard /> Enregistrer le paiement
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {notifs && (notifs.baux_expirants.length > 0 || notifs.renouvellements.length > 0) && (
                    <>
                      <p className="alert-subtitle">🟠 Baux à renouveler / réviser</p>
                      <div className="alert-list">
                        {notifs.baux_expirants.map(b => (
                          <div key={`exp-${b.occupant_id}`} className="alert-row alert-row--orange">
                            <div className="alert-row__top">
                              <div>
                                <p className="alert-row__nom">{b.nom}</p>
                                <p className="alert-row__lieu">{b.logement}{b.compartiment !== '—' ? ` · ${b.compartiment}` : ''}</p>
                              </div>
                              <div className="alert-row__right">
                                <p className="alert-row__montant">
                                  {b.expire ? 'Bail expiré' : `Expire dans ${b.jours_restants} j`}
                                </p>
                                <p className="alert-row__jours">Fin de bail : {new Date(b.date_fin_contrat).toLocaleDateString('fr-FR')}</p>
                              </div>
                            </div>
                            <div className="alert-row__actions">
                              <button className="alert-row__btn alert-row__btn--renew" onClick={() => renouvelerOccupant(b.occupant_id)}>
                                🔄 Renouveler / Prolonger
                              </button>
                            </div>
                          </div>
                        ))}
                        {notifs.renouvellements.map(rv => (
                          <div key={`anniv-${rv.occupant_id}`} className="alert-row alert-row--orange">
                            <div className="alert-row__top">
                              <div>
                                <p className="alert-row__nom">{rv.nom}</p>
                                <p className="alert-row__lieu">{rv.logement}{rv.compartiment !== '—' ? ` · ${rv.compartiment}` : ''}</p>
                              </div>
                              <div className="alert-row__right">
                                <p className="alert-row__montant">Anniversaire dans {rv.jours_restants} j</p>
                                <p className="alert-row__jours">Le {new Date(rv.date_anniversaire).toLocaleDateString('fr-FR')}</p>
                              </div>
                            </div>
                            <div className="alert-row__actions">
                              <button className="alert-row__btn alert-row__btn--renew" onClick={() => renouvelerOccupant(rv.occupant_id)}>
                                🔄 Réviser le loyer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {notifs && notifs.compartiments_vacants.length > 0 && (
                    <>
                      <p className="alert-subtitle">🔵 Compartiments vacants depuis longtemps</p>
                      <div className="alert-list">
                        {notifs.compartiments_vacants.map(c => (
                          <div key={c.compartiment_id} className="alert-row alert-row--blue">
                            <div className="alert-row__top">
                              <div>
                                <p className="alert-row__nom">{c.nom}</p>
                                <p className="alert-row__lieu">{c.logement}</p>
                              </div>
                              <div className="alert-row__right">
                                <p className="alert-row__montant">{c.jours_vacants} jours</p>
                                <p className="alert-row__jours">Vacant depuis le {new Date(c.depuis).toLocaleDateString('fr-FR')}</p>
                              </div>
                            </div>
                            <div className="alert-row__actions">
                              <button className="alert-row__btn alert-row__btn--assign" onClick={() => assignerCompartiment(c)}>
                                + Assigner un locataire
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Graphique 6 mois ── */}
              <div className="dash-section g-card g-animate g-animate--3">
                <p className="g-section-title" style={{ fontSize: '16px', marginBottom: '14px' }}>
                  📈 Encaissements — 6 derniers mois
                </p>
                <div className="dash-chart-wrap">
                  {chartData && <Bar data={chartData} options={chartOptions} />}
                </div>
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
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
