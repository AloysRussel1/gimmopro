import React, { useRef, useState } from 'react';
import '../../assets/css/AddressAutocomplete.css';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
}

// Autocomplétion d'adresse via Nominatim (OpenStreetMap) -- gratuit, sans
// clé API, mais soumis à une politique d'usage stricte (~1 req/s, pas conçu
// pour de la frappe-par-frappe en prod à grande échelle). On reste dans les
// clous avec un debounce de 450ms ET un minimum de 3 caractères avant toute
// requête -- suffisant pour l'usage réel de l'app (quelques logements créés
// de temps en temps, pas un moteur de recherche à fort trafic). Le champ
// reste un <input> texte simple si l'utilisateur préfère taper l'adresse à
// la main : aucune sélection dans la liste n'est obligatoire.
const DEBOUNCE_MS = 450;
const MIN_CHARS = 3;

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ value, onChange, placeholder, required }) => {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number>();

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data: NominatimResult[] = res.ok ? await res.json() : [];
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        // Recherche best-effort -- une erreur réseau ne doit jamais bloquer
        // la saisie manuelle, juste faire disparaître les suggestions.
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);
  };

  const handleSelect = (s: NominatimResult) => {
    onChange(s.display_name);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="g-address-autocomplete">
      <input
        className="g-input"
        value={value}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onChange={e => {
          onChange(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => setOpen(suggestions.length > 0)}
        // onMouseDown (pas onClick) sur les suggestions : mousedown se
        // déclenche AVANT le blur de l'input, donc avant que la liste ne se
        // referme -- sinon le clic sur une suggestion ne serait jamais reçu.
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <ul className="g-address-autocomplete__list">
          {suggestions.map(s => (
            <li key={s.place_id} onMouseDown={() => handleSelect(s)}>
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
