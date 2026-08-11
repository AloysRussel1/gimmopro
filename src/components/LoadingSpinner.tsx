import React from 'react';

/** Spinner générique -- remplace le `<div className="g-loading"><div className="g-spinner" /></div>`
 * dupliqué tel quel dans une dizaine de pages. `label` est optionnel (ex:
 * "Chargement du paiement…") ; `inline` retire le padding/min-height pleine
 * page pour un usage dans un espace plus restreint (ex: bouton, carte). */
const LoadingSpinner: React.FC<{ label?: string; inline?: boolean }> = ({ label, inline = false }) => (
  <div className={inline ? 'g-loading g-loading--inline' : 'g-loading'}>
    <div className="g-spinner" />
    {label && <p className="g-loading__label">{label}</p>}
  </div>
);

export default LoadingSpinner;
