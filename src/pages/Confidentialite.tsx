import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import '../assets/css/LegalPage.css';

const Confidentialite: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="legal-content" scrollY>
        <div className="legal-wrap">
          <div className="legal-topbar" onClick={() => history.push('/')} style={{ cursor: 'pointer' }}>
            <div className="legal-topbar__mark">G</div>
            <span className="legal-topbar__name">Gimmopro</span>
          </div>

          <div className="legal-banner">
            ⚠ Document provisoire — à faire relire et valider par un professionnel du droit
            avant toute mise en production avec des utilisateurs et locataires réels.
          </div>

          <h1 className="legal-title">Politique de confidentialité</h1>
          <p className="legal-updated">Version provisoire</p>

          <div className="legal-section">
            <h2>1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données à caractère personnel collectées via Gimmopro
              est l'éditeur de la plateforme. Pour toute question relative à vos données, contactez-nous
              via l'adresse email associée à votre compte.
            </p>
          </div>

          <div className="legal-section">
            <h2>2. Données collectées</h2>
            <p>Gimmopro collecte et traite les catégories de données suivantes :</p>
            <ul>
              <li>Données du compte bailleur : nom, adresse email, mot de passe (chiffré), numéro de téléphone.</li>
              <li>Données des locataires, saisies par le bailleur dans le cadre de la gestion de ses biens : nom complet, email, téléphone, numéro de carte nationale d'identité (CNI).</li>
              <li>Données relatives aux biens : logements, compartiments, contrats de bail.</li>
              <li>Données financières : montants des loyers, paiements effectués, dépôts de garantie, dépenses liées aux biens.</li>
              <li>Documents téléversés par le bailleur (pièces jointes, états des lieux).</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>3. Finalités du traitement</h2>
            <p>
              Ces données sont traitées dans le but exclusif de permettre au bailleur de gérer ses biens
              locatifs : suivi des locataires, des paiements, génération de contrats et de reçus, et
              communication avec ses locataires (par exemple, l'envoi d'un reçu de dépôt de garantie).
            </p>
          </div>

          <div className="legal-section">
            <h2>4. Durée de conservation</h2>
            <p>
              Les données sont conservées pendant toute la durée d'utilisation du compte, puis pour la
              durée nécessaire au respect des obligations légales applicables en matière de baux et de
              gestion locative, avant suppression ou anonymisation.
            </p>
          </div>

          <div className="legal-section">
            <h2>5. Destinataires des données</h2>
            <p>
              Les données ne sont accessibles qu'au bailleur propriétaire du compte concerné — Gimmopro
              applique une isolation stricte entre les comptes, un bailleur ne pouvant jamais accéder aux
              données d'un autre. Certaines données (par exemple, un reçu de dépôt de garantie) sont
              transmises au locataire concerné, à sa propre adresse email, à la demande explicite du
              bailleur. Des prestataires techniques (hébergement, envoi d'emails transactionnels)
              peuvent traiter ces données pour le compte de Gimmopro, dans le seul cadre du fonctionnement
              du Service.
            </p>
          </div>

          <div className="legal-section">
            <h2>6. Sécurité</h2>
            <p>
              Gimmopro met en œuvre des mesures techniques raisonnables pour protéger les données
              (connexions chiffrées, mots de passe chiffrés, authentification par jeton). Aucun système
              n'étant infaillible, l'utilisateur est invité à choisir un mot de passe robuste et à ne pas
              le partager.
            </p>
          </div>

          <div className="legal-section">
            <h2>7. Droits des personnes concernées</h2>
            <p>
              Toute personne dont les données sont traitées (bailleur ou locataire) dispose d'un droit
              d'accès, de rectification et de suppression de ses données. Le bailleur peut exercer ces
              droits directement depuis son compte pour les données qu'il gère ; un locataire souhaitant
              exercer ces droits doit s'adresser à son bailleur, ou à défaut à Gimmopro.
            </p>
          </div>

          <div className="legal-section">
            <h2>8. Cookies et traceurs</h2>
            <p>
              Gimmopro utilise uniquement les cookies/traceurs techniques strictement nécessaires au
              fonctionnement du Service (maintien de la session de connexion). Aucun cookie publicitaire
              ou de suivi tiers n'est utilisé à ce jour.
            </p>
          </div>

          <div className="legal-section">
            <h2>9. Contact</h2>
            <p>
              Pour toute question relative à cette politique ou à l'exercice de vos droits, contactez-nous
              via l'adresse email associée à votre compte Gimmopro.
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Confidentialite;
