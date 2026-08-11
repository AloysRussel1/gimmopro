// Stockage du filet de secours Safari/ITP -- séparé de auth.ts et
// axiosConfig.ts (qui ont chacun besoin de ces fonctions) pour éviter un
// import circulaire entre les deux. Voir le commentaire détaillé en tête de
// auth.ts pour le contexte complet : le cookie httpOnly reste le mécanisme
// principal, ceci n'est utilisé qu'en secours quand il ne suit pas.
const REFRESH_FALLBACK_KEY = 'gimmopro_refresh_fallback';
let inMemoryAccessToken: string | null = null;

export const getAccessToken = (): string | null => inMemoryAccessToken;

export const getRefreshFallback = (): string | null => sessionStorage.getItem(REFRESH_FALLBACK_KEY);

export const setTokens = (access?: string, refresh?: string): void => {
  if (access) inMemoryAccessToken = access;
  if (refresh) sessionStorage.setItem(REFRESH_FALLBACK_KEY, refresh);
};

export const clearTokens = (): void => {
  inMemoryAccessToken = null;
  sessionStorage.removeItem(REFRESH_FALLBACK_KEY);
};
