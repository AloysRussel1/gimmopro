import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { ADMIN_TABS } from './adminNav';
import { listAdminUsers, toggleUserActive, resetUserPassword, AdminUser } from '../../api/admin';
import '../../components/admin/AdminResourceTable.css';

const AdminUsers: React.FC = () => {
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [count, setCount]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [busyId, setBusyId]     = useState<number | null>(null);
  const [msg, setMsg]           = useState('');

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const load = () => {
    setLoading(true);
    listAdminUsers(page, search)
      .then(res => { setUsers(res.results); setCount(res.count); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleToggle = async (u: AdminUser) => {
    const verbe = u.is_active ? 'désactiver' : 'activer';
    if (!window.confirm(`Confirmer : ${verbe} le compte ${u.email} ?`)) return;
    setBusyId(u.id); setMsg('');
    try {
      const updated = await toggleUserActive(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
    } catch (e: any) {
      setMsg(e?.response?.data?.error || "Erreur lors de l'opération.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReset = async (u: AdminUser) => {
    if (!window.confirm(`Envoyer un email de réinitialisation de mot de passe à ${u.email} ?`)) return;
    setBusyId(u.id); setMsg('');
    try {
      const res = await resetUserPassword(u.id);
      setMsg(res.message);
    } catch {
      setMsg("Échec de l'envoi de l'email.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title="Administration" tabs={ADMIN_TABS}>
      <div className="admin-resource">
        <div className="admin-resource__head">
          <p className="admin-resource__title">Utilisateurs <span className="admin-resource__count">({count})</span></p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            className="g-input" placeholder="Rechercher par email…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <button className="g-btn g-btn--outline" style={{ width: 'auto', padding: '0 18px' }} type="submit">
            Rechercher
          </button>
        </form>

        {msg && <p className="login-tagline" style={{ marginBottom: '14px' }}>{msg}</p>}

        {loading ? (
          <div className="g-loading"><div className="g-spinner" /></div>
        ) : users.length === 0 ? (
          <div className="g-empty"><div className="g-empty__icon">👥</div><p className="g-empty__text">Aucun utilisateur trouvé.</p></div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th><th>Statut</th><th>Vérifié</th><th>Logements</th><th>Inscrit le</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.email || u.username}{u.is_superuser && ' 👑'}</td>
                      <td>
                        <span className={`g-badge ${u.is_active ? 'g-badge--green' : 'g-badge--red'}`}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>{u.is_verified ? '✓' : '—'}</td>
                      <td>{u.nb_logements}</td>
                      <td>{new Date(u.date_joined).toLocaleDateString('fr-FR')}</td>
                      <td className="admin-table__actions">
                        <button
                          className="admin-table__btn"
                          disabled={busyId === u.id}
                          title={u.is_active ? 'Désactiver' : 'Activer'}
                          onClick={() => handleToggle(u)}
                        >
                          {u.is_active ? '🚫' : '✅'}
                        </button>
                        <button
                          className="admin-table__btn"
                          disabled={busyId === u.id}
                          title="Réinitialiser le mot de passe"
                          onClick={() => handleReset(u)}
                        >
                          🔑
                        </button>
                      </td>
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

export default AdminUsers;
