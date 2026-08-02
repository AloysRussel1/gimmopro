import axios from 'axios';

// Une seule source de vérité pour l'URL de l'API, injectée au build par Vite.
// En local : GIMMOPRO/gimmopro/.env.local avec VITE_API_URL=http://127.0.0.1:8000/api/
// En prod  : variable d'environnement VITE_API_URL configurée sur Railway/Vercel.
// Le fallback ci-dessous évite un écran blanc si la variable est absente
// (ex: preview build local sans .env) — un `console.warn` signale quand même
// qu'on est retombé dessus, pour ne pas masquer un vrai oubli de config.
const FALLBACK_API_URL = 'http://127.0.0.1:8000/api/';
const API_URL = import.meta.env.VITE_API_URL || FALLBACK_API_URL;

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    `VITE_API_URL n'est pas défini — utilisation du fallback local ${FALLBACK_API_URL}. ` +
    "Définis-le dans .env.local (dev) ou dans les variables d'environnement Railway/Vercel (prod)."
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