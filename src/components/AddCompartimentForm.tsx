import React, { useState } from 'react';
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
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  IonProgressBar,
} from '@ionic/react';
import './../assets/css/AddCompartimentForm.css';

const AddCompartimentForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: '',
    nom: '',
    statut: '',
    chambres: 0,
    salons: 0,
    douches: 0,
    cuisines: 0,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const previousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ajouter un Compartiment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding form-page">
        <IonProgressBar value={step / 3} className='progress-bar'/>

        <form onSubmit={handleSubmit} className="form-classic">
          <h2>Étape {step}</h2>

          {step === 1 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Type de Compartiment</IonLabel>
                <IonSelect
                  name="type"
                  value={formData.type}
                  onIonChange={handleChange}
                  placeholder="Sélectionnez un type"
                >
                  <IonSelectOption value="Appartement">Appartement</IonSelectOption>
                  <IonSelectOption value="Chambre">Chambre</IonSelectOption>
                  <IonSelectOption value="Studio">Studio</IonSelectOption>
                  <IonSelectOption value="Boutique">Boutique</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Nom</IonLabel>
                <IonInput
                  name="nom"
                  value={formData.nom}
                  onIonInput={handleChange}
                  placeholder="Entrez le nom du compartiment"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Statut</IonLabel>
                <IonSelect
                  name="statut"
                  value={formData.statut}
                  onIonChange={handleChange}
                  placeholder="Sélectionnez un statut"
                >
                  <IonSelectOption value="Occupé">Occupé</IonSelectOption>
                  <IonSelectOption value="Disponible">Disponible</IonSelectOption>
                </IonSelect>
              </IonItem>
            </>
          )}

          {step === 2 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Nombre de Chambres</IonLabel>
                <IonInput
                  name="chambres"
                  type="number"
                  value={formData.chambres}
                  onIonInput={handleChange}
                  placeholder="Entrez le nombre de chambres"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Nombre de Salons</IonLabel>
                <IonInput
                  name="salons"
                  type="number"
                  value={formData.salons}
                  onIonInput={handleChange}
                  placeholder="Entrez le nombre de salons"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Nombre de Douches</IonLabel>
                <IonInput
                  name="douches"
                  type="number"
                  value={formData.douches}
                  onIonInput={handleChange}
                  placeholder="Entrez le nombre de douches"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Nombre de Cuisines</IonLabel>
                <IonInput
                  name="cuisines"
                  type="number"
                  value={formData.cuisines}
                  onIonInput={handleChange}
                  placeholder="Entrez le nombre de cuisines"
                />
              </IonItem>
            </>
          )}

          {step === 3 && (
            <div className="confirmation-section">
              <h3>Confirmation</h3>
              <p>Type: {formData.type}</p>
              <p>Nom: {formData.nom}</p>
              <p>Statut: {formData.statut}</p>
              <p>Chambres: {formData.chambres}</p>
              <p>Salons: {formData.salons}</p>
              <p>Douches: {formData.douches}</p>
              <p>Cuisines: {formData.cuisines}</p>
            </div>
          )}

          <IonRow>
            <IonCol>
              {step > 1 && (
                <IonButton expand="block" onClick={previousStep} className='btn'>
                  Précédent
                </IonButton>
              )}
            </IonCol>
            <IonCol>
              {step < 3 ? (
                <IonButton expand="block" onClick={nextStep} className='btn'>
                  Suivant
                </IonButton>
              ) : (
                <IonButton expand="block" type="submit" className='btn'>
                  Ajouter
                </IonButton>
              )}
            </IonCol>
          </IonRow>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default AddCompartimentForm;
