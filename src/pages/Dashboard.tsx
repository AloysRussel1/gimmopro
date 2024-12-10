import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './../assets/css/Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dashboard-content">
        <div className="dashboard-header">
          <h1>Bienvenue sur le Dashboard</h1>
          <p>Suivez vos statistiques essentielles en un coup d'œil.</p>
        </div>

        <div className="dashboard-cards">
          <div className="card logement">
            <h2>Logements</h2>
            <p>Nombre total : <strong>25</strong></p>
            <p>Compartiments libres : <strong>15</strong></p>
            <p>Compartiments occupés : <strong>10</strong></p>
          </div>
          <div className="card locataire">
            <h2>Locataires</h2>
            <p>Nombre total : <strong>30</strong></p>
            <p>Locataires à jour : <strong>25</strong></p>
            <p>Locataires en retard : <strong>5</strong></p>
          </div>
          <div className="card paiement">
            <h2>Paiements</h2>
            <p>Montant total : <strong>12,000 €</strong></p>
            <p>Paiements à jour : <strong>80%</strong></p>
          </div>
          <div className="card compartiment">
            <h2>Compartiments</h2>
            <p>Nombre total : <strong>10</strong></p>
            <p>Compartiments libres : <strong>5</strong></p>
            <p>Compartiments occupés : <strong>5</strong></p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
