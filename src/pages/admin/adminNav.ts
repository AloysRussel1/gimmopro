import { AdminTab } from '../../components/admin/AdminLayout';

// Liste des sections admin GimmoPro — le seul endroit "métier" dans toute
// la partie admin ; AdminLayout lui-même reste générique.
export const ADMIN_TABS: AdminTab[] = [
  { path: '/admin',       label: "📊 Vue d'ensemble", exact: true },
  { path: '/admin/users', label: '👥 Utilisateurs' },
  { path: '/admin/data',  label: '🗂 Données' },
  { path: '/admin/logs',  label: '📋 Logs' },
];
