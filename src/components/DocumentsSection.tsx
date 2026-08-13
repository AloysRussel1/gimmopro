import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { previewPdf } from '../utils/pdf';
import '../assets/css/DocumentsSection.css';

interface DocumentItem {
  id: number;
  type_document: string;
  type_document_display: string;
  nom_fichier: string;
  taille_octets: number;
  date_televersement: string;
  occupant: number | null;
  logement: number | null;
}

interface Props {
  occupantId?: number;
  logementId?: number;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'CNI_PASSEPORT',     label: 'CNI / Passeport' },
  { value: 'CONTRAT_SIGNE',     label: 'Contrat signé' },
  { value: 'FACTURE_TRAVAUX',   label: 'Facture travaux' },
  { value: 'QUITTANCE_EXTERNE', label: 'Quittance externe' },
  { value: 'AUTRE',             label: 'Autre' },
];

const TYPE_ICON: Record<string, string> = {
  CNI_PASSEPORT: '🪪', CONTRAT_SIGNE: '📄', FACTURE_TRAVAUX: '🧾',
  QUITTANCE_EXTERNE: '🧾', AUTRE: '📎',
};

const MAX_SIZE     = 5 * 1024 * 1024;
const ACCEPTED_EXT = ['pdf', 'png', 'jpg', 'jpeg'];

function formatSize(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

const DocumentsSection: React.FC<Props> = ({ occupantId, logementId }) => {
  const [documents,    setDocuments]    = useState<DocumentItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState('');
  const [typeDocument, setTypeDocument] = useState('AUTRE');
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const query = occupantId ? `occupant_id=${occupantId}` : logementId ? `logement_id=${logementId}` : '';

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    axiosInstance.get(`documents/?${query}`)
      .then(r => setDocuments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupantId, logementId]);

  const uploadFile = async (file: File) => {
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_EXT.includes(ext)) { setError('Format non autorisé — PDF, PNG ou JPEG uniquement.'); return; }
    if (file.size > MAX_SIZE)        { setError('Le fichier dépasse la taille maximale autorisée (5 Mo).'); return; }

    const formData = new FormData();
    if (occupantId) formData.append('occupant', String(occupantId));
    if (logementId) formData.append('logement', String(logementId));
    formData.append('type_document', typeDocument);
    formData.append('fichier', file);

    setUploading(true);
    try {
      // Content-Type volontairement mis à `undefined` : le navigateur doit
      // générer lui-même le boundary multipart, sinon Django ne peut pas
      // parser le corps de la requête (contrairement au header JSON par
      // défaut d'axiosInstance, qui casserait silencieusement l'upload ici).
      const res = await axiosInstance.post('documents/', formData, {
        headers: { 'Content-Type': undefined },
      });
      setDocuments(prev => [res.data, ...prev]);
    } catch (e: any) {
      const data = e?.response?.data;
      setError(data?.fichier?.[0] || data?.non_field_errors?.[0] || "Erreur lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleView = (doc: DocumentItem) => {
    previewPdf(`documents/${doc.id}/fichier/`).catch(console.error);
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Supprimer "${doc.nom_fichier}" ?`)) return;
    await axiosInstance.delete(`documents/${doc.id}/`);
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
  };

  return (
    <div className="docs-section">
      <select
        className="g-input docs-section__type-select"
        value={typeDocument}
        onChange={e => setTypeDocument(e.target.value)}
      >
        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <div
        className={`docs-dropzone ${dragOver ? 'docs-dropzone--active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: 'none' }} onChange={handleFileInput}
        />
        {uploading ? (
          <p>⏳ Envoi en cours…</p>
        ) : (
          <>
            <div className="docs-dropzone__icon">📤</div>
            <p className="docs-dropzone__text">Glissez un fichier ici ou cliquez pour choisir</p>
            <p className="docs-dropzone__hint">PDF, PNG ou JPEG — 5 Mo max</p>
          </>
        )}
      </div>

      {error && <p className="tf-error">⚠ {error}</p>}

      {loading ? (
        <div className="g-loading"><div className="g-spinner" /></div>
      ) : documents.length === 0 ? (
        <div className="g-empty">
          <div className="g-empty__icon">📁</div>
          <p className="g-empty__text">Aucun document pour l'instant</p>
        </div>
      ) : (
        <div className="docs-list">
          {documents.map(doc => (
            <div key={doc.id} className="docs-card">
              <div className="docs-card__icon">{TYPE_ICON[doc.type_document] || '📎'}</div>
              <div className="docs-card__info">
                <p className="docs-card__nom">{doc.nom_fichier}</p>
                <p className="docs-card__meta">
                  {doc.type_document_display} · {formatSize(doc.taille_octets)} · {new Date(doc.date_televersement).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="docs-card__actions">
                <button className="docs-card__btn" onClick={() => handleView(doc)} title="Visualiser">👁️</button>
                <button className="docs-card__btn docs-card__btn--danger" onClick={() => handleDelete(doc)} title="Supprimer">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;
