import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { trashOutline, createOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig';
import './../assets/css/CompartimentDetails.css';

interface Compartiment {
  id: number;
  type: string;
  nom: string;
  statut: string;
  occupant: string | null;
  loyer?: number;
  datePremiereOccupation?: string;
  chambres: number;
  salons: number;
  douches: number;
  cuisines: number;
}

const CompartimentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [compartimentDetails, setCompartimentDetails] = useState<Compartiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompartiment = async () => {
      try {
        const response = await axiosInstance.get(`/compartiments/${id}/`);
        console.log('Response data:', response.data); // Debug: Afficher les données retournées
        setCompartimentDetails(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Erreur API :", err);
        setError("Impossible de charger les détails du compartiment.");
        setLoading(false);
      }
    };

    fetchCompartiment();
  }, [id]);

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!compartimentDetails) {
    return <p>Aucun détail disponible pour ce compartiment.</p>;
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
              <h2>{compartimentDetails.nom}</h2>
              <p><strong>Type:</strong> {compartimentDetails.type}</p>
              <p><strong>Statut:</strong> {compartimentDetails.statut}</p>
              <p><strong>Occupant:</strong> {compartimentDetails.occupant ? compartimentDetails.occupant : "Aucun occupant"}</p>
              {compartimentDetails.statut === 'OCCUPE' && compartimentDetails.loyer && (
                <p><strong>Loyer:</strong> {compartimentDetails.loyer} € par mois</p>
              )}
              {compartimentDetails.datePremiereOccupation && (
                <p><strong>Date de première occupation:</strong> {compartimentDetails.datePremiereOccupation}</p>
              )}
            </IonCol>
          </IonRow>
          <IonRow className="details-section">
            <IonCol size="12">
              <h3>Détails</h3>
              <p><strong>Nombre de chambres:</strong> {compartimentDetails.chambres}</p>
              <p><strong>Nombre de salons:</strong> {compartimentDetails.salons}</p>
              <p><strong>Nombre de douches:</strong> {compartimentDetails.douches}</p>
              <p><strong>Nombre de cuisines:</strong> {compartimentDetails.cuisines}</p>
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
