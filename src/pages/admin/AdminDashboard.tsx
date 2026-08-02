import React, { useEffect, useState } from 'react';
import { FiUsers, FiUserCheck, FiHome, FiDollarSign, FiTrendingDown, FiShield } from 'react-icons/fi';
import AdminLayout from '../../components/admin/AdminLayout';
import { ADMIN_TABS } from './adminNav';
import { getAdminStats, AdminStats } from '../../api/admin';

const AdminDashboard: React.FC = () => {
  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

  return (
    <AdminLayout title="Administration" tabs={ADMIN_TABS}>
      {loading ? (
        <div className="g-loading"><div className="g-spinner" /></div>
      ) : !stats ? (
        <div className="g-empty"><p className="g-empty__text">Impossible de charger les statistiques.</p></div>
      ) : (
        <div className="kpi-grid g-animate">
          <div className="kpi-card">
            <div className="kpi-card__head">
              <span className="kpi-card__icon kpi-card__icon--accent"><FiUsers /></span>
              <span className="kpi-card__label">Utilisateurs</span>
            </div>
            <p className="kpi-card__value">{stats.total_users}</p>
            <p className="kpi-card__sub">{stats.active_users} actifs · {stats.verified_users} vérifiés</p>
          </div>

          <div className="kpi-card">
            <div className="kpi-card__head">
              <span className="kpi-card__icon kpi-card__icon--accent"><FiUserCheck /></span>
              <span className="kpi-card__label">Comptes actifs</span>
            </div>
            <p className="kpi-card__value">{stats.active_users}</p>
            <p className="kpi-card__sub">sur {stats.total_users} inscrits</p>
          </div>

          <div className="kpi-card">
            <div className="kpi-card__head">
              <span className="kpi-card__icon kpi-card__icon--accent"><FiHome /></span>
              <span className="kpi-card__label">Logements enregistrés</span>
            </div>
            <p className="kpi-card__value">{stats.total_logements}</p>
            <p className="kpi-card__sub">{stats.total_occupants} locataires actifs</p>
          </div>

          <div className="kpi-card">
            <div className="kpi-card__head">
              <span className="kpi-card__icon kpi-card__icon--accent"><FiShield /></span>
              <span className="kpi-card__label">Locataires actifs</span>
            </div>
            <p className="kpi-card__value">{stats.total_occupants}</p>
            <p className="kpi-card__sub">tous propriétaires confondus</p>
          </div>

          <div className="kpi-card">
            <div className="kpi-card__head">
              <span className="kpi-card__icon kpi-card__icon--accent"><FiDollarSign /></span>
              <span className="kpi-card__label">Encaissements du mois</span>
            </div>
            <p className="kpi-card__value">{fmt(stats.total_paiements_mois)} <span className="kpi-card__unit">FCFA</span></p>
            <p className="kpi-card__sub">tous propriétaires confondus</p>
          </div>

          <div className="kpi-card kpi-card--danger">
            <div className="kpi-card__head">
              <span className="kpi-card__icon kpi-card__icon--danger"><FiTrendingDown /></span>
              <span className="kpi-card__label">Dépenses du mois</span>
            </div>
            <p className="kpi-card__value kpi-card__value--danger">{fmt(stats.total_depenses_mois)} <span className="kpi-card__unit">FCFA</span></p>
            <p className="kpi-card__sub">tous propriétaires confondus</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
