import axiosInstance from '../api/axiosConfig';

/** Récupère un PDF protégé par JWT en blob -- un simple window.open(url) ou
 * <a href> ne fonctionnerait pas : la requête de la nouvelle page/du
 * téléchargement n'inclurait pas l'en-tête Authorization. */
async function fetchPdfBlob(path: string): Promise<Blob> {
  const token = localStorage.getItem('access_token');
  const url = `${axiosInstance.defaults.baseURL}${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Échec du chargement du PDF (${res.status})`);
  return res.blob();
}

/** Ouvre le PDF dans un nouvel onglet (aperçu, sans forcer le téléchargement).
 * L'URL blob créée n'est jamais révoquée explicitement : elle reste valide
 * tant que l'onglet ouvert en a besoin, et le navigateur la libère à sa
 * fermeture. */
export async function previewPdf(path: string): Promise<void> {
  const blob = await fetchPdfBlob(path);
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/** Télécharge directement le PDF sous le nom de fichier donné. */
export async function downloadPdf(path: string, filename: string): Promise<void> {
  const blob = await fetchPdfBlob(path);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
