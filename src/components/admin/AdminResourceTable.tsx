import React, { useEffect, useState } from 'react';
import { IonModal } from '@ionic/react';
import {
  listResource, createResource, updateResource, deleteResource,
  listAllLogementsForPicker, listCompartimentsForLogement,
  AdminLogementOption, AdminCompartimentOption,
} from '../../api/admin';
import './AdminResourceTable.css';

// Table CRUD générique pilotée par config — une seule implémentation pour
// les 5 ressources admin (Logements/Occupants/Dépenses/États des lieux en
// CRUD complet, Paiements en Create+List+Delete). Aucune logique métier
// GimmoPro dans ce fichier : tout ce qui est spécifique à une ressource
// (colonnes, champs de formulaire, libellés) est injecté par l'appelant —
// c'est ce qui rend ce composant réemployable dans un autre projet.

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'compartiment-picker';
  required?: boolean;
  options?: { value: string | number; label: string }[];
  optionsLoader?: () => Promise<{ value: string | number; label: string }[]>; // pour un 'select' dont les options dépendent d'un appel réseau (ex: liste des utilisateurs)
  step?: string; // ex: "0.01" pour un champ number décimal
}

interface Props<T extends { id: number }> {
  endpoint: string;
  title: string;
  columns: ColumnConfig<T>[];
  formFields: FieldConfig[];
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  emptyIcon?: string;
  emptyText?: string;
}

