import React from 'react';
import PhoneInputBase from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '../../assets/css/PhoneInput.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

// Encapsule react-phone-number-input (sélecteur pays + drapeau + formatage
// E.164 en direct) derrière la même interface value/onChange qu'un <input>
// contrôlé classique, pour remplacer un simple <input type="tel"> sans
// changer la logique de formulaire autour. CM (Cameroun) par défaut --
// cohérent avec l'usage réel du projet -- mais n'importe quel pays reste
// sélectionnable au clic sur le drapeau.
const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, placeholder, required }) => (
  <PhoneInputBase
    international
    defaultCountry="CM"
    value={value || undefined}
    onChange={(v) => onChange(v || '')}
    placeholder={placeholder}
    required={required}
    className="g-phone-input"
    // Le placeholder par défaut de la lib dépend du pays sélectionné (donc
    // pas un sélecteur stable pour les tests E2E) -- data-testid fixe sur
    // l'input réel via numberInputProps (voir parcours_complet.cy.ts).
    numberInputProps={{ 'data-testid': 'phone-input' } as React.InputHTMLAttributes<HTMLInputElement>}
  />
);

export default PhoneInput;
