import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  FiHome, FiGrid, FiList, FiMapPin, FiUsers, FiDollarSign, FiAlertTriangle,
} from 'react-icons/fi';
import axiosInstance from './../api/axiosConfig';
import {
  IonContent, IonHeader, IonPage,
  IonSearchbar, IonTitle, IonToolbar,
} from '@ionic/react';
import SkeletonLoader from '../components/SkeletonLoader';
import './../assets/css/LogementPage.css';

interface LocatairePrincipal {
  nom_complet: string;
  statut: string;
}

interface Logement {
  id: number;
  nom: string;
  localisation: string;
  description: string;
  nb_compartiments: number;
  nb_occupes: number;
  nb_libres: number;
  nb_locataires_actifs: number;
  nb_locataires_retard: number;
  loyer_mensuel_total: string;
  locataire_principal: LocatairePrincipal | null;
}

interface DashboardStats {
  compartiments: { total: number; libres: number; occupes: number };
  paiements: { revenus_mois: number; total_attendu_mois: number };
  retards: { montant_total: number; nombre: number };
}

type StatutLogement = 'occupe' | 'vacant' | 'retard';
type Filtre = 'tous' | 'occupes' | 'vacants' | 'retard';
type Vue = 'grille' | 'liste';

// Dégradés déterministes (par id) plutôt qu'aléatoires -- une carte garde
// toujours la même couleur d'un rafraîchissement à l'autre, ce qui aide à
// la repérer visuellement dans une longue liste. Le modèle Logement n'a ni
// photo ni champ "type" (villa/appartement) -- voir gimmopro_backend/app/
// models.py -- d'où ce placeholder coloré plutôt qu'une vraie couverture.
const DEGRADES = [
  'linear-gradient(135deg,#4F46E5,#818CF8)',
  'linear-gradient(135deg,#0284C7,#38BDF8)',
  'linear-gradient(135deg,#16A34A,#4ADE80)',
  'linear-gradient(135deg,#D97706,#FBBF24)',
  'linear-gradient(135deg,#DB2777,#F472B6)',
  'linear-gradient(135deg,#7C3AED,#A78BFA)',
];
const degradePour = (id: number) => DEGRADES[id % DEGRADES.length];

const initiales = (nom: string) =>
  nom.split(' ').filter(Boolean).slice(0, 2).map(mot => mot[0]?.toUpperCase()).join('');

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

const statutDe = (l: Logement): StatutLogement => {
  if (l.nb_locataires_retard > 0) return 'retard';
  if (l.nb_locataires_actifs > 0) return 'occupe';
  return 'vacant';
};

const LABEL_STATUT: Record<StatutLogement, string> = {
  occupe: '● Occupé',
  vacant: '● Vacant',
  retard: '● En retard',
};

