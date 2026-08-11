import React from 'react';

type SkeletonVariant = 'stat-cards' | 'cards' | 'table-rows';

/** Placeholder animé qui épouse la forme du contenu final (au lieu d'un
 * simple spinner générique) -- réduit le "saut" visuel au chargement et
 * donne un rendu plus soigné sur les pages à fort trafic (Dashboard,
 * Locataires, Paiements, Logements). `count` contrôle le nombre de blocs
 * répétés (cartes, lignes...). */
const SkeletonLoader: React.FC<{ variant: SkeletonVariant; count?: number }> = ({ variant, count }) => {
  if (variant === 'stat-cards') {
    return (
      <div className="skel-stat-grid" aria-hidden="true">
        {Array.from({ length: count ?? 4 }).map((_, i) => (
          <div className="skel-stat-card" key={i}>
            <div className="skel-block skel-block--label" />
            <div className="skel-block skel-block--value" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table-rows') {
    return (
      <div className="skel-rows" aria-hidden="true">
        {Array.from({ length: count ?? 6 }).map((_, i) => (
          <div className="skel-row" key={i}>
            <div className="skel-block skel-block--circle" />
            <div className="skel-row__lines">
              <div className="skel-block skel-block--line-wide" />
              <div className="skel-block skel-block--line-narrow" />
            </div>
            <div className="skel-block skel-block--pill" />
          </div>
        ))}
      </div>
    );
  }

  // 'cards'
  return (
    <div className="skel-cards" aria-hidden="true">
      {Array.from({ length: count ?? 3 }).map((_, i) => (
        <div className="skel-card" key={i}>
          <div className="skel-block skel-block--line-wide" />
          <div className="skel-block skel-block--line-narrow" />
          <div className="skel-card__footer">
            <div className="skel-block skel-block--pill" />
            <div className="skel-block skel-block--pill" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
