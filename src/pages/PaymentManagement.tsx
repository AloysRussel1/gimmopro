import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonInput,
  IonSearchbar,
  IonModal,
  IonItem,
} from '@ionic/react';
import { addOutline, timeOutline } from 'ionicons/icons';
import './../assets/css/PaymentManagement.css';

interface Payment {
  amountPaid: string;
  paymentDate: string;
  nextPaymentDate: string;
}

interface Tenant {
  id: number;
  name: string;
  payments: Payment[];
}

interface Logement {
  id: number;
  name: string;
  tenants: Tenant[];
}

const PaymentManagement: React.FC = () => {
  const today = new Date();
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newPayment, setNewPayment] = useState({ amount: '', date: '', nextPaymentDate: '' });
  const history = useHistory(); 

  const logements: Logement[] = [
    {
      id: 1,
      name: 'Logement 1',
      tenants: [
        {
          id: 1,
          name: 'Locataire 1',
          payments: [
            {
              amountPaid: '500',
              paymentDate: '2023-10-01',
              nextPaymentDate: '2023-11-01',
            },
          ],
        },
        {
          id: 2,
          name: 'Locataire 2',
          payments: [
            {
              amountPaid: '600',
              paymentDate: '2023-09-20',
              nextPaymentDate: '2023-10-20',
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Logement 2',
      tenants: [
        {
          id: 3,
          name: 'Locataire 3',
          payments: [
            {
              amountPaid: '800',
              paymentDate: '2023-09-15',
              nextPaymentDate: '2023-10-15',
            },
          ],
        },
      ],
    },
  ];

  const calculateStatus = (nextPaymentDate: string) => {
    const nextDate = new Date(nextPaymentDate);
    return nextDate < today ? 'Retard de paiement' : 'À jour';
  };

  const handleAddPayment = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowModal(true);
  };

  const handleViewHistory = (tenantId: number) => {
    history.push(`/historique/${tenantId}`); 
  };

  const handleSavePayment = () => {
    if (selectedTenant) {
      const payment: Payment = {
        amountPaid: newPayment.amount,
        paymentDate: newPayment.date,
        nextPaymentDate: newPayment.nextPaymentDate,
      };

      // Mettre à jour les paiements du locataire
      selectedTenant.payments.unshift(payment); // Ajoute le paiement en tête de la liste
      setShowModal(false);
      setNewPayment({ amount: '', date: '', nextPaymentDate: '' }); // Réinitialiser le formulaire
    }
  };

  const filteredLogements = logements.map((logement) => ({
    ...logement,
    tenants: logement.tenants.filter((tenant) =>
      tenant.name.toLowerCase().includes(searchText.toLowerCase())
    ),
  }));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonTitle>Gestion des Paiements</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payment-management-content">
        <IonSearchbar
          value={searchText}
          onIonInput={(e: any) => setSearchText(e.target.value)}
          placeholder="Rechercher un locataire"
        />

        {filteredLogements.map((logement) => (
          <IonCard key={logement.id} className="logement-card">
            <IonCardHeader>
              <IonCardTitle>{logement.name}</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <IonGrid>
                {logement.tenants.map((tenant) => (
                  <IonRow key={tenant.id} className="tenant-row">
                    <IonCol size="12" size-md="6">
                      <IonLabel className="tenant-name">{tenant.name}</IonLabel>
                      <IonLabel className="payment-info">
                        {tenant.payments.length > 0 ? (
                          <>
                            <p>Montant versé : {tenant.payments[0].amountPaid}</p>
                            <p>Date de paiement : {tenant.payments[0].paymentDate}</p>
                            <p>Date du prochain paiement : {tenant.payments[0].nextPaymentDate}</p>
                            <p>
                              Statut :{' '}
                              <span
                                className={
                                  calculateStatus(tenant.payments[0].nextPaymentDate) ===
                                    'Retard de paiement'
                                    ? 'status-overdue'
                                    : 'status-up-to-date'
                                }
                              >
                                {calculateStatus(tenant.payments[0].nextPaymentDate)}
                              </span>
                            </p>
                          </>
                        ) : (
                          <p>Aucun paiement enregistré</p>
                        )}
                      </IonLabel>
                    </IonCol>
                    <IonCol size="12" size-md="6" className="tenant-actions">
                      <IonButton
                        className="custom-button"
                        onClick={() => handleAddPayment(tenant)}
                      >
                        <IonIcon icon={addOutline} slot="start" />
                        Ajouter Paiement
                      </IonButton>
                      <IonButton
                        className="custom-button"
                        onClick={() => handleViewHistory(tenant.id)}
                      >
                        <IonIcon icon={timeOutline} slot="start" />
                        Voir Historique
                      </IonButton>
                    </IonCol>
                  </IonRow>
                ))}
              </IonGrid>
            </IonCardContent>
          </IonCard>
        ))}

        {/* Modal pour ajouter un paiement */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Ajouter un Paiement</IonTitle>
              <IonButton slot="end" color="danger" onClick={() => setShowModal(false)}>
                Fermer
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedTenant && (
              <IonItem>
                <IonLabel position="stacked">Locataire</IonLabel>
                <IonInput
                  value={selectedTenant.name}
                  readonly
                />
              </IonItem>
            )}
            <IonItem>
              <IonLabel position="stacked">Montant payé</IonLabel>
              <IonInput
                value={newPayment.amount}
                onIonChange={(e) =>
                  setNewPayment({ ...newPayment, amount: e.detail.value! })
                }
                type="number"
                placeholder="Entrez le montant"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Date de paiement</IonLabel>
              <IonInput
                value={newPayment.date}
                onIonChange={(e) =>
                  setNewPayment({ ...newPayment, date: e.detail.value! })
                }
                type="date"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Date du prochain paiement</IonLabel>
              <IonInput
                value={newPayment.nextPaymentDate}
                onIonChange={(e) =>
                  setNewPayment({ ...newPayment, nextPaymentDate: e.detail.value! })
                }
                type="date"
              />
            </IonItem>
            <IonButton
              expand="block"
              className="custom-button"
              onClick={handleSavePayment}
            >
              Enregistrer Paiement
            </IonButton>
          </IonContent>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default PaymentManagement;
