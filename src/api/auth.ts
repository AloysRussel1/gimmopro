import axiosInstance from './axiosConfig';
import { getRefreshFallback, clearTokens } from './tokenStore';

export { getAccessToken, setTokens, getRefreshFallback } from './tokenStore';

// 'is_authenticated' n'est PAS un identifiant -- juste un indice d'affichage
// synchrone pour le routing (PrivateRoute, Navbar...), qui ont besoin d'une
// réponse immédiate sans attendre un aller-retour réseau. Le voler ne donne
// aucun accès : la vraie frontière de sécurité reste imposée côté serveur
// (cookie httpOnly ou, en secours, l'access token qui n'est de toute façon
// jamais lisible que par ce même onglet -- voir tokenStore.ts).
const FLAG = 'is_authenticated';

export const markAuthenticated = (): void => localStorage.setItem(FLAG, '1');
export const isAuthenticated = (): boolean => localStorage.getItem(FLAG) === '1';

export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post('auth/logout/', { refresh: getRefreshFallback() });
  } catch {
    // Silently ignore — on déconnecte quand même
  } finally {
    clearTokens();
    localStorage.removeItem(FLAG);
    window.location.href = '/login';
  }
};