function AdminResourceTable<T extends { id: number }>({
  endpoint, title, columns, formFields,
  allowCreate = true, allowEdit = true, allowDelete = true,
  emptyIcon = '📄', emptyText = 'Aucun élément.',
}: Props<T>) {
  const [rows, setRows]       = useState<T[]>([]);
  const [count, setCount]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData]   = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);

  // Options du sélecteur en cascade (champ type 'compartiment-picker')
  const [logementOptions, setLogementOptions]         = useState<AdminLogementOption[]>([]);
  const [compartimentOptions, setCompartimentOptions] = useState<AdminCompartimentOption[]>([]);
  const [pickerLogementId, setPickerLogementId]       = useState<number | ''>('');

  // Options chargées dynamiquement pour les champs 'select' avec optionsLoader
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { value: string | number; label: string }[]>>({});

  const hasPicker = formFields.some(f => f.type === 'compartiment-picker');
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const load = () => {
    setLoading(true);
    listResource<T>(endpoint, page)
      .then(res => { setRows(res.results); setCount(res.count); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [endpoint, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasPicker || !showForm) return;
    listAllLogementsForPicker().then(setLogementOptions).catch(console.error);
  }, [hasPicker, showForm]);

  useEffect(() => {
    if (!showForm) return;
    formFields.filter(f => f.optionsLoader).forEach(f => {
      f.optionsLoader!().then(opts => setDynamicOptions(prev => ({ ...prev, [f.name]: opts }))).catch(console.error);
    });
  }, [showForm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pickerLogementId) { setCompartimentOptions([]); return; }
    listCompartimentsForLogement(Number(pickerLogementId)).then(setCompartimentOptions).catch(console.error);
  }, [pickerLogementId]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({});
    setFormErrors({});
    setPickerLogementId('');
    setCompartimentOptions([]);
    setShowForm(true);
  };

  const openEdit = (row: T) => {
    setEditingId(row.id);
    setFormData({ ...row });
    setFormErrors({});
    // Pré-remplit le sélecteur en cascade : sans ça, éditer un Occupant
    // existant afficherait "— Choisir un logement —" alors qu'un compartiment
    // est déjà assigné, et la liste des compartiments resterait vide tant
    // qu'on n'aurait pas re-sélectionné le logement à la main.
    if (hasPicker && (row as any).logement) {
      setPickerLogementId((row as any).logement as number);
    } else {
      setPickerLogementId('');
      setCompartimentOptions([]);
    }
    setShowForm(true);
  };

  const handleDelete = async (row: T) => {
    if (!window.confirm('Supprimer définitivement cet élément ?')) return;
    try {
      await deleteResource(endpoint, row.id);
      load();
    } catch (e) {
      console.error(e);
      window.alert("Échec de la suppression.");
    }
  };

  const handleSave = async () => {
    setSaving(true); setFormErrors({});
    try {
      if (editingId) {
        await updateResource(endpoint, editingId, formData);
      } else {
        await createResource(endpoint, formData);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      const data = e?.response?.data;
      if (data && typeof data === 'object') {
        const errs: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => { errs[k] = Array.isArray(v) ? v.join(' ') : String(v); });
        setFormErrors(errs);
      } else {
        setFormErrors({ non_field_errors: "Erreur lors de l'enregistrement." });
      }
    } finally {
      setSaving(false);
    }
  };

  const setField = (name: string, value: unknown) => setFormData(f => ({ ...f, [name]: value }));

  return (
    <div className="admin-resource">
      <div className="admin-resource__head">
        <p className="admin-resource__title">{title} <span className="admin-resource__count">({count})</span></p>
        {allowCreate && (
          <button className="g-btn g-btn--primary admin-resource__add" onClick={openCreate}>+ Nouveau</button>
        )}
      </div>

      {loading ? (
        <div className="g-loading"><div className="g-spinner" /></div>
      ) : rows.length === 0 ? (
        <div className="g-empty">
          <div className="g-empty__icon">{emptyIcon}</div>
          <p className="g-empty__text">{emptyText}</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {columns.map(c => <th key={c.key}>{c.label}</th>)}
                  {(allowEdit || allowDelete) && <th className="admin-table__actions-col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    {columns.map(c => (
                      <td key={c.key}>{c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}</td>
                    ))}
                    {(allowEdit || allowDelete) && (
                      <td className="admin-table__actions">
                        {allowEdit && <button className="admin-table__btn" onClick={() => openEdit(row)}>✏️</button>}
                        {allowDelete && <button className="admin-table__btn admin-table__btn--danger" onClick={() => handleDelete(row)}>🗑️</button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button className="g-btn g-btn--outline admin-pagination__btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <span className="admin-pagination__label">Page {page} / {totalPages}</span>
              <button className="g-btn g-btn--outline admin-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          )}
        </>
      )}

      <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
        <div className="admin-form-modal">
          <div className="pay-modal__head" style={{ marginBottom: '20px' }}>
            <h2 className="pay-modal__title">{editingId ? 'Modifier' : 'Nouveau'} — {title}</h2>
            <button className="pay-modal__close" onClick={() => setShowForm(false)}>✕</button>
          </div>

          {formErrors.non_field_errors && <p className="tf-error">⚠ {formErrors.non_field_errors}</p>}

          {formFields.map(field => {
            if (field.type === 'compartiment-picker') {
              return (
                <React.Fragment key={field.name}>
                  <div className="g-input-group">
                    <label className="g-label">Logement</label>
                    <select
                      className="g-input"
                      value={pickerLogementId}
                      onChange={e => { setPickerLogementId(e.target.value ? Number(e.target.value) : ''); setField('compartiment', undefined); }}
                    >
                      <option value="">— Choisir un logement —</option>
                      {logementOptions.map(l => (
                        <option key={l.id} value={l.id}>{l.nom} ({l.proprietaire_email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="g-input-group">
                    <label className="g-label">{field.label}{field.required && ' *'}</label>
                    <select
                      className="g-input"
                      value={(formData.compartiment as number) ?? ''}
                      onChange={e => setField('compartiment', e.target.value ? Number(e.target.value) : undefined)}
                      disabled={!pickerLogementId}
                    >
                      <option value="">— Choisir un compartiment —</option>
                      {compartimentOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.nom} ({c.type} — {c.statut})</option>
                      ))}
                    </select>
                    {formErrors.compartiment && <p className="tf-error">⚠ {formErrors.compartiment}</p>}
                  </div>
                </React.Fragment>
              );
            }

            const value = (formData[field.name] as string | number | undefined) ?? '';
            return (
              <div className="g-input-group" key={field.name}>
                <label className="g-label">{field.label}{field.required && ' *'}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="g-input admin-form-modal__textarea"
                    value={value as string}
                    onChange={e => setField(field.name, e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select className="g-input" value={value} onChange={e => setField(field.name, e.target.value)}>
                    <option value="">—</option>
                    {(field.optionsLoader ? dynamicOptions[field.name] : field.options)?.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="g-input"
                    type={field.type}
                    step={field.step}
                    value={value}
                    onChange={e => setField(field.name, e.target.value)}
                  />
                )}
                {formErrors[field.name] && <p className="tf-error">⚠ {formErrors[field.name]}</p>}
              </div>
            );
          })}

          <button className="g-btn g-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : '✓ Enregistrer'}
          </button>
        </div>
      </IonModal>
    </div>
  );
}

export default AdminResourceTable;
