import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminResourceTable, { ColumnConfig, FieldConfig } from '../../components/admin/AdminResourceTable';
import { ADMIN_TABS } from './adminNav';
import { listAllUsersAsOptions, listAllOccupantsAsOptions, listAllLogementsForPicker } from '../../api/admin';

const listAllLogementsAsOptions = () =>
  listAllLogementsForPicker().then(logs => logs.map(l => ({ value: l.id, label: `${l.nom} (${l.proprietaire_email})` })));

interface LogementRow {
  id: number; nom: string; localisation: string; description: string;
  proprietaire: number; proprietaire_email: string;
  nb_compartiments: number; nb_occupes: number; nb_libres: number;
}
interface OccupantRow {
  id: number; nom_complet: string; email: string; telephone: string; cni: string;
  numero_contrat: string; date_debut_contrat: string; date_fin_contrat: string | null;
  loyer: string; caution_versee: string; date_prochain_paiement: string; statut: string;
  compartiment: number | null; compartiment_nom: string;
  logement: number | null; logement_nom: string;
}
interface PaiementRow {
  id: number; occupant: number; occupant_nom: string; montant_verse: string;
  nombre_mois: number; mode_paiement: string; date_paiement: string;
  date_debut_periode: string; date_fin_periode: string; statut: string; note: string;
}
interface DepenseRow {
  id: number; logement: number; logement_nom: string; libelle: string;
  montant: string; date: string; categorie: string; note: string;
}
interface EtatDesLieuxRow {
  id: number; occupant: number; occupant_nom: string;
  logement: number | null; logement_nom: string; compartiment: number | null; compartiment_nom: string;
  type: string; type_display: string; date_realisation: string; etat_general: string;
  cles_remises: number; observations: string;
}

const MODE_PAIEMENT_OPTIONS = [
  { value: 'ESPECES', label: 'Espèces' }, { value: 'OM', label: 'Orange Money' },
  { value: 'MOMO', label: 'MTN MoMo' }, { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'CHEQUE', label: 'Chèque' },
];
const CATEGORIE_OPTIONS = [
  { value: 'REPARATION', label: 'Réparations' }, { value: 'ELECTRICITE', label: 'Électricité' },
  { value: 'EAU', label: 'Eau' }, { value: 'TAXE', label: 'Taxe' },
  { value: 'ENTRETIEN', label: 'Entretien' }, { value: 'AUTRE', label: 'Autre' },
];
const TYPE_EDL_OPTIONS = [{ value: 'ENTREE', label: 'Entrée' }, { value: 'SORTIE', label: 'Sortie' }];
const ETAT_OPTIONS = [{ value: 'BON', label: 'Bon' }, { value: 'MOYEN', label: 'Moyen' }, { value: 'MAUVAIS', label: 'Mauvais' }];

type ResourceKey = 'logements' | 'occupants' | 'paiements' | 'depenses' | 'etat-des-lieux';
const SUB_TABS: { key: ResourceKey; label: string }[] = [
  { key: 'logements',      label: 'Logements' },
  { key: 'occupants',      label: 'Occupants' },
  { key: 'paiements',      label: 'Paiements' },
  { key: 'depenses',       label: 'Dépenses' },
  { key: 'etat-des-lieux', label: 'États des lieux' },
];

