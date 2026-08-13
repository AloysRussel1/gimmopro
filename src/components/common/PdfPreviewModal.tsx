import React, { useEffect, useState } from 'react';
import { IonModal } from '@ionic/react';
import { getBlobUrl } from '../../utils/pdf';
import '../../assets/css/PdfPreviewModal.css';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // null -- le document n'est pas encore disponible (ex: caution non
  // renseignée) : affiche notReadyMessage au lieu de tenter un aperçu.
  fetchPath: string | null;
  downloadFilename: string;
  notReadyMessage?: string;
  // Seuls les documents pour lesquels un vrai envoi serveur existe (ex: reçu
  // de caution, avec pièce jointe réellement envoyée par email) passent
  // cette prop -- pas de bouton "Envoyer" trompeur pour les autres.
  onSendEmail?: () => Promise<{ message?: string; error?: string } | undefined>;
}

// Aperçu intégré (iframe, dans la page) plutôt qu'un nouvel onglet -- c'est
// ce qui permet d'accoler un bouton "Envoyer par e-mail" AU document lui-même
// (impossible avec window.open, qui ouvre le PDF dans le moteur de rendu
// natif du navigateur, hors de portée de React). Voir ÉTAPE 2 du menu
// locataire : l'envoi se fait maintenant depuis l'aperçu, plus depuis le
// menu principal.
const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen, onClose, title, fetchPath, downloadFilename, notReadyMessage, onSendEmail,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  useEffect(() => {
    if (!isOpen || !fetchPath) { setBlobUrl(null); return; }
    setLoading(true); setError(''); setSendResult('');
    getBlobUrl(fetchPath)
      .then(setBlobUrl)
      .catch(() => setError("Impossible de charger l'aperçu du document."))
      .finally(() => setLoading(false));
  }, [isOpen, fetchPath]);

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setSending(true); setSendResult('');
    try {
      const res = await onSendEmail();
      setSendResult(res?.message || 'Document envoyé par e-mail.');
    } catch (e: any) {
      setSendResult(e?.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <div className="pdf-preview-modal">
        <div className="pay-modal__head" style={{ marginBottom: '16px' }}>
          <h2 className="pay-modal__title">{title}</h2>
          <button className="pay-modal__close" onClick={onClose}>✕</button>
        </div>

        {!fetchPath ? (
          <p className="tf-error">⚠ {notReadyMessage || 'Document indisponible.'}</p>
        ) : loading ? (
          <p className="pdf-preview-modal__hint">Chargement de l'aperçu…</p>
        ) : error ? (
          <p className="tf-error">⚠ {error}</p>
        ) : blobUrl ? (
          <iframe src={blobUrl} className="pdf-preview-modal__frame" title={title} />
        ) : null}

        {blobUrl && (
          <div className="pdf-preview-modal__actions">
            <a className="g-btn g-btn--outline" href={blobUrl} download={downloadFilename}>
              ⬇️ Télécharger
            </a>
            {onSendEmail && (
              <button className="g-btn g-btn--primary" onClick={handleSendEmail} disabled={sending}>
                {sending ? '⏳ Envoi…' : '✉️ Envoyer par e-mail'}
              </button>
            )}
          </div>
        )}
        {sendResult && <p className="pdf-preview-modal__hint">{sendResult}</p>}
      </div>
    </IonModal>
  );
};

export default PdfPreviewModal;
