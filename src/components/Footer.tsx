import React from 'react';
import './../assets/css/Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <h3>Liens utiles</h3>
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/logements">Logements</a></li>
            <li><a href="/locataires">Locataires</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h3>Contact</h3>
          <p>Email: support@votreapplication.com</p>
          <p>Téléphone: +33 1 23 45 67 89</p>
        </div>
        <div className="footer-rights">
          <p>&copy; {new Date().getFullYear()} Votre Application. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
