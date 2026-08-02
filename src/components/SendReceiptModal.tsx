import React, { useState } from 'react';
import { IonModal } from '@ionic/react';
import { FiMessageCircle, FiMail, FiSmartphone, FiFileText } from 'react-icons/fi';
import axiosInstance from '../api/axiosConfig';
import { toWhatsAppNumber } from '../utils/whatsapp';
import '../assets/css/SendReceiptModal.css';

const MOIS = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

interface Paiement {
  id: number;
  montant_verse: string;
  date_debut_periode: string;
  date_fin_periode: string;
  recu_token: string;
}
interface OccupantContact {
  nom_complet: string;
  telephone: string;
  email?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  occupant: OccupantContact;
  paiement: Paiement;
}

const SendReceiptModal: React.FC<Props> = ({ isOpen, onClose, occupant, paiement }) => {
  const [showPdf, setShowPdf] = useState(false);
  const moisLabel = `${MOIS[new Date(paiement.date_debut_periode).getMonth() + 1]} ${new Date(paiement.date_debut_periode).getFullYear()}`;
  const montant = parseFloat(paiement.montant_verse).toLocaleString('fr-FR');
  // lienRecu pointe vers la page d'atterrissage HTML (aperçu Open Graph pour
  // WhatsApp/SMS) — jamais directement vers le PDF, sinon WhatsApp n'affiche
  // qu'un lien texte brut sans miniature dans la discussion.
  const lienRecu = `${axiosInstance.defaults.baseURL}paiements/${paiement.id}/recu/public/${paiement.recu_token}/`;
  const lienTelecharger = `${lienRecu}telecharger/`;

  const message = `Bonjour ${occupant.nom_complet}, voici votre reçu pour le loyer de ${moisLabel} d'un montant de ${montant} FCFA. Vous pouvez le consulter/télécharger ici : ${lienRecu}`;

  const sendWhatsApp = () => {
    const numero = toWhatsAppNumber(occupant.telephone);
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendSMS = () => {
    window.location.href = `sms:${occupant.telephone.replace(/\s/g, '')}?body=${encodeURIComponent(message)}`;
  };

  const sendEmail = () => {
    const subject = `Reçu de paiement — Loyer ${moisLabel}`;
    window.location.href = `mailto:${occupant.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      onWillPresent={() => (document.activeElement as HTMLElement)?.blur()}
    >
      <div className="send-modal">
        <div className="send-modal__head">
          <h2 className="send-modal__title">Envoyer le reçu</h2>
          <button className="pay-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="send-modal__receipt">
          <span className="send-modal__receipt-label">Reçu généré</span>
          <span className="send-modal__receipt-montant">{montant} FCFA</span>
          <span className="send-modal__receipt-periode">Loyer de {moisLabel}</span>
          <button className="send-modal__pdf-toggle" onClick={() => setShowPdf(s => !s)}>
            <FiFileText /> {showPdf ? 'Masquer l\'aperçu PDF' : 'Voir l\'aperçu du PDF'}
          </button>
          {showPdf && (
            <iframe src={lienTelecharger} className="send-modal__pdf-frame" title="Aperçu du reçu PDF" />
          )}
        </div>

        <div className="send-modal__contact">
          <div className="send-modal__contact-row">
            <span className="send-modal__contact-label">Locataire</span>
            <span className="send-modal__contact-val">{occupant.nom_complet}</span>
          </div>
          <div className="send-modal__contact-row">
            <span className="send-modal__contact-label">Téléphone</span>
            <span className="send-modal__contact-val">{occupant.telephone || '—'}</span>
          </div>
          <div className="send-modal__contact-row">
            <span className="send-modal__contact-label">Courriel</span>
            <span className="send-modal__contact-val">{occupant.email || '—'}</span>
          </div>
        </div>

        <p className="send-modal__preview">{message}</p>

        <div className="send-modal__actions">
          <button className="send-modal__btn send-modal__btn--whatsapp" onClick={sendWhatsApp} disabled={!occupant.telephone}>
            <FiMessageCircle /> WhatsApp
          </button>
          <button className="send-modal__btn send-modal__btn--sms" onClick={sendSMS} disabled={!occupant.telephone}>
            <FiSmartphone /> SMS
          </button>
          <button className="send-modal__btn send-modal__btn--email" onClick={sendEmail} disabled={!occupant.email}>
            <FiMail /> Courriel
          </button>
        </div>
        {!occupant.email && (
          <p className="send-modal__hint">Aucun courriel enregistré pour ce locataire — l'envoi par courriel est désactivé.</p>
        )}
      </div>
    </IonModal>
  );
};

export default SendReceiptModal;
