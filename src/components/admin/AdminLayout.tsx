import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import './AdminLayout.css';

// Coquille générique pour une section admin : titre + barre d'onglets +
// zone de contenu. Aucune logique métier GimmoPro ici — les onglets sont
// injectés par l'appelant (voir src/pages/admin/adminNav.ts) — c'est ce qui
// rend ce composant réemployable tel quel dans un autre projet.

export interface AdminTab {
  path: string;
  label: string;
  exact?: boolean;
}

interface AdminLayoutProps {
  title: string;
  tabs: AdminTab[];
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, tabs, children }) => {
  const history = useHistory();
  const location = useLocation();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="admin-layout-content">
        <div className="admin-tabs">
          {tabs.map(tab => {
            const active = tab.exact ? location.pathname === tab.path : location.pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                className={`admin-tab ${active ? 'admin-tab--active' : ''}`}
                onClick={() => history.push(tab.path)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="g-page admin-page-body">
          {children}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminLayout;
