/** Numéro camerounais typique saisi sans indicatif (9 chiffres) → on préfixe 237.
 *  Heuristique : le champ téléphone n'a aujourd'hui aucun format imposé côté modèle. */
export const toWhatsAppNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9) return `237${digits}`;
  return digits.replace(/^0+/, '237');
};

export const openWhatsApp = (telephone: string, message: string): void => {
  const numero = toWhatsAppNumber(telephone);
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(message)}`, '_blank');
};