const AdminData: React.FC = () => {
  const [active, setActive] = useState<ResourceKey>('logements');

  return (
    <AdminLayout title="Administration" tabs={ADMIN_TABS}>
      <div className="admin-tabs" style={{ margin: '-20px -16px 20px', padding: '0 16px 0' }}>
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            className={`admin-tab ${active === t.key ? 'admin-tab--active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === 'logements' && (
        <AdminResourceTable<LogementRow>
          endpoint="logements"
          title="Logements"
          emptyIcon="🏠"
          emptyText="Aucun logement enregistré."
          columns={[
            { key: 'nom', label: 'Nom' },
            { key: 'localisation', label: 'Localisation' },
            { key: 'proprietaire_email', label: 'Propriétaire' },
            { key: 'nb_compartiments', label: 'Compartiments' },
          ] as ColumnConfig<LogementRow>[]}
          formFields={[
            { name: 'nom', label: 'Nom', type: 'text', required: true },
            { name: 'localisation', label: 'Localisation', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'proprietaire', label: 'Propriétaire', type: 'select', required: true, optionsLoader: listAllUsersAsOptions },
          ] as FieldConfig[]}
        />
      )}

      {active === 'occupants' && (
        <AdminResourceTable<OccupantRow>
          endpoint="occupants"
          title="Occupants"
          emptyIcon="👤"
          emptyText="Aucun occupant enregistré."
          columns={[
            { key: 'nom_complet', label: 'Nom' },
            { key: 'logement_nom', label: 'Logement' },
            { key: 'compartiment_nom', label: 'Compartiment' },
            { key: 'statut', label: 'Statut' },
          ] as ColumnConfig<OccupantRow>[]}
          formFields={[
            { name: 'nom_complet', label: 'Nom complet', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'text', required: true },
            { name: 'telephone', label: 'Téléphone', type: 'text', required: true },
            { name: 'cni', label: 'CNI', type: 'text', required: true },
            { name: 'compartiment', label: 'Compartiment', type: 'compartiment-picker', required: true },
            { name: 'date_debut_contrat', label: 'Date de début', type: 'date', required: true },
            { name: 'date_fin_contrat', label: 'Date de fin (optionnel)', type: 'date' },
            { name: 'loyer', label: 'Loyer (FCFA)', type: 'number', required: true },
            { name: 'caution_versee', label: 'Caution versée (FCFA)', type: 'number' },
            { name: 'date_prochain_paiement', label: 'Prochain paiement', type: 'date', required: true },
          ] as FieldConfig[]}
        />
      )}

      {active === 'paiements' && (
        <AdminResourceTable<PaiementRow>
          endpoint="paiements"
          title="Paiements"
          emptyIcon="💳"
          emptyText="Aucun paiement enregistré."
          allowEdit={false}
          columns={[
            { key: 'occupant_nom', label: 'Occupant' },
            { key: 'montant_verse', label: 'Montant (FCFA)' },
            { key: 'date_paiement', label: 'Date' },
            { key: 'statut', label: 'Statut' },
          ] as ColumnConfig<PaiementRow>[]}
          formFields={[
            { name: 'occupant', label: 'Occupant', type: 'select', required: true, optionsLoader: listAllOccupantsAsOptions },
            { name: 'montant_verse', label: 'Montant versé (FCFA)', type: 'number', required: true },
            { name: 'nombre_mois', label: 'Nombre de mois', type: 'number', required: true },
            { name: 'mode_paiement', label: 'Mode de paiement', type: 'select', options: MODE_PAIEMENT_OPTIONS },
            { name: 'date_paiement', label: 'Date du paiement', type: 'date', required: true },
            { name: 'date_debut_periode', label: 'Début de période', type: 'date', required: true },
            { name: 'note', label: 'Note', type: 'textarea' },
          ] as FieldConfig[]}
        />
      )}

      {active === 'depenses' && (
        <AdminResourceTable<DepenseRow>
          endpoint="depenses"
          title="Dépenses"
          emptyIcon="💰"
          emptyText="Aucune dépense enregistrée."
          columns={[
            { key: 'libelle', label: 'Libellé' },
            { key: 'logement_nom', label: 'Logement' },
            { key: 'montant', label: 'Montant (FCFA)' },
            { key: 'categorie', label: 'Catégorie' },
          ] as ColumnConfig<DepenseRow>[]}
          formFields={[
            { name: 'logement', label: 'Logement', type: 'select', required: true, optionsLoader: listAllLogementsAsOptions },
            { name: 'libelle', label: 'Libellé', type: 'text', required: true },
            { name: 'montant', label: 'Montant (FCFA)', type: 'number', required: true },
            { name: 'date', label: 'Date', type: 'date', required: true },
            { name: 'categorie', label: 'Catégorie', type: 'select', options: CATEGORIE_OPTIONS },
            { name: 'note', label: 'Note', type: 'textarea' },
          ] as FieldConfig[]}
        />
      )}

      {active === 'etat-des-lieux' && (
        <AdminResourceTable<EtatDesLieuxRow>
          endpoint="etat-des-lieux"
          title="États des lieux"
          emptyIcon="📝"
          emptyText="Aucun état des lieux enregistré."
          columns={[
            { key: 'occupant_nom', label: 'Occupant' },
            { key: 'type_display', label: 'Type' },
            { key: 'date_realisation', label: 'Date' },
            { key: 'etat_general', label: 'État général' },
          ] as ColumnConfig<EtatDesLieuxRow>[]}
          formFields={[
            { name: 'occupant', label: 'Occupant', type: 'select', required: true, optionsLoader: listAllOccupantsAsOptions },
            { name: 'type', label: 'Type', type: 'select', required: true, options: TYPE_EDL_OPTIONS },
            { name: 'date_realisation', label: 'Date de réalisation', type: 'date', required: true },
            { name: 'etat_general', label: 'État général', type: 'select', options: ETAT_OPTIONS },
            { name: 'cles_remises', label: 'Clés remises', type: 'number' },
            { name: 'observations', label: 'Observations', type: 'textarea' },
          ] as FieldConfig[]}
        />
      )}
    </AdminLayout>
  );
};

export default AdminData;
