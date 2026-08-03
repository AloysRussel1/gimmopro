import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    // Les composants Ionic (IonActionSheet, etc.) rendent une partie de leur
    // contenu (ex: les boutons du menu d'actions) dans un Shadow DOM --
    // sans ça, Cypress ne peut pas du tout les sélectionner.
    includeShadowDom: true,
    defaultCommandTimeout: 8000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});