import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import DocumentsSection from './DocumentsSection';
import PdfPreviewModal from './common/PdfPreviewModal';
import SendReceiptModal from './SendReceiptModal';
import '../assets/css/OccupantDocumentsHub.css';

export interface OccupantDocumentsRef {
  id: number; nom_complet: string; telephone: string; email: string;
  caution_versee: string; date_versement_caution: string | null;
}

interface PaiementResume {
  id: number; montant_verse: string; nombre_mois: number;
  date_paiement: string; date_debut_periode: string; date_fin_periode: string;
  statut: string; recu_token: string;
}

interface Props {
  occupant: OccupantDocumentsRef;
}

// Contenu du hub "Documents & Reçus" (contrat, caution, reçus de loyer,
// pièces jointes) -- factorisé pour être utilisé à la fois depuis le menu
// locataire (TenantManagement) et depuis l'historique des anciens occupants
// d'un logement (LogementDetails, ÉTAPE 3) : un locataire parti garde un
// accès identique à ses documents, rien n'est masqué au départ.
const OccupantDocumentsHub: React.FC<Props> = ({ occupant }) => {
  const [loyerPaiements, setLoyerPaiements] = useState<PaiementResume[]>([]);
  const [loyerLoading,   setLoyerLoading]   = useState(true);
  const [contratPreviewOpen, setContratPreviewOpen] = useState(false);
  const [cautionPreviewOpen, setCautionPreviewOpen] = useState(false);
  const [loyerSendTarget, setLoyerSendTarget] = useState<PaiementResume | null>(null);

  useEffect(() => {
    setLoyerLoading(true);
    axiosInstance.get(`paiements/?occupant_id=${occupant.id}`)
      .then(r => setLoyerPaiements(r.data))
      .catch(console.error)
      .finally(() => setLoyerLoading(false));
  }, [occupant.id]);

  const cautionPrete = parseFloat(occupant.caution_versee) > 0 && !!occupant.date_versement_caution;

  return (
    <>
      <div className="docs-hub-section">
        <p className="docs-hub-section__title">📄 Contrat de bail</p>
        <button className="g-btn g-btn--outline" onClick={() => setContratPreviewOpen(true)}>
          👁 Aperçu
        </button>
      </div>

      <div className="docs-hub-section">
        <p className="docs-hub-section__title">🔐 Reçu de caution</p>
        {!cautionPrete && (
          <p className="pdf-preview-modal__hint">
            Montant ou date de versement de la caution non renseignés.
          </p>
        )}
        <button className="g-btn g-btn--outline" onClick={() => setCautionPreviewOpen(true)} disabled={!cautionPrete}>
          👁 Aperçu
        </button>
      </div>

      <div className="docs-hub-section">
        <p className="docs-hub-section__title">🧾 Reçus de loyer</p>
        {loyerLoading ? (
          <p className="pdf-preview-modal__hint">Chargement…</p>
        ) : loyerPaiements.length === 0 ? (
          <p className="pdf-preview-modal__hint">Aucun paiement enregistré.</p>
        ) : (
          <div className="docs-hub-list">
            {loyerPaiements.map(p => (
              <button key={p.id} className="docs-hub-list__item" onClick={() => setLoyerSendTarget(p)}>
                <span>{new Date(p.date_debut_periode).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                <span>{parseFloat(p.montant_verse).toLocaleString('fr-FR')} FCFA</span>
                <span className={`g-badge ${p.statut === 'Payé' ? 'g-badge--green' : p.statut === 'Partiel' ? 'g-badge--gold' : 'g-badge--red'}`}>
                  {p.statut}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="g-divider" />

      <div className="docs-hub-section">
        <p className="docs-hub-section__title">📎 Pièces jointes</p>
        <DocumentsSection occupantId={occupant.id} />
      </div>

      <PdfPreviewModal
        isOpen={contratPreviewOpen}
        onClose={() => setContratPreviewOpen(false)}
        title="Contrat de bail"
        fetchPath={`occupants/${occupant.id}/contrat/`}
        downloadFilename={`contrat_${occupant.id}.pdf`}
      />
      <PdfPreviewModal
        isOpen={cautionPreviewOpen}
        onClose={() => setCautionPreviewOpen(false)}
        title="Reçu de caution"
        fetchPath={cautionPrete ? `occupants/${occupant.id}/caution/recu/` : null}
        downloadFilename={`recu_caution_${occupant.id}.pdf`}
        notReadyMessage="Renseignez d'abord le montant et la date de versement de la caution."
        onSendEmail={async () => {
          const res = await axiosInstance.post(`occupants/${occupant.id}/caution/envoyer/`);
          return res.data;
        }}
      />
      {loyerSendTarget && (
        <SendReceiptModal
          isOpen={!!loyerSendTarget}
          onClose={() => setLoyerSendTarget(null)}
          occupant={occupant}
          paiement={loyerSendTarget}
        />
      )}
    </>
  );
};

export default OccupantDocumentsHub;
