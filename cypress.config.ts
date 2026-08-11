import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // 127.0.0.1, pas localhost : le backend local tourne sur 127.0.0.1:8000
    // (voir .env.local) et l'auth par cookie (SameSite) exige que frontend
    // et backend soient vus sous le même hôte -- vite.config.ts fixe donc
    // aussi server.host sur 127.0.0.1.
    baseUrl: "http://127.0.0.1:5173",
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