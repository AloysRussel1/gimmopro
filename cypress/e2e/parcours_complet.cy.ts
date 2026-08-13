// Recette finale avant mise en production réelle : parcours utilisateur
// complet piloté à travers la vraie interface (jamais d'appel API direct
// pour "tricher" une étape), du login jusqu'à l'export comptable, en
// passant par le nouveau design mobile de la page Locataires.
//
// Nécessite en amont (voir README de la suite / commande ci-dessous) :
//   - Le backend Django tournant en local sur http://127.0.0.1:8000
//   - Le compte de test seedé : cd gimmopro_backend && manage.py seed_e2e_user
//   - Le frontend Vite tournant en local sur http://localhost:5173
//     (cypress.config.ts pointe déjà dessus)
//
// L'inscription elle-même (accepter les CGU, recevoir l'email de
// vérification) n'est PAS testée ici via un vrai envoi d'email -- Cypress
// ne peut pas lire une boîte mail réelle. Ce chemin précis est déjà
// vérifié bout en bout côté backend (ParcoursCompletIntegrationTest,
// app/tests.py), avec le vrai token d'activation. Ici, on se connecte
// directement avec le compte de test pré-activé pour se concentrer sur
// tout ce qui EST observable/pilotable dans un vrai navigateur.

const EMAIL = 'e2e.test@gimmopro.local';
const PASSWORD = 'CypressTest123!';

// testIsolation: false -- Cypress 13 efface localStorage (donc le JWT) entre
// chaque it(), alors que cette suite est délibérément UN SEUL parcours
// continu découpé en étapes lisibles, pas des tests indépendants. C'est
// exactement le cas d'usage documenté par Cypress pour cette option.
describe('Parcours utilisateur complet', { testIsolation: false }, () => {
  const nomLogement = `Résidence E2E ${Date.now()}`;
  const nomLocataire = 'Jean Cypress';

  it('se connecte avec le compte de test', () => {
    cy.visit('/login');
    cy.get('input[placeholder="vous@email.com"]').type(EMAIL);
    cy.get('input[placeholder="••••••••"]').type(PASSWORD);
    cy.contains('button', 'Se connecter').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  });

  it('crée un logement puis un compartiment', () => {
    cy.visit('/ajouter-logement');
    cy.get('input[placeholder="Ex : Résidence Bonapriso"]').type(nomLogement);
    cy.get('input[placeholder="Ex : Bonapriso, Douala"]').type('Douala, Akwa');
    cy.contains('button', 'Enregistrer et ajouter des compartiments').click();

    // Redirigé automatiquement vers l'ajout de compartiment.
    cy.location('pathname', { timeout: 10000 }).should('match', /\/logement\/\d+\/ajouter-compartiment/);
    cy.contains('button', 'Studio').click(); // étape 1 : type
    cy.contains('button', 'Suivant').click();

    cy.get('input[placeholder="Ex: Studio S1"]').type('Studio E2E'); // étape 2
    cy.get('input[placeholder="50 000"]').type('50000');
    cy.contains('button', 'Suivant').click();

    cy.contains('button', 'Suivant').click(); // étape 3 : composition, valeurs par défaut OK

    // étape 4 : confirmation -- termine et va voir le logement.
    cy.contains('button', 'Terminer et voir le logement').click();
    cy.location('pathname', { timeout: 10000 }).should('match', /\/logement\/\d+$/);
  });

  it("associe un locataire avec caution renseignée dès la création", () => {
    cy.visit('/ajouter-locataire');

    cy.get('input[placeholder="Jean Dupont"]').type(nomLocataire); // étape 1
    cy.contains('button', 'Suivant').click();

    cy.get('[data-testid="phone-input"]').type('699888777'); // étape 2
    cy.get('input[placeholder="1234567890123"]').type('CNI-E2E-001');
    cy.contains('button', 'Suivant').click();

    cy.get('select').first().select(nomLogement); // étape 3
    cy.contains('.tf-comp-btn', 'Studio E2E').click();
    cy.contains('button', 'Suivant').click();

    const aujourdhui = new Date().toISOString().split('T')[0];
    const dansUnMois = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    cy.get('input[type="date"]').eq(0).type(aujourdhui); // date d'entrée -- étape 4
    // Le loyer est déjà pré-rempli depuis le compartiment (50000).
    cy.get('input[placeholder="0"]').type('100000'); // caution
    cy.get('input[type="date"]').eq(1).type(aujourdhui); // date de versement caution
    cy.get('input[type="date"]').eq(3).type(dansUnMois); // date du prochain paiement
    cy.contains('button', 'Suivant').click();

    cy.contains('button', 'Confirmer').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/locataire');
  });

  it('affiche la carte locataire épurée (design mobile) : action principale + menu ⋮', () => {
    cy.viewport('iphone-x'); // vérifie spécifiquement le rendu mobile demandé
    cy.visit('/locataire');
    cy.contains('.tenant-card', nomLocataire, { timeout: 10000 }).within(() => {
      // Une seule action visible + le bouton kebab -- plus les 8 boutons d'avant.
      cy.get('.tenant-card__actions button').should('have.length', 2);
      cy.contains('button', '💳 Paiement').should('be.visible');
      cy.get('.tenant-kebab').should('be.visible');
    });
  });

  it("ouvre le menu d'actions secondaires (bottom sheet) réduit à l'essentiel (ÉTAPE 2)", () => {
    cy.contains('.tenant-card', nomLocataire).find('.tenant-kebab').click();
    cy.get('.action-sheet-group', { timeout: 5000 }).should('be.visible');
    cy.contains('.action-sheet-button', 'Modifier').should('be.visible');
    cy.contains('.action-sheet-button', 'Documents & Reçus').should('be.visible');
    cy.contains('.action-sheet-button', 'Marquer le départ').should('be.visible');
    cy.contains('.action-sheet-button', 'Supprimer').should('be.visible');
    // Les anciens items séparés ont été regroupés dans "Documents & Reçus" --
    // ils ne doivent plus apparaître directement dans le menu.
    cy.contains('.action-sheet-button', 'Voir le contrat').should('not.exist');
    cy.contains('.action-sheet-button', 'Envoyer reçu caution').should('not.exist');
    cy.contains('.action-sheet-button', 'Annuler').click();
    // Attend la fin de l'animation de fermeture avant le test suivant --
    // sinon un nouveau clic sur ⋮ peut arriver pendant la transition et être
    // ignoré par le composant Ionic (overlay encore en cours de sortie).
    cy.get('.action-sheet-group').should('not.be.visible');
  });

  it('prévisualise le contrat de bail depuis le hub Documents & Reçus', () => {
    cy.intercept('GET', '**/occupants/*/contrat/').as('bailPdf');
    cy.intercept('GET', '**/paiements/?occupant_id=*').as('listPaiements');
    cy.visit('/locataire');
    cy.contains('.tenant-card', nomLocataire, { timeout: 10000 }).find('.tenant-kebab').click();
    cy.contains('.action-sheet-button', 'Documents & Reçus', { timeout: 10000 }).click();
    cy.wait('@listPaiements');
    cy.contains('.docs-hub-section__title', 'Contrat de bail').should('be.visible');
    cy.contains('.docs-hub-section__title', 'Reçu de caution').should('be.visible');
    cy.contains('.docs-hub-section__title', 'Reçus de loyer').should('be.visible');

    // Aperçu intégré à la page (iframe), plus dans un nouvel onglet --
    // c'est ce qui permet d'accoler le bouton d'envoi AU document lui-même.
    cy.contains('.docs-hub-section', 'Contrat de bail').contains('button', 'Aperçu').click();
    cy.wait('@bailPdf').its('response.statusCode').should('eq', 200);
    cy.get('.pdf-preview-modal__frame').should('be.visible');
    // Pas d'envoi serveur réel pour le contrat (contrairement à la caution) --
    // aucun bouton "Envoyer par e-mail" trompeur ne doit apparaître ici.
    cy.contains('button', 'Envoyer par e-mail').should('not.exist');
  });

  it('prévisualise et envoie le reçu de caution par e-mail depuis son aperçu', () => {
    cy.intercept('GET', '**/occupants/*/caution/recu/').as('recuCaution');
    cy.intercept('POST', '**/occupants/*/caution/envoyer/').as('envoyerCaution');
    cy.visit('/locataire');
    cy.contains('.tenant-card', nomLocataire, { timeout: 10000 }).find('.tenant-kebab').click();
    cy.contains('.action-sheet-button', 'Documents & Reçus', { timeout: 10000 }).click();
    // Caution renseignée à la création -> le bouton Aperçu doit être actif.
    cy.contains('.docs-hub-section', 'Reçu de caution').contains('button', 'Aperçu').should('not.be.disabled').click();
    cy.wait('@recuCaution').its('response.statusCode').should('eq', 200);
    cy.get('.pdf-preview-modal__frame').should('be.visible');
    cy.contains('button', 'Envoyer par e-mail', { timeout: 10000 }).click();
    cy.wait('@envoyerCaution').its('response.statusCode').should('eq', 200);
  });

  it('enregistre un paiement de loyer depuis le bouton principal de la carte', () => {
    // Revisite la liste -- le test précédent laisse le hub Documents & Reçus
    // et son aperçu ouverts, ce qui bloquerait sinon le clic sur la carte.
    cy.visit('/locataire');
    cy.contains('.tenant-card', nomLocataire, { timeout: 10000 }).contains('button', '💳 Paiement').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/paiement');

    // La modale s'ouvre pré-remplie pour ce locataire précis (openOccupantId).
    cy.contains('.pay-modal__title', 'Nouveau paiement').should('be.visible');
    cy.intercept('POST', '**/paiements/').as('creerPaiement');
    // Scopé à .pay-modal : sans ça, le sélecteur peut matcher le bouton
    // "+ Enregistrer paiement" resté dans la carte sous la modale.
    cy.get('.pay-modal').contains('button', 'Confirmer').click();
    cy.wait('@creerPaiement').its('response.statusCode').should('eq', 201);
  });

  it('enregistre une dépense sur le logement', () => {
    cy.visit('/logement');
    cy.contains('.logement-card', nomLogement).contains('button', 'Voir les compartiments').click();
    cy.location('pathname', { timeout: 10000 }).should('match', /\/logement\/\d+$/);
    cy.contains('button', 'Dépenses').click();

    cy.get('input[placeholder="Ex : Réparation plomberie"]').type('Peinture E2E');
    cy.get('input[placeholder="0"]').type('15000');
    cy.contains('button', 'Ajouter la dépense').click();
    cy.contains('Peinture E2E', { timeout: 10000 }).should('be.visible');
  });

  it('exporte le récapitulatif comptable en Excel et en CSV', () => {
    cy.visit('/paiement');
    cy.intercept('GET', '**/export/recapitulatif-annuel/**export_format=xlsx**').as('exportXlsx');
    cy.contains('📊 Export comptable').parent().parent()
      .find('select').first().select('Récapitulatif annuel');
    cy.contains('button', 'Excel (.xlsx)').click();
    cy.wait('@exportXlsx').its('response.statusCode').should('eq', 200);

    cy.intercept('GET', '**/export/recapitulatif-annuel/**export_format=csv**').as('exportCsv');
    cy.contains('button', 'CSV').click();
    cy.wait('@exportCsv').its('response.statusCode').should('eq', 200);
  });
});
