# 🏠 GimmoPro — Application Mobile

> Application mobile de gestion locative · React · Ionic · TypeScript

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![Ionic](https://img.shields.io/badge/Ionic-8-purple?logo=ionic)](https://ionicframework.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue?logo=typescript)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com)

---

## 📱 À propos

GimmoPro est une application mobile-first conçue pour digitaliser la gestion locative. Développée avec Ionic React, elle fonctionne comme une PWA (Progressive Web App) — installable sur iPhone et Android sans passer par l'App Store.

**Cas d'usage réel** : Développée pour un propriétaire camerounais gérant plusieurs immeubles, passant de cahiers manuscrits à une solution numérique accessible depuis son téléphone.

---

## ✨ Fonctionnalités

### 🏠 Logements
- Liste de tous les logements avec statistiques (occupés/libres)
- Détail par logement avec tous les compartiments
- Ajout de compartiments (appartement, studio, chambre, boutique) avec compteurs de pièces interactifs
- Historique d'occupation par compartiment

### 👤 Locataires
- Formulaire d'ajout en 5 étapes avec sélection visuelle du compartiment libre
- Numéro de contrat généré automatiquement
- Filtres par statut (Actif / En retard)
- Modification des informations
- Téléchargement du contrat de bail en PDF
- Enregistrement du départ (libère automatiquement le compartiment)

### 💳 Paiements
- Enregistrement de paiements avec sélection du nombre de mois (1, 2, 3, 6, 12)
- Calcul automatique du montant total
- Téléchargement du reçu de paiement en PDF
- Historique des paiements par locataire

### 📊 Dashboard
- Vue d'ensemble en temps réel
- Alerte visuelle pour les locataires en retard
- Taux d'occupation avec barre de progression colorée
- Téléchargement du rapport mensuel PDF (mois courant et précédent)

### 🔐 Authentification
- Connexion par username **ou** email
- Affichage/masquage du mot de passe
- Création de compte avec validation
- Déconnexion sécurisée avec confirmation

---

## 🛠 Stack technique

| Couche | Technologie |
|--------|------------|
| Framework UI | Ionic React 8 |
| Langage | TypeScript 5.1 |
| Build tool | Vite |
| HTTP Client | Axios avec intercepteurs JWT |
| Routing | React Router v5 |
| Styles | CSS custom (design system dark luxury) |
| Déploiement | Vercel |

---

## 🎨 Design System

L'application utilise un design system custom **dark luxury** :

- **Fond** : `#0A0A0F` — noir profond
- **Accent** : `#C9A84C` — or chaud
- **Typographie** : Playfair Display (titres) + DM Sans (corps)
- **Mobile-first** : Tab bar fixe en bas, cartes optimisées pour le tactile
- **PWA** : Installable sur iOS et Android depuis le navigateur

---

## 🚀 Installation locale

### Prérequis
- Node.js 18+
- npm

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/AloysRussel1/gimmopro.git
cd gimmopro

# 2. Installer les dépendances
npm install

# 3. Configurer l'URL de l'API
# Dans src/api/axiosConfig.ts, mettre :
# baseURL: 'http://localhost:8000/api/'

# 4. Lancer l'application
npm run dev
```

L'application est disponible sur `http://localhost:5173`

> ⚠️ Le backend doit tourner en parallèle. Voir [gimmopro_backend](https://github.com/AloysRussel1/gimmopro_backend)

---

## 📁 Structure du projet

```
src/
├── api/
│   ├── axiosConfig.ts        # Client HTTP avec JWT automatique
│   └── logementService.ts    # Services API
├── assets/css/
│   ├── theme.css             # Design system global
│   ├── Dashboard.css
│   ├── Login.css
│   └── ...
├── components/
│   ├── AddCompartimentForm.tsx
│   ├── AddTenantForm.tsx
│   ├── Navbar.tsx
│   └── ...
└── pages/
    ├── Dashboard.tsx
    ├── LogementPage.tsx
    ├── LogementDetails.tsx
    ├── TenantManagement.tsx
    ├── PaymentManagement.tsx
    ├── Login.tsx
    ├── Register.tsx
    └── ...
```

---

## 📸 Aperçu

| Dashboard | Logements | Locataires | Paiements |
|-----------|-----------|------------|-----------|
| Stats temps réel | Liste + détails | Filtres + PDF | Multi-mois + reçu |
| Alertes retards | Historique occupation | Modification | Rapport mensuel |

---

## 🌐 Démo

**Application** : [gimmopro.vercel.app](https://gimmopro.vercel.app)

> Créez un compte directement depuis l'application pour tester toutes les fonctionnalités.

---

## 🔗 Repos liés

- **Backend API** : [github.com/AloysRussel1/gimmopro_backend](https://github.com/AloysRussel1/gimmopro_backend)

---

## 👨‍💻 Auteur

**Aloys Russel Tonfo**  
Étudiant en Génie informatique — Polytechnique Montréal  
Stack : React · TypeScript · Python · Django · Ionic  
[github.com/AloysRussel1](https://github.com/AloysRussel1)