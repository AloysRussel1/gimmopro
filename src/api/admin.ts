import axiosInstance from './axiosConfig';

// Couche fine au-dessus des endpoints /api/admin/* — tous protégés
// IsAdminUser côté backend. Réutilisable telle quelle comme modèle pour
// de futurs projets : chaque fonction correspond à un seul appel réseau,
// aucune logique métier ici.

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  verified_users: number;
  total_logements: number;
  total_occupants: number;
  total_paiements_mois: number;
  total_depenses_mois: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  is_verified: boolean;
  nb_logements: number;
}

export interface ActivityLogEntry {
  id: number;
  user: number | null;
  user_email: string | null;
  action: string;
  description: string;
  date_creation: string;
}

export const getAdminStats = () =>
  axiosInstance.get<AdminStats>('admin/stats/').then(r => r.data);

export const listAdminUsers = (page = 1, search = '') =>
  axiosInstance
    .get<PaginatedResponse<AdminUser>>('admin/users/', { params: { page, search: search || undefined } })
    .then(r => r.data);

export const toggleUserActive = (userId: number) =>
  axiosInstance.post<AdminUser>(`admin/users/${userId}/toggle-active/`).then(r => r.data);

export const resetUserPassword = (userId: number) =>
  axiosInstance.post<{ message: string }>(`admin/users/${userId}/reset-password/`).then(r => r.data);

export const listActivityLogs = (page = 1) =>
  axiosInstance
    .get<PaginatedResponse<ActivityLogEntry>>('admin/activity-logs/', { params: { page } })
    .then(r => r.data);

// ── Support du sélecteur en cascade Occupant (logement -> compartiment) ──
export interface AdminLogementOption {
  id: number;
  nom: string;
  proprietaire_email: string;
}
export interface AdminCompartimentOption {
  id: number;
  nom: string;
  type: string;
  statut: string;
}

export const listAllLogementsForPicker = () =>
  axiosInstance
    .get<PaginatedResponse<AdminLogementOption>>('admin/logements/', { params: { page_size: 100 } })
    .then(r => r.data.results);

export const listCompartimentsForLogement = (logementId: number) =>
  axiosInstance
    .get<AdminCompartimentOption[]>(`admin/logements/${logementId}/compartiments/`)
    .then(r => r.data);

// Options { value, label } prêtes pour un champ 'select' avec optionsLoader
// (ex: choisir le propriétaire d'un logement).
export const listAllUsersAsOptions = () =>
  axiosInstance
    .get<PaginatedResponse<AdminUser>>('admin/users/', { params: { page_size: 100 } })
    .then(r => r.data.results.map(u => ({ value: u.id, label: u.email })));

interface AdminOccupantOption { id: number; nom_complet: string; logement_nom: string; compartiment_nom: string; }
export const listAllOccupantsAsOptions = () =>
  axiosInstance
    .get<PaginatedResponse<AdminOccupantOption>>('admin/occupants/', { params: { page_size: 100 } })
    .then(r => r.data.results.map(o => ({ value: o.id, label: `${o.nom_complet} — ${o.logement_nom}${o.compartiment_nom ? ' / ' + o.compartiment_nom : ''}` })));

// ── Ressources CRUD génériques (consommées par AdminResourceTable) ──
export const listResource = <T>(endpoint: string, page = 1) =>
  axiosInstance.get<PaginatedResponse<T>>(`admin/${endpoint}/`, { params: { page } }).then(r => r.data);

export const createResource = <T>(endpoint: string, data: Record<string, unknown>) =>
  axiosInstance.post<T>(`admin/${endpoint}/`, data).then(r => r.data);

export const updateResource = <T>(endpoint: string, id: number, data: Record<string, unknown>) =>
  axiosInstance.put<T>(`admin/${endpoint}/${id}/`, data).then(r => r.data);

export const deleteResource = (endpoint: string, id: number) =>
  axiosInstance.delete(`admin/${endpoint}/${id}/`);
