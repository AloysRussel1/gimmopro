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
  IonTextarea,
  IonLabel,
  IonItem,
  IonProgressBar,
} from '@ionic/react';
import './../assets/css/AddLogementForm.css';

const AddLogementForm: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    localisation: '',
    description: '',
    image: null,
  });

  const [step, setStep] = useState(1);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: any) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique pour enregistrer le logement
    console.log(formData);
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const previousStep = () => {
    setStep(step - 1);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ajouter un Logement</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding form-page">
        <IonProgressBar value={step / 2} className='progress-bar' />

        <form onSubmit={handleSubmit} className="form-classic">
          <h2>Étape {step}</h2>

          {step === 1 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Nom du Logement</IonLabel>
                <IonInput
                  name="nom"
                  value={formData.nom}
                  onIonInput={handleChange}
                  placeholder="Entrez le nom du logement"
                  required
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Localisation</IonLabel>
                <IonInput
                  name="localisation"
                  value={formData.localisation}
                  onIonInput={handleChange}
                  placeholder="Entrez la localisation"
                  required
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  name="description"
                  value={formData.description}
                  onIonInput={handleChange}
                  placeholder="Entrez une description"
                  required
                />
              </IonItem>
            </>
          )}

          {step === 2 && (
            <>
              <IonItem>
                <IonLabel position="stacked">Image</IonLabel>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  required
                />
              </IonItem>
            </>
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
              {step < 2 ? (
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

export default AddLogementForm;
