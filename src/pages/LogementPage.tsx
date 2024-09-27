import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import './../assets/css/LogementPage.css'; // Fichier de style spécifique

import logement1 from './../assets/images/logement1.png';
import logement2 from './../assets/images/logement2.png';
import logement3 from './../assets/images/logement3.png';

interface Logement {
  id: number;
  nom: string;
  localisation: string;
  description: string;
  imageUrl: string;
}

const LogementPage: React.FC = () => {
  const [logements, setLogements] = useState<Logement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Hook pour l'historique de navigation
  const history = useHistory();

  useEffect(() => {
    const fetchLogements = async () => {
      const initialLogements: Logement[] = [
        {
          id: 1,
          nom: 'Mon domicile 1',
          localisation: 'Paris, France',
          description: 'Maison spacieuse avec jardin et piscine.',
          imageUrl: logement1,
        },
        {
          id: 2,
          nom: 'Mon domicile 2',
          localisation: 'Lyon, France',
          description: 'Appartement moderne au centre-ville.',
          imageUrl: logement2,
        },
        {
          id: 3,
          nom: 'Mon domicile 3',
          localisation: 'Marseille, France',
          description: 'Studio confortable près de la plage.',
          imageUrl: logement3,
        },
      ];
      setLogements(initialLogements);
    };

    fetchLogements();
  }, []);

  const handleAddLogement = () => {
    history.push('/ajouter-logement'); 
  };

  const handleSearchChange = (event: CustomEvent) => {
    setSearchTerm(event.detail.value || '');
  };

  const filteredLogements = logements.filter(logement =>
    logement.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour naviguer vers la page de détails
  const handleViewDetails = (logementId: number) => {
    history.push(`/logement/${logementId}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="custom-toolbar">
          <IonTitle>Gestion des Logements</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="custom-content">
        <IonSearchbar
          placeholder="Rechercher un logement..."
          value={searchTerm}
          onIonInput={handleSearchChange}
          className="custom-searchbar"
        />
        <IonButton expand="full" onClick={handleAddLogement} className="add-logement-btn">
          Ajouter un Logement
        </IonButton>
        <IonGrid>
          <IonRow>
            {filteredLogements.map(logement => (
              <IonCol
                sizeXs="12"
                sizeSm="6"
                sizeMd="4"
                key={logement.id}
                className="logement-col"
              >
                <IonCard className="logement-card">
                  <img src={logement.imageUrl} alt={logement.nom} className="logement-image" />
                  <IonCardHeader className="logement-header">
                    <IonCardTitle>{logement.nom}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="logement-content">
                    <p><strong>Localisation:</strong> {logement.localisation}</p>
                    <p>{logement.description}</p>
                    {/* Utilisation de la fonction pour naviguer */}
                    <IonButton
                      expand="full"
                      className="voir-plus-btn"
                      onClick={() => handleViewDetails(logement.id)}
                    >
                      Voir Plus
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LogementPage;
