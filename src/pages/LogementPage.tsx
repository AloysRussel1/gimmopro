import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig'; 
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hook pour l'historique de navigation
  const history = useHistory();

  useEffect(() => {
    const fetchLogements = async () => {
      setLoading(true);
      setError(null); // Réinitialiser les erreurs avant de tenter une nouvelle requête

      try {
        const response = await axiosInstance.get('/logements_list'); // Utilisation de votre configuration axios

        // On suppose que la réponse est bien au format JSON et on l'assigne
        setLogements(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des logements:', err);
        setError('Erreur lors du chargement des logements. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
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

        {loading && <p>Chargement en cours...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

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
                  <IonCardHeader className="logement-header">
                    <IonCardTitle className="logement-title">{logement.nom}</IonCardTitle>
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
