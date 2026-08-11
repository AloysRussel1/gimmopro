import axios from 'axios';

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
const looksLikeAbsoluteUrl = (v: unknown): v is string =>
  typeof v === 'string' && /^https?:\/\/\S+$/.test(v.trim());

const API_URL = looksLikeAbsoluteUrl(RAW_API_URL) ? RAW_API_URL.trim() : FALLBACK_API_URL;

if (!looksLikeAbsoluteUrl(RAW_API_URL)) {
  console.error(
    `VITE_API_URL est absent ou mal formé (valeur reçue : ${JSON.stringify(RAW_API_URL)}). ` +
    `Attendu une URL absolue, ex: https://mon-backend.up.railway.app/api/ — ` +
    `repli sur ${FALLBACK_API_URL}. Les appels API vont échouer tant que la variable ` +
    "n'est pas corrigée dans le dashboard Vercel/Railway (Settings → Environment Variables)."
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

// Le cookie JWT étant httpOnly, il est envoyé automatiquement par le
// navigateur sur chaque requête -- il n'y a donc plus rien à injecter côté
// JS. Seul le token CSRF (posé en cookie NON-httpOnly, exprès pour être lu
// ici) doit être répercuté en en-tête sur les méthodes qui modifient des
// données : sans ça, le backend rejette ces requêtes (voir
// CookieJWTAuthentication.enforce_csrf côté Django).
axiosInstance.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Refresh automatique si 401 -- le refresh token est lui aussi dans un
// cookie httpOnly, jamais manipulé en JS : l'appel n'a besoin d'aucun corps,
// juste withCredentials (déjà sur l'instance) pour que le cookie parte.
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
        await axios.post(`${API_URL}auth/refresh/`, null, { withCredentials: true });
        return axiosInstance(original);
      } catch {
        localStorage.removeItem('is_authenticated');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
