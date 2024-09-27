import React, { useState } from 'react';
import './../assets/css/Navbar.css';
import { FaHome, FaUser, FaClipboardList, FaMoneyBillWave, FaBars, FaTimes } from 'react-icons/fa';
import logo from './../assets/images/gimmopro_logo.png'; // Mettez le chemin vers votre logo ici

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); // État pour gérer l'ouverture du menu

  const toggleMenu = () => {
    setIsOpen(prevState => !prevState); // Inverse l'état d'ouverture
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo-image" />
        <span className="logo">Gimmopro</span>
      </div>
      <button className="menu-toggle" onClick={toggleMenu}>
        {isOpen ? <FaTimes /> : <FaBars />} {/* Affiche une croix ou un menu burger selon l'état */}
      </button>
      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li><a href="/dashboard" onClick={toggleMenu}><FaHome /> Dashboard</a></li>
        <li><a href="/logement" onClick={toggleMenu}><FaClipboardList /> Logements</a></li>
        <li><a href="/locataire" onClick={toggleMenu}><FaUser /> Locataires</a></li>
        <li><a href="/paiement" onClick={toggleMenu}><FaMoneyBillWave /> Paiements</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
