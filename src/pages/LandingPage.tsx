import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  FiHome, FiUnlock, FiFileText, FiCreditCard, FiAlertTriangle, FiBarChart2, FiArrowRight,
} from 'react-icons/fi';
import '../assets/css/LandingPage.css';

const FEATURES = [
  {
    icon: FiHome,
    title: 'Multi-logements & compartiments',
    text: "Gérez plusieurs immeubles — appartements, studios, chambres, boutiques — depuis un seul tableau de bord.",
  },
  {
    icon: FiUnlock,
    title: 'Statut automatique',
    text: "Chaque compartiment passe à « Occupé » ou « Libre » tout seul, dès qu'un locataire entre ou sort.",
  },
  {
    icon: FiFileText,
    title: 'Contrats & reçus PDF',
    text: "Contrat de bail et reçu de paiement générés en un clic, prêts à imprimer ou à envoyer.",
  },
  {
    icon: FiCreditCard,
    title: 'Paiements multi-mois',
    text: "Enregistrez 1, 3, 6 ou 12 mois de loyer d'un coup — la prochaine échéance se calcule seule.",
  },
  {
    icon: FiAlertTriangle,
    title: 'Alertes de retard',
    text: "Repérez en un coup d'œil les locataires en retard de paiement, sans avoir à éplucher un tableau.",
  },
  {
    icon: FiBarChart2,
    title: 'Dashboard temps réel',
    text: "Revenus du mois, taux d'occupation, rapport mensuel téléchargeable en PDF.",
  },
];

const YEAR = new Date().getFullYear();

const LandingPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="lp-content" scrollY>
        <div className="lp-bg"><div className="lp-blob" /></div>

        {/* Barre du haut */}
        <div className="lp-topbar g-animate">
          <div className="lp-topbar__brand">
            <div className="lp-topbar__mark">G</div>
            <span className="lp-topbar__name">Gimmopro</span>
          </div>
          <button className="lp-topbar__login" onClick={() => history.push('/login')}>
            Se connecter
          </button>
        </div>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-badge g-animate g-animate--1">
            <span>✨</span> Conçu pour les propriétaires indépendants
          </div>
          <h1 className="lp-headline g-animate g-animate--2">
            Gérez vos biens immobiliers<br />en toute simplicité.
          </h1>
          <p className="lp-sub g-animate g-animate--3">
            Conçu pour simplifier la gestion des logements, baux, quittances et suivis
            financiers des propriétaires indépendants.
          </p>
          <div className="lp-cta-row g-animate g-animate--4">
            <button className="g-btn g-btn--primary lp-cta lp-cta--arrow" onClick={() => history.push('/register')}>
              Essayer gratuitement
              <FiArrowRight className="lp-cta__arrow" aria-hidden="true" />
            </button>
            <button className="g-btn g-btn--outline lp-cta" onClick={() => history.push('/login')}>
              Se connecter
            </button>
          </div>
        </section>

        {/* Fonctionnalités */}
        <section className="lp-features" id="fonctionnalites">
          <p className="lp-section-eyebrow">Ce que Gimmopro gère déjà pour vous</p>
          <div className="lp-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`lp-feature-card g-animate g-animate--${Math.min(i + 1, 5)}`}>
                <span className="lp-feature-card__icon-wrap">
                  <f.icon aria-hidden="true" />
                </span>
                <h3 className="lp-feature-card__title">{f.title}</h3>
                <p className="lp-feature-card__text">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="lp-final">
          <h2 className="lp-final__title">Prêt à reprendre le contrôle de vos loyers ?</h2>
          <p className="lp-final__sub">Créez votre compte en moins de deux minutes — aucune carte bancaire requise.</p>
          <button className="g-btn g-btn--primary lp-final__cta lp-cta--arrow" onClick={() => history.push('/register')}>
            Créer mon compte gratuitement
            <FiArrowRight className="lp-cta__arrow" aria-hidden="true" />
          </button>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-footer__top">
            <div className="lp-footer__brand">
              <div className="lp-footer__logo">
                <div className="lp-footer__mark">G</div>
                <span className="lp-footer__name">Gimmopro</span>
              </div>
              <p className="lp-footer__tagline">Gérez vos biens en toute élégance, du premier locataire au centième.</p>
            </div>

            <div className="lp-footer__col">
              <p className="lp-footer__heading">Produit</p>
              <a className="lp-footer__link" href="#fonctionnalites">Fonctionnalités</a>
              <a className="lp-footer__link" href="#" onClick={e => e.preventDefault()}>Tarifs</a>
              <a className="lp-footer__link" href="#" onClick={e => e.preventDefault()}>Gestion multi-logements</a>
              <a className="lp-footer__link" href="#" onClick={e => e.preventDefault()}>Édition de baux</a>
            </div>

            <div className="lp-footer__col">
              <p className="lp-footer__heading">Support &amp; Légal</p>
              <a className="lp-footer__link" href="#" onClick={e => e.preventDefault()}>Centre d'aide</a>
              <a className="lp-footer__link" href="/cgu" onClick={e => { e.preventDefault(); history.push('/cgu'); }}>Conditions d'utilisation</a>
              <a className="lp-footer__link" href="/confidentialite" onClick={e => { e.preventDefault(); history.push('/confidentialite'); }}>Politique de confidentialité</a>
              <a className="lp-footer__link" href="#" onClick={e => e.preventDefault()}>Contact</a>
            </div>
          </div>

          <div className="lp-footer__divider" />

          <div className="lp-footer__bottom">
            <span>© {YEAR} Gimmopro. Tous droits réservés.</span>
            <span>Gérez vos biens en toute élégance</span>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;
