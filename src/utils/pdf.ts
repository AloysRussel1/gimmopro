import axiosInstance from '../api/axiosConfig';
import { getAccessToken } from '../api/tokenStore';

/** Récupère un fichier protégé par JWT en blob -- un simple window.open(url)
 * ou <a href> ne fonctionnerait pas : la requête de la nouvelle page/du
 * téléchargement n'enverrait pas le cookie d'auth cross-site sans
 * `credentials: 'include'` (équivalent fetch de axios `withCredentials`).
 * Ce fetch brut ne passe PAS par l'intercepteur axios (voir axiosConfig.ts)
 * -- il faut donc y répéter manuellement l'ajout du header Authorization en
 * secours (Safari/ITP bloque le cookie cross-site même bien configuré) :
 * sans ça, tout téléchargement/aperçu échoue en 401 dès que le cookie ne
 * suit pas, alors que les autres appels API (via axiosInstance) continuent
 * de fonctionner normalement grâce au fallback Bearer. */
async function fetchAuthBlob(path: string): Promise<Blob> {
  const url = `${axiosInstance.defaults.baseURL}${path}`;
  const accessToken = getAccessToken();
  const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await fetch(url, { credentials: 'include', headers });
  if (!res.ok) throw new Error(`Échec du chargement du fichier (${res.status})`);
  return res.blob();
}

/** Ouvre le PDF dans un nouvel onglet (aperçu, sans forcer le téléchargement).
 * L'URL blob créée n'est jamais révoquée explicitement : elle reste valide
 * tant que l'onglet ouvert en a besoin, et le navigateur la libère à sa
 * fermeture. */
export async function previewPdf(path: string): Promise<void> {
  const blobUrl = await getBlobUrl(path);
  window.open(blobUrl, '_blank');
}

/** Récupère un fichier protégé et renvoie une URL blob:// utilisable dans un
 * <iframe src=...> pour un aperçu intégré à la page (plutôt que dans un
 * nouvel onglet -- voir PdfPreviewModal.tsx) -- même fetch authentifié que
 * previewPdf/downloadFile, juste sans l'action window.open/téléchargement. */
export async function getBlobUrl(path: string): Promise<string> {
  const blob = await fetchAuthBlob(path);
  return URL.createObjectURL(blob);
}

/** Télécharge directement le PDF sous le nom de fichier donné. */
export async function downloadPdf(path: string, filename: string): Promise<void> {
  return downloadFile(path, filename);
}

/** Télécharge n'importe quel fichier protégé par JWT (PDF, XLSX, CSV...)
 * sous le nom donné. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const blob = await fetchAuthBlob(path);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
