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
import { useHistory } from 'react-router-dom';
import './../assets/css/LogementDetails.css';

interface Compartiment {
  id: number;
  type: 'Appartement' | 'Studio' | 'Chambre' | 'Boutique';
  nom: string;
  statut: string;
  occupant: string;
}

interface Logement {
  id: number;
  nom: string;
  localisation: string;
  description: string;
  images: string[];
  compartiments: Compartiment[];
}

const LogementDetailsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('Tous');
  const [compartiments, setCompartiments] = useState<Compartiment[]>([]);
  const history = useHistory(); // Initialiser useHistory

  const logement: Logement = {
    id: 1,
    nom: 'Résidence du Parc',
    localisation: '123 Rue de la Liberté, Paris',
    description: 'Un bel immeuble avec plusieurs appartements et studios.',
    images: ['image1.jpg', 'image2.jpg'],
    compartiments: [
      { id: 1, type: 'Appartement', nom: 'Appartement 1', statut: 'Occupé', occupant: 'John Doe' },
      { id: 2, type: 'Studio', nom: 'Studio A', statut: 'Vacant', occupant: 'N/A' },
      { id: 3, type: 'Chambre', nom: 'Chambre B', statut: 'Occupé', occupant: 'Jane Doe' },
      { id: 4, type: 'Boutique', nom: 'Boutique Z', statut: 'Vacant', occupant: 'N/A' },
    ],
  };

  useEffect(() => {
    setCompartiments(logement.compartiments);
  }, []);

  const filteredCompartiments = compartiments.filter((compartiment) => {
    return (
      (filter === 'Tous' || compartiment.type === filter) &&
      compartiment.nom.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleAddCompartiment = () => {
    history.push('/ajouter-compartiment');
  };

  const handleDetailsClick = (id: number) => {
    history.push(`/compartiment/${id}`);
  };

  const handleEditCompartiment = (compartiment: Compartiment) => {
    // Naviguer vers la page d'ajout de compartiment avec les données du compartiment à modifier
    history.push({
      pathname: '/ajouter-compartiment',
      state: { compartiment }, // Passer les informations actuelles du compartiment
    });
  };

  const handleDeleteCompartiment = (id: number) => {
    const updatedCompartiments = compartiments.filter(comp => comp.id !== id);
    setCompartiments(updatedCompartiments);
  };

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
                      <IonTitle>{compartiment.nom}</IonTitle>
                      <p className="compartiment-type">{compartiment.type}</p>
                    </IonCardHeader>
                    <IonCardContent>
                      <p><strong>Statut:</strong> {compartiment.statut}</p>
                      <p><strong>Occupant:</strong> {compartiment.occupant}</p>
                      <IonButton className='custom-button' onClick={() => handleDetailsClick(compartiment.id)}>
                        <IonIcon icon={informationCircleOutline} /> Détails
                      </IonButton>
                      <IonButton
                        color="dark"
                        className="custom-button"
                        onClick={() => handleEditCompartiment(compartiment)}
                      >
                        <IonIcon icon={createOutline} /> Modifier
                      </IonButton>
                      <IonButton
                        color="danger"
                        className="custom-button"
                        onClick={() => handleDeleteCompartiment(compartiment.id)}
                      >
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
