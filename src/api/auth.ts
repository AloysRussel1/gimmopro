import axiosInstance from './axiosConfig';

// Le vrai JWT vit dans un cookie httpOnly (invisible au JS) depuis la revue
// de sécurité -- 'is_authenticated' n'est PAS un identifiant, juste un
// indice d'affichage synchrone pour le routing (PrivateRoute, Navbar...),
// qui ont besoin d'une réponse immédiate sans attendre un aller-retour
// réseau. Le voler ne donne aucun accès : la vraie frontière de sécurité
// reste imposée côté serveur par le cookie httpOnly sur chaque requête.
const FLAG = 'is_authenticated';

export const markAuthenticated = (): void => localStorage.setItem(FLAG, '1');
export const isAuthenticated = (): boolean => localStorage.getItem(FLAG) === '1';

export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post('auth/logout/');
  } catch {
    // Silently ignore — on déconnecte quand même
  } finally {
    localStorage.removeItem(FLAG);
    window.location.href = '/login';
  }
};
