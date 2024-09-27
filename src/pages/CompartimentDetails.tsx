import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonButton, IonIcon } from '@ionic/react';
import { trashOutline, createOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import './../assets/css/CompartimentDetails.css';

interface Compartiment {
  id: number;
  type: string;
  nom: string;
  statut: string;
  occupant: string;
  loyer: number;
  datePremiereOccupation: string;
  details: {
    chambres: number;
    salon: number;
    douche: number;
    cuisine: number;
  };
}

const CompartimentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [occupantDetails, setOccupantDetails] = useState<Compartiment | null>(null);

  useEffect(() => {
    const fetchedCompartiment: Compartiment = {
      id: parseInt(id),
      type: 'Appartement',
      nom: 'Appartement 1',
      statut: 'Occupé',
      occupant: 'John Doe',
      loyer: 1200,
      datePremiereOccupation: '2022-01-15',
      details: {
        chambres: 2,
        salon: 1,
        douche: 1,
        cuisine: 1,
      },
    };
    setOccupantDetails(fetchedCompartiment);
  }, [id]);

  if (!occupantDetails) {
    return <p>Chargement...</p>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Détails du Compartiment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="compartiment-details-content">
        <IonGrid>
          <IonRow className="header-section">
            <IonCol size="12" className="compartiment-header">
              <h2>{occupantDetails.nom}</h2>
              <p><strong>Type:</strong> {occupantDetails.type}</p>
              <p><strong>Statut:</strong> {occupantDetails.statut}</p>
              <p><strong>Occupant:</strong> {occupantDetails.occupant}</p>
              {occupantDetails.statut === 'Occupé' && (
                <p><strong>Loyer:</strong> {occupantDetails.loyer} € par mois</p>
              )}
              <p><strong>Date de première occupation:</strong> {occupantDetails.datePremiereOccupation}</p>
            </IonCol>
          </IonRow>
          <IonRow className="details-section">
            <IonCol size="12">
              <h3>Détails</h3>
              <p><strong>Nombre de chambres:</strong> {occupantDetails.details.chambres}</p>
              <p><strong>Nombre de salons:</strong> {occupantDetails.details.salon}</p>
              <p><strong>Nombre de douches:</strong> {occupantDetails.details.douche}</p>
              <p><strong>Nombre de cuisines:</strong> {occupantDetails.details.cuisine}</p>
            </IonCol>
          </IonRow>
          <IonRow className="action-buttons">
            <IonCol size="6">
              <IonButton className="btn-modifier" expand="full">
                <IonIcon icon={createOutline} /> Modifier
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton className="btn-supprimer" expand="full">
                <IonIcon icon={trashOutline} /> Supprimer
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default CompartimentDetailsPage;
