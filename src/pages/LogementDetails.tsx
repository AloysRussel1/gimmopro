import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonIcon,
} from '@ionic/react';
import { addOutline, trashOutline, createOutline, informationCircleOutline } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import axiosInstance from './../api/axiosConfig'; // Importation de votre fichier Axios
import './../assets/css/LogementDetails.css';

interface Compartiment {
  id: number;
  type: string; // Pas de types fixes pour correspondre aux données
  nom: string;
  statut: string;
  occupant: string | null;
  logement: number; // Correspondance correcte avec la clé logement
}

interface Logement {
  id: number;
  nom: string;
  localisation: string;
  description: string;
  images: string[];
}

const LogementDetailsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('Tous');
  const [compartiments, setCompartiments] = useState<Compartiment[]>([]);
  const [logement, setLogement] = useState<Logement | null>(null);
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchLogementDetails = async () => {
      try {
        const response = await axiosInstance.get(`/logements/${id}`);
        setLogement(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des détails du logement:', error);
      }
    };

    const fetchCompartiments = async () => {
      try {
        const response = await axiosInstance.get(`/logements/${id}/compartiments/`);
        setCompartiments(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des compartiments:', error);
      }
    };

    if (id) {
      fetchLogementDetails();
      fetchCompartiments();
    }
  }, [id]);

  const filteredCompartiments = compartiments.filter((compartiment) => {
    const logementCorrespondance = compartiment.logement === parseInt(id); // Vérifie la correspondance
    const typeCorrespondance = filter === 'Tous' || compartiment.type.toLowerCase() === filter.toLowerCase();
    const nomCorrespondance = compartiment.nom.toLowerCase().includes(search.toLowerCase());
    return logementCorrespondance && typeCorrespondance && nomCorrespondance;
  });

  const handleAddCompartiment = () => {
    history.push(`/logement/${id}/ajouter-compartiment`);
  };

  const handleDetailsClick = (id: number) => {
    history.push(`/compartiment/${id}`);
  };

  const handleEditCompartiment = (compartiment: Compartiment) => {
    history.push({
      pathname: '/ajouter-compartiment',
      state: { compartiment },
    });
  };

  const handleDeleteCompartiment = async (id: number) => {
    try {
      await axiosInstance.delete(`/compartiments/${id}`);
      setCompartiments(compartiments.filter((comp) => comp.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression du compartiment:', error);
    }
  };

  if (!logement) {
    return <p>Chargement...</p>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Détails du Logement</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="logement-details-content">
        <IonGrid>
          <IonRow className="logement-details-row">
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonTitle>{logement.nom}</IonTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p><strong>Localisation:</strong> {logement.localisation}</p>
                  <p>{logement.description}</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow className="search-filter-section">
            <IonCol size="12" className="search-filter-col">
              <IonSearchbar
                value={search}
                onIonInput={(e) => setSearch(e.detail.value!)}
                placeholder="Rechercher un compartiment..."
                className="custom-searchbar"
              />
              <IonSelect
                value={filter}
                placeholder="Filtrer par type"
                onIonChange={(e) => setFilter(e.detail.value)}
                className="custom-select"
              >
                <IonSelectOption value="Tous">Tous les types</IonSelectOption>
                <IonSelectOption value="Appartement">Appartement</IonSelectOption>
                <IonSelectOption value="Studio">Studio</IonSelectOption>
                <IonSelectOption value="Chambre">Chambre</IonSelectOption>
                <IonSelectOption value="Boutique">Boutique</IonSelectOption>
              </IonSelect>
            </IonCol>
          </IonRow>

          <IonRow className="control-section">
            <IonCol size="12" className="button-center">
              <IonButton onClick={handleAddCompartiment} className="custom-button">
                <IonIcon icon={addOutline} />
                Ajouter Compartiment
              </IonButton>
            </IonCol>
          </IonRow>

          <IonRow className="compartiment-list">
            {filteredCompartiments.length > 0 ? (
              filteredCompartiments.map((compartiment) => (
                <IonCol key={compartiment.id} size="12" size-md="6" size-lg="4" className="compartiment-col">
                  <IonCard className="compartiment-card">
                    <IonCardHeader>
                      <IonTitle className="compartiment-name">{compartiment.nom}</IonTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p className="compartiment-type">{compartiment.type}</p>
                      <p><strong>Statut:</strong> {compartiment.statut}</p>
                      <p><strong>Occupant:</strong> {compartiment.occupant || 'Non assigné'}</p>
                      <IonButton size="small" className="custom-button" onClick={() => handleDetailsClick(compartiment.id)}>
                        <IonIcon icon={informationCircleOutline} /> Détails
                      </IonButton>
                      <IonButton size="small" color="dark" className="custom-button" onClick={() => handleEditCompartiment(compartiment)}>
                        <IonIcon icon={createOutline} /> Modifier
                      </IonButton>
                      <IonButton size="small" color="danger" className="custom-button" onClick={() => handleDeleteCompartiment(compartiment.id)}>
                        <IonIcon icon={trashOutline} /> Supprimer
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))
            ) : (
              <IonCol size="12">
                <p>Aucun compartiment trouvé</p>
              </IonCol>
            )}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LogementDetailsPage;