const LogementPage: React.FC = () => {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtre, setFiltre]       = useState<Filtre>('tous');
  const [vue, setVue]             = useState<Vue>('grille');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const history = useHistory();

  useEffect(() => {
    axiosInstance.get('logements/')
      .then(r => setLogements(r.data))
      .catch(() => setError('Impossible de charger les logements.'))
      .finally(() => setLoading(false));
    axiosInstance.get('dashboard/stats/')
      .then(r => setStats(r.data))
      .catch(() => { /* la page reste utilisable sans le bandeau KPI */ });
  }, []);

  const compteurs = useMemo(() => ({
    tous:    logements.length,
    occupes: logements.filter(l => statutDe(l) !== 'vacant').length,
    vacants: logements.filter(l => statutDe(l) === 'vacant').length,
    retard:  logements.filter(l => statutDe(l) === 'retard').length,
  }), [logements]);

  const filtered = useMemo(() => {
    const terme = searchTerm.toLowerCase();
    return logements
      .filter(l => l.nom.toLowerCase().includes(terme) || l.localisation.toLowerCase().includes(terme))
      .filter(l => {
        if (filtre === 'tous') return true;
        const s = statutDe(l);
        if (filtre === 'occupes') return s !== 'vacant';
        if (filtre === 'vacants') return s === 'vacant';
        return s === 'retard';
      });
  }, [logements, searchTerm, filtre]);

  const tauxOccupation = stats && stats.compartiments.total > 0
    ? Math.round((stats.compartiments.occupes / stats.compartiments.total) * 100) : 0;
  const tauxEncaissement = stats && stats.paiements.total_attendu_mois > 0
    ? Math.min(100, Math.round((stats.paiements.revenus_mois / stats.paiements.total_attendu_mois) * 100)) : 0;
  const nbOccupesLogements = compteurs.occupes;
  const nbVacantsLogements = compteurs.vacants;

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

          {loading ? (
            <SkeletonLoader variant="stat-cards" count={4} />
          ) : !error && logements.length > 0 && (
            <div className="kpi-grid g-animate">
              <div className="kpi-card">
                <div className="kpi-card__head">
                  <span className="kpi-card__icon kpi-card__icon--accent"><FiGrid /></span>
                  <span className="kpi-card__label">Taux d'occupation</span>
                </div>
                <p className="kpi-card__value">{tauxOccupation}<span className="kpi-card__unit">%</span></p>
                <div className="kpi-card__gauge"><div className="kpi-card__gauge-fill" style={{ width: `${tauxOccupation}%` }} /></div>
                <p className="kpi-card__sub">{stats?.compartiments.occupes ?? 0} / {stats?.compartiments.total ?? 0} compartiments</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-card__head">
                  <span className="kpi-card__icon kpi-card__icon--accent"><FiDollarSign /></span>
                  <span className="kpi-card__label">Revenu du mois</span>
                </div>
                <p className="kpi-card__value">{fmt(stats?.paiements.revenus_mois ?? 0)} <span className="kpi-card__unit">FCFA</span></p>
                <div className="kpi-card__gauge"><div className="kpi-card__gauge-fill" style={{ width: `${tauxEncaissement}%` }} /></div>
                <p className="kpi-card__sub">{tauxEncaissement}% des {fmt(stats?.paiements.total_attendu_mois ?? 0)} FCFA attendus</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-card__head">
                  <span className="kpi-card__icon kpi-card__icon--accent"><FiHome /></span>
                  <span className="kpi-card__label">Logements</span>
                </div>
                <p className="kpi-card__value">{logements.length}</p>
                <p className="kpi-card__sub">
                  {nbOccupesLogements} occupé{nbOccupesLogements > 1 ? 's' : ''} · {nbVacantsLogements} vacant{nbVacantsLogements > 1 ? 's' : ''}
                </p>
              </div>

              <div className={`kpi-card ${compteurs.retard > 0 ? 'kpi-card--danger' : ''}`}>
                <div className="kpi-card__head">
                  <span className="kpi-card__icon kpi-card__icon--danger"><FiAlertTriangle /></span>
                  <span className="kpi-card__label">Loyers en retard</span>
                </div>
                <p className={`kpi-card__value ${(stats?.retards.nombre ?? 0) > 0 ? 'kpi-card__value--danger' : ''}`}>
                  {fmt(stats?.retards.montant_total ?? 0)} <span className="kpi-card__unit">FCFA</span>
                </p>
                <p className="kpi-card__sub">{stats?.retards.nombre ?? 0} locataire{(stats?.retards.nombre ?? 0) > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}

          <div className="logement-page__top g-animate g-animate--1">
            <IonSearchbar
              placeholder="Rechercher un logement…"
              value={searchTerm}
              onIonInput={e => setSearchTerm(e.detail.value || '')}
              className="logement-page__search"
            />
            <div className="log-view-toggle">
              <button
                className={`log-view-toggle__btn ${vue === 'grille' ? 'active' : ''}`}
                onClick={() => setVue('grille')}
                aria-label="Vue grille"
              ><FiGrid /></button>
              <button
                className={`log-view-toggle__btn ${vue === 'liste' ? 'active' : ''}`}
                onClick={() => setVue('liste')}
                aria-label="Vue liste"
              ><FiList /></button>
            </div>
            <button
              className="logement-page__add"
              onClick={() => history.push('/ajouter-logement')}
            >
              + Ajouter
            </button>
          </div>

          {!loading && !error && logements.length > 0 && (
            <div className="log-filters g-animate g-animate--2">
              {(['tous', 'occupes', 'vacants', 'retard'] as Filtre[]).map(f => (
                <button
                  key={f}
                  className={`log-filter-chip ${filtre === f ? 'active' : ''} ${f === 'retard' ? 'log-filter-chip--danger' : ''}`}
                  onClick={() => setFiltre(f)}
                >
                  {f === 'tous' ? 'Tous' : f === 'occupes' ? 'Occupés' : f === 'vacants' ? 'Vacants' : 'En retard'}
                  <span className="log-filter-chip__count">{compteurs[f]}</span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <SkeletonLoader variant="cards" count={3} />
          ) : error ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">⚠️</div>
              <p className="g-empty__text">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="g-empty g-animate">
              <div className="g-empty__icon">🏠</div>
              <p className="g-empty__text">
                {logements.length === 0 ? 'Aucun logement pour le moment' : 'Aucun logement ne correspond à ce filtre'}
              </p>
            </div>
          ) : (
            <div className={vue === 'grille' ? 'log-grid' : 'log-list'}>
              {filtered.map((l, i) => {
                const s = statutDe(l);
                return (
                  <div
                    key={l.id}
                    className={`log-card log-card--${vue} g-animate g-animate--${Math.min(i + 1, 5)}`}
                    onClick={() => history.push(`/logement/${l.id}`)}
                  >
                    <div className="log-card__cover" style={{ background: degradePour(l.id) }}>
                      <span className="log-card__cover-icon"><FiHome /></span>
                      <span className={`log-card__status-badge log-card__status-badge--${s}`}>
                        {LABEL_STATUT[s]}
                      </span>
                      <p className="log-card__cover-title">{l.nom}</p>
                    </div>

                    <div className="log-card__body">
                      <div className="log-card__main">
                        <p className="log-card__title">{l.nom}</p>
                        <p className="log-card__loc"><FiMapPin /> {l.localisation}</p>

                        <div className="log-card__chips">
                          <span className="log-card__chip">
                            {l.nb_compartiments} compartiment{l.nb_compartiments !== 1 ? 's' : ''}
                          </span>
                          {l.nb_libres > 0 && (
                            <span className="log-card__chip">
                              {l.nb_libres} libre{l.nb_libres !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="log-card__divider" />

                      <div className="log-card__row">
                        <div className="log-card__tenant">
                          {l.locataire_principal ? (
                            <>
                              <span className="log-card__avatar">{initiales(l.locataire_principal.nom_complet)}</span>
                              <span className="log-card__tenant-name">{l.locataire_principal.nom_complet}</span>
                            </>
                          ) : l.nb_locataires_actifs > 1 ? (
                            <>
                              <span className="log-card__avatar log-card__avatar--multi"><FiUsers /></span>
                              <span className="log-card__tenant-name">{l.nb_locataires_actifs} locataires</span>
                            </>
                          ) : (
                            <span className="log-card__tenant-name log-card__tenant-name--muted">Aucun locataire</span>
                          )}
                        </div>
                        <span className={`log-card__pastille log-card__pastille--${s}`} />
                      </div>

                      <p className="log-card__rent">
                        {fmt(parseFloat(l.loyer_mensuel_total))} <span>FCFA<span className="log-card__rent-unit"> /mois</span></span>
                      </p>

                      <button
                        className="g-btn g-btn--primary"
                        onClick={(e) => { e.stopPropagation(); history.push(`/logement/${l.id}`); }}
                      >
                        Voir les compartiments →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LogementPage;
