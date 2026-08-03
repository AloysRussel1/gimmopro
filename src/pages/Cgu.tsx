import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import '../assets/css/LegalPage.css';

const Cgu: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="legal-content" scrollY>
        <div className="legal-wrap">
          <div className="legal-topbar" onClick={() => history.push('/')} style={{ cursor: 'pointer' }}>
            <div className="legal-topbar__mark">G</div>
            <span className="legal-topbar__name">Gimmopro</span>
          </div>

          <h1 className="legal-title">Conditions Générales d'Utilisation</h1>
          <p className="legal-updated">Dernière mise à jour : août 2026</p>

          <div className="legal-section">
            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (« CGU ») ont pour objet de définir
              les modalités et conditions d'utilisation de la plateforme Gimmopro (« le Service »),
              un outil de gestion locative destiné aux propriétaires bailleurs.
            </p>
          </div>

          <div className="legal-section">
            <h2>2. Acceptation des CGU</h2>
            <p>
              L'inscription sur Gimmopro implique l'acceptation pleine et entière des présentes CGU.
              Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.
            </p>
          </div>

          <div className="legal-section">
            <h2>3. Description du service</h2>
            <p>
              Gimmopro permet à un propriétaire bailleur de gérer ses biens immobiliers (logements,
              compartiments), ses locataires (occupants), le suivi des paiements de loyer, des dépenses,
              des documents et des états des lieux. Le Service génère notamment des contrats de bail,
              des reçus de paiement et des reçus de dépôt de garantie au format PDF.
            </p>
          </div>

          <div className="legal-section">
            <h2>4. Compte utilisateur</h2>
            <p>
              L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion
              et de toute activité effectuée depuis son compte. Toute création de compte nécessite une
              adresse email valide, confirmée par un lien d'activation.
            </p>
          </div>

          <div className="legal-section">
            <h2>5. Obligations de l'utilisateur</h2>
            <ul>
              <li>Fournir des informations exactes concernant ses biens et ses locataires.</li>
              <li>Utiliser le Service conformément à la réglementation applicable en matière de location immobilière et de protection des données personnelles.</li>
              <li>Ne pas utiliser le Service à des fins frauduleuses ou pour porter atteinte aux droits de tiers, notamment de ses locataires.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>6. Propriété intellectuelle</h2>
            <p>
              La plateforme Gimmopro, sa structure, son design et ses éléments graphiques sont protégés
              par le droit de la propriété intellectuelle. Les données saisies par l'utilisateur
              (logements, locataires, paiements, documents) restent sa propriété.
            </p>
          </div>

          <div className="legal-section">
            <h2>7. Limitation de responsabilité</h2>
            <p>
              Gimmopro est un outil d'aide à la gestion locative et ne se substitue pas à un conseil
              juridique, comptable ou fiscal. L'utilisateur reste seul responsable des documents
              (contrats, reçus) générés et de leur conformité avec la réglementation en vigueur.
              Gimmopro ne saurait être tenu responsable des litiges entre le bailleur et ses locataires.
            </p>
          </div>

          <div className="legal-section">
            <h2>8. Résiliation</h2>
            <p>
              L'utilisateur peut demander la suppression de son compte à tout moment. Gimmopro se réserve
              le droit de suspendre ou résilier un compte en cas de manquement grave aux présentes CGU.
            </p>
          </div>

          <div className="legal-section">
            <h2>9. Droit applicable</h2>
            <p>
              Les présentes CGU sont régies par le droit camerounais. Tout litige relatif à leur
              interprétation ou leur exécution relève de la compétence des juridictions camerounaises.
            </p>
          </div>

          <div className="legal-section">
            <h2>10. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter via l'adresse
              email associée à votre compte Gimmopro.
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Cgu;
