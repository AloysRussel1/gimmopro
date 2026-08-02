import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { ADMIN_TABS } from './adminNav';
import { listActivityLogs, ActivityLogEntry } from '../../api/admin';

const ACTION_LABEL: Record<string, string> = {
  REGISTER: '🆕 Inscription',
  LOGIN: '🔑 Connexion',
  ACCOUNT_ACTIVATED: '✅ Compte activé',
  ACCOUNT_DEACTIVATED: '🚫 Compte désactivé',
};

const AdminLogs: React.FC = () => {
  const [logs, setLogs]       = useState<ActivityLogEntry[]>([]);
  const [count, setCount]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  useEffect(() => {
    setLoading(true);
    listActivityLogs(page)
      .then(res => { setLogs(res.results); setCount(res.count); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminLayout title="Administration" tabs={ADMIN_TABS}>
      <div className="admin-resource">
        <div className="admin-resource__head">
          <p className="admin-resource__title">Journal d'activité <span className="admin-resource__count">({count})</span></p>
        </div>

        {loading ? (
          <div className="g-loading"><div className="g-spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="g-empty"><div className="g-empty__icon">📋</div><p className="g-empty__text">Aucune activité enregistrée.</p></div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Action</th><th>Utilisateur</th><th>Détail</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{ACTION_LABEL[log.action] || log.action}</td>
                      <td>{log.user_email || '—'}</td>
                      <td>{log.description || '—'}</td>
                      <td>{new Date(log.date_creation).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="g-btn g-btn--outline admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
                <span className="admin-pagination__label">Page {page} / {totalPages}</span>
                <button className="g-btn g-btn--outline admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
