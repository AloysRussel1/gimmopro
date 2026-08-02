import axios from 'axios';

// Une seule source de vérité pour l'URL de l'API, injectée au build par Vite.
// En local : GIMMOPRO/gimmopro/.env.local avec VITE_API_URL=http://127.0.0.1:8000/api/
// En prod  : variable d'environnement VITE_API_URL configurée sur Railway/Vercel.
// Le fallback ci-dessous évite un écran blanc si la variable est absente
// (ex: preview build local sans .env) — un `console.error` signale quand même
// qu'on est retombé dessus, pour ne pas masquer un vrai oubli de config.
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
});

// Injecte le token JWT automatiquement
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token automatique si 401
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        // On utilise `axios` brut (pas axiosInstance) pour éviter de rentrer
        // dans les intercepteurs, mais avec la MÊME base URL que le reste de l'app.
        const res = await axios.post(`${API_URL}auth/refresh/`, { refresh });
        localStorage.setItem('access_token', res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return axiosInstance(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;