import React, { useEffect, useState } from 'react';
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
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import './../assets/css/PaymentHistory.css';

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

const PaymentHistory: React.FC<{ tenantId: number }> = ({ tenantId }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // Simuler la récupération des données
  useEffect(() => {
    const fetchTenantData = () => {
      const simulatedData: Tenant = {
        id: tenantId,
        name: 'Locataire 1',
        payments: [
          { amountPaid: '500', paymentDate: '2023-09-01', nextPaymentDate: '2023-10-01' },
          { amountPaid: '300', paymentDate: '2023-08-01', nextPaymentDate: '2023-09-01' },
          { amountPaid: '400', paymentDate: '2023-07-01', nextPaymentDate: '2023-08-01' },
        ],
      };
      setTenant(simulatedData);
    };

    fetchTenantData();
  }, [tenantId]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="dark">
          <IonButton slot="start" color="light" onClick={() => window.history.back()}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>Historique des Paiements</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payment-history-content">
        {tenant ? (
          <IonCard className="payment-card">
            <IonCardHeader>
              <IonCardTitle className="card-title">Historique des paiements pour {tenant.name}</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <IonGrid>
                {tenant.payments.map((payment, index) => (
                  <IonRow key={index} className="payment-row">
                    <IonCol size="12" size-md="4" className="payment-col">
                      <IonLabel className="payment-label">Montant payé : <strong>{payment.amountPaid} €</strong></IonLabel>
                    </IonCol>
                    <IonCol size="12" size-md="4" className="payment-col">
                      <IonLabel className="payment-label">Date de paiement : <strong>{payment.paymentDate}</strong></IonLabel>
                    </IonCol>
                    <IonCol size="12" size-md="4" className="payment-col">
                      <IonLabel className="payment-label">Date du prochain paiement : <strong>{payment.nextPaymentDate}</strong></IonLabel>
                    </IonCol>
                  </IonRow>
                ))}
              </IonGrid>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonLabel>Chargement des données...</IonLabel>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PaymentHistory;
