import React, { useState, useEffect } from 'react';
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
  IonInput,
  IonLabel,
  IonItem,
  IonDatetime,
  IonProgressBar,
} from '@ionic/react';
import axios from './../api/axiosConfig';
import './../assets/css/AddTenantForm.css';

interface Locataire {
  nom_complet: string;
  telephone: string;
  cni: string;
  email: string;
  numero_contrat: string;
  date_debut_contrat: string;
  loyer: string;
  date_prochain_paiement: string;
  statut: string;
}

interface AddOccupantFormProps {
  existingData?: Locataire; // Propriété pour les données existantes
}

const AddOccupantForm: React.FC<AddOccupantFormProps> = ({ existingData }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nom_complet: '',
    telephone: '',
    cni: '',
    email: '',
    numero_contrat: '',
    date_debut_contrat: '',
    loyer: '',
    date_prochain_paiement: '',
    statut: 'Actif', // Par défaut, statut Actif
  });

  // Gérer le changement dans le formulaire
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const nextStep = () => setStep(step + 1);
  const previousStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(`occupants/`, formData);
      console.log('Occupant ajouté avec succès:', response.data);
      alert('Occupant ajouté avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'occupant:', (error as any));
      alert('Erreur lors de l\'ajout de l\'occupant.');
    }
  };

  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
    }
  }, [existingData]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{existingData ? 'Modifier Locataire' : 'Ajouter un Locataire'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding form-page">
        <IonProgressBar value={step / 7} className="progress-bar" />

        <form onSubmit={handleSubmit} className="form-classic">
          <h2>Étape {step}</h2>

          {step === 1 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Nom du Locataire</IonLabel>
                <IonInput
                  name="nom_complet"
                  value={formData.nom_complet}
                  onIonInput={handleChange}
                  placeholder="Entrez le nom du locataire"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Contact du Locataire</IonLabel>
                <IonInput
                  name="telephone"
                  value={formData.telephone}
                  onIonInput={handleChange}
                  placeholder="Entrez le contact du locataire"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">CNI du Locataire</IonLabel>
                <IonInput
                  name="cni"
                  value={formData.cni}
                  onIonInput={handleChange}
                  placeholder="Entrez le numéro de CNI"
                />
              </IonItem>
            </>
          )}

          {step === 2 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Email du Locataire</IonLabel>
                <IonInput
                  name="email"
                  value={formData.email}
                  onIonInput={handleChange}
                  placeholder="Entrez l'email du locataire"
                />
              </IonItem>
            </>
          )}

          {step === 3 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Numéro de Contrat</IonLabel>
                <IonInput
                  name="numero_contrat"
                  value={formData.numero_contrat}
                  onIonInput={handleChange}
                  placeholder="Entrez le numéro du contrat"
                />
              </IonItem>
            </>
          )}

          {step === 4 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Date de Début du Contrat</IonLabel>
                <IonDatetime
                  name="date_debut_contrat"
                  value={formData.date_debut_contrat}
                  onIonChange={handleChange}
                />
              </IonItem>
            </>
          )}

          {step === 5 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Loyer Mensuel</IonLabel>
                <IonInput
                  name="loyer"
                  type="number"
                  value={formData.loyer}
                  onIonInput={handleChange}
                  placeholder="Entrez le montant du loyer"
                />
              </IonItem>
            </>
          )}

          {step === 6 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Date de Prochain Paiement</IonLabel>
                <IonDatetime
                  name="date_prochain_paiement"
                  value={formData.date_prochain_paiement}
                  onIonChange={handleChange}
                />
              </IonItem>
            </>
          )}

          {step === 7 && (
            <div className="confirmation-section">
              <h3>Confirmation</h3>
              {Object.entries(formData).map(([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {value}
                </p>
              ))}
            </div>
          )}

          <IonRow>
            <IonCol>
              {step > 1 && (
                <IonButton expand="block" onClick={previousStep} className="btn">
                  Précédent
                </IonButton>
              )}
            </IonCol>
            <IonCol>
              {step < 7 ? (
                <IonButton expand="block" onClick={nextStep} className="btn">
                  Suivant
                </IonButton>
              ) : (
                <IonButton expand="block" type="submit" className="btn">
                  Enregistrer
                </IonButton>
              )}
            </IonCol>
          </IonRow>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default AddOccupantForm;
