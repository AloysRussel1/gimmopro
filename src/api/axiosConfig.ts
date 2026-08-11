import axios from 'axios';
import { getAccessToken, getRefreshFallback, setTokens, clearTokens } from './tokenStore';

// Une seule source de vérité pour l'URL de l'API, injectée au build par Vite.
// En local : GIMMOPRO/gimmopro/.env.local avec VITE_API_URL=http://127.0.0.1:8000/api/
// En prod  : variable d'environnement VITE_API_URL configurée sur Railway/Vercel.
// Le fallback ci-dessous évite un écran blanc si la variable est absente
// (ex: preview build local sans .env) — un `console.error` signale quand même
// qu'on est retombé dessus, pour ne pas masquer un vrai oubli de config.
// "127.0.0.1", pas "localhost" : voir la note dans .env.local (cookies SameSite).
const FALLBACK_API_URL = 'http://127.0.0.1:8000/api/';
const RAW_API_URL = import.meta.env.VITE_API_URL;

// On valide la FORME de la variable, pas juste sa présence : un copier-coller
// malheureux du genre "VITE_API_URL = https://..." (la ligne entière du .env,
// au lieu de juste la valeur) passerait un simple `if (!VITE_API_URL)` sans
// broncher, puis serait traité comme une URL RELATIVE par le navigateur — les
// requêtes partiraient silencieusement vers l'origine du frontend au lieu du
// backend (404/405 très confus à déboguer). On préfère planter fort ici.
// Une URL RELATIVE de la forme "/api/" est en revanche volontairement
// acceptée (pas juste http(s)://...) : c'est la valeur attendue en
// production depuis la mise en place du proxy Vercel (vercel.json) qui fait
// passer /api/* par le même domaine que le frontend -- nécessaire pour que
// les cookies d'auth restent "first-party" aux yeux de Safari/ITP, qui
// bloque les cookies cross-site même avec SameSite=None; Secure=True. Un
// seul slash de tête (pas "//", qui serait une URL protocol-relative vers
// un hôte arbitraire) pour éviter d'accepter autre chose qu'un chemin local.
const looksLikeValidApiUrl = (v: unknown): v is string =>
  typeof v === 'string' && (/^https?:\/\/\S+$/.test(v.trim()) || /^\/(?!\/)\S*$/.test(v.trim()));

const API_URL = looksLikeValidApiUrl(RAW_API_URL) ? RAW_API_URL.trim() : FALLBACK_API_URL;

if (!looksLikeValidApiUrl(RAW_API_URL)) {
  console.error(
    `VITE_API_URL est absent ou mal formé (valeur reçue : ${JSON.stringify(RAW_API_URL)}). ` +
    `Attendu une URL absolue (ex: https://mon-backend.up.railway.app/api/) ou un chemin relatif ` +
    `de la forme "/api/" — repli sur ${FALLBACK_API_URL}. Les appels API vont échouer tant que la ` +
    "variable n'est pas corrigée dans le dashboard Vercel/Railway (Settings → Environment Variables)."
  );
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Le JWT vit désormais dans un cookie httpOnly posé par le backend (revue
  // de sécurité -- avant, il était en localStorage, lisible par n'importe
  // quel script en cas de XSS). withCredentials fait envoyer/recevoir ces
  // cookies malgré le fait que frontend (Vercel) et backend (Railway) soient
  // deux domaines différents -- sans ça, le navigateur ignore silencieusement
  // tout Set-Cookie cross-site.
  withCredentials: true,
});

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

// Le cookie JWT httpOnly reste le mécanisme principal, envoyé automatiquement
// par le navigateur -- rien à faire côté JS pour lui. Deux ajouts en secours :
// - le token CSRF (cookie NON-httpOnly, exprès pour être lu ici) répercuté en
//   en-tête sur les méthodes qui modifient des données, sans quoi le backend
//   rejette ces requêtes (voir CookieJWTAuthentication.enforce_csrf) ;
// - l'access token EN MÉMOIRE (tokenStore.ts), envoyé en header Authorization
//   quand on en a un -- c'est ce qui permet à Safari/ITP de continuer à
//   fonctionner malgré le blocage du cookie cross-site : le backend accepte
//   header OU cookie (header prioritaire), donc envoyer les deux ne coûte
//   rien sur les navigateurs où le cookie marche déjà.
axiosInstance.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) config.headers['X-CSRFToken'] = csrfToken;
  }
  const accessToken = getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Refresh automatique si 401. Le cookie httpOnly suit la requête tout seul
// sur les navigateurs qui l'acceptent ; le refresh conservé en sessionStorage
// (tokenStore.ts) est envoyé dans le corps en secours pour Safari/ITP, qui
// bloque le cookie cross-site même bien configuré (SameSite=None; Secure=True).
// Le backend accepte l'un ou l'autre (voir CookieTokenRefreshView).
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Log systématique AVANT tout autre traitement (refresh token, etc.) —
    // sans ça, une erreur réseau/CORS/500 pouvait finir absorbée par un
    // catch générique plus haut dans un composant sans jamais apparaître
    // dans la console, ce qui rendait le diagnostic quasi impossible depuis
    // le navigateur seul.
    console.error("Détail de l'erreur API :", error.response?.data || error.message);

    const original = error.config;
    // Un 401 sur la connexion elle-même veut juste dire "mauvais identifiants"
    // — ce n'est PAS un token expiré à rafraîchir. Sans cette exclusion, un
    // login raté déclenchait une tentative de refresh (qui échoue aussi,
    // puisqu'on n'a pas encore de session), qui elle-même faisait un
    // window.location.href = '/login' -> rechargement complet de la page,
    // qui efface la console ET empêche le vrai message d'erreur de s'afficher.
    const isAuthEndpoint = typeof original?.url === 'string' &&
      (original.url.includes('auth/login') || original.url.includes('auth/refresh'));

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${API_URL}auth/refresh/`,
          { refresh: getRefreshFallback() },
          { withCredentials: true },
        );
        setTokens(res.data?.access, res.data?.refresh);
        return axiosInstance(original);
      } catch {
        clearTokens();
        localStorage.removeItem('is_authenticated');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
