import React from 'react';
import LoadingSpinner from './LoadingSpinner';

/** Uniformise le ternaire "loading ? ... : error ? ... : contenu" répété sur
 * quasiment chaque page qui charge des données au montage. `skeleton`
 * permet de passer un <SkeletonLoader variant="..." /> qui épouse la forme
 * du contenu final ; sans lui, retombe sur un simple spinner. */
const AsyncBoundary: React.FC<{
  loading: boolean;
  error?: boolean;
  errorMessage?: string;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}> = ({ loading, error, errorMessage, skeleton, children }) => {
  if (loading) return <>{skeleton ?? <LoadingSpinner />}</>;
  if (error) return <div className="g-empty"><p className="g-empty__text">{errorMessage || 'Impossible de charger'}</p></div>;
  return <>{children}</>;
};

export default AsyncBoundary;
