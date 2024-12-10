import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSearchbar, IonSelect, IonSelectOption, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonIcon } from '@ionic/react';
import { addCircle, create, trash } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './../assets/css/TenantManagement.css';

interface Tenant {
  id: number;
  name: string;
  contact: string;
  logement: string;
  compartiment: string;
  status: string;
  startDate: string;
  rent: number;
  nextPaymentDate: string;
  cniNumber: string;
  phoneNumber: string;
  contractNumber: string;
}

const TenantManagement: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLogement, setFilterLogement] = useState<string>(''); // Ajout du filtre de logement

  const tenants: Tenant[] = [
    {
      id: 1,
      name: 'Aloys M.',
      contact: 'aloystenant@mail.com',
      logement: 'Mon domicile 1',
      compartiment: 'Studio 101',
      status: 'Actif',
      startDate: '2023-07-01',
      rent: 500,
      nextPaymentDate: '2024-10-01',
      cniNumber: 'CNI123456789',
      phoneNumber: '+237 690 123 456',
      contractNumber: 'CONTRACT001',
    },
    {
      id: 2,
      name: 'Bénédicte P.',
      contact: 'benedictetenant@mail.com',
      logement: 'Mon domicile 1',
      compartiment: 'Appartement A202',
      status: 'En retard de paiement',
      startDate: '2022-09-15',
      rent: 600,
      nextPaymentDate: '2024-10-15',
      cniNumber: 'CNI987654321',
      phoneNumber: '+237 691 654 321',
      contractNumber: 'CONTRACT002',
    },
    {
      id: 3,
      name: 'Clara S.',
      contact: 'clara@mail.com',
      logement: 'Mon domicile 2',
      compartiment: 'Appartement B201',
      status: 'Actif',
      startDate: '2023-05-12',
      rent: 600,
      nextPaymentDate: '2024-11-01',
      cniNumber: 'CNI111222333',
      phoneNumber: '+237 693 876 543',
      contractNumber: 'CONTRACT003',
    }
  ];

  const handleSearch = (e: CustomEvent) => {
    setSearchText(e.detail.value);
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchText.toLowerCase()) &&
    (filterStatus === '' || tenant.status === filterStatus) &&
    (filterLogement === '' || tenant.logement === filterLogement) // Filtrage par logement
  );

  const groupedTenants = filteredTenants.reduce((acc, tenant) => {
    if (!acc[tenant.logement]) {
      acc[tenant.logement] = [];
    }
    acc[tenant.logement].push(tenant);
    return acc;
  }, {} as Record<string, Tenant[]>);

  const history = useHistory();

  const handleAddTenant = () => {
    history.push('/ajouter-locataire');
  };

  const handleModifyTenant = (tenant: Tenant) => {
    history.push('/ajouter-locataire', { tenant });
  };

  const handleDeleteTenant = (id: number) => {
    console.log(`Suppression du locataire avec l'ID: ${id}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="custom-toolbar">
          <IonTitle>Gestion des Locataires</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="tenant-management">
        <div className="header-actions">
          <IonSearchbar value={searchText} onIonInput={handleSearch} placeholder="Rechercher un locataire..." />
          <IonSelect value={filterStatus} placeholder="Filtrer par statut" onIonChange={(e) => setFilterStatus(e.detail.value)}>
            <IonSelectOption value="">Tous les statuts</IonSelectOption>
            <IonSelectOption value="Actif">Actif</IonSelectOption>
            <IonSelectOption value="En retard de paiement">En retard de paiement</IonSelectOption>
          </IonSelect>

          {/* Sélection du logement */}
          <IonSelect value={filterLogement} placeholder="Filtrer par logement" onIonChange={(e) => setFilterLogement(e.detail.value)}>
            <IonSelectOption value="">Tous les logements</IonSelectOption>
            <IonSelectOption value="Mon domicile 1">Mon domicile 1</IonSelectOption>
            <IonSelectOption value="Mon domicile 2">Mon domicile 2</IonSelectOption>
          </IonSelect>

          <IonButton className="add-button" onClick={handleAddTenant}>
            <IonIcon slot="start" icon={addCircle} />
            Ajouter un locataire
          </IonButton>
        </div>

        {Object.entries(groupedTenants).map(([logement, tenants]) => (
          <div key={logement}>
            <h2>{logement}</h2> {/* Afficher le nom du logement */}
            {tenants.map(tenant => (
              <IonCard key={tenant.id} className="tenant-card">
                <IonCardHeader>
                  <IonCardSubtitle>{tenant.compartiment}</IonCardSubtitle> {/* Afficher le compartiment occupé */}
                  <IonCardTitle>{tenant.name}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="tenant-info">
                    <h3>Informations Personnelles</h3>
                    <p><strong>Contact :</strong> {tenant.contact}</p>
                    <p><strong>Téléphone :</strong> {tenant.phoneNumber}</p>
                    <p><strong>CNI :</strong> {tenant.cniNumber}</p>
                  </div>

                  <div className="tenant-contract">
                    <h3>Détails du Contrat</h3>
                    <p><strong>Numéro de contrat :</strong> {tenant.contractNumber}</p>
                    <p><strong>Date de début :</strong> {tenant.startDate}</p>
                    <p><strong>Loyer :</strong> {tenant.rent} FCFA</p>
                    <p><strong>Date de prochain paiement :</strong> {tenant.nextPaymentDate}</p>
                  </div>

                  <div className="tenant-status">
                    <h3>Statut</h3>
                    <p><strong>Statut :</strong> <span className={`status ${tenant.status.replace(/\s+/g, '-').toLowerCase()}`}>{tenant.status}</span></p>
                  </div>

                  <div className="actions">
                    <IonButton className="modify-button" onClick={() => handleModifyTenant(tenant)}>
                      <IonIcon slot="start" icon={create} />
                      Modifier
                    </IonButton>
                    <IonButton className="delete-button" onClick={() => handleDeleteTenant(tenant.id)}>
                      <IonIcon slot="start" icon={trash} />
                      Supprimer
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default TenantManagement;
