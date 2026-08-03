import { useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import Navbar from './components/Navbar';
import TopHeader from './components/TopHeader';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Cgu from './pages/Cgu';
import Confidentialite from './pages/Confidentialite';
import Dashboard from './pages/Dashboard';
import LogementPage from './pages/LogementPage';
import LogementDetails from './pages/LogementDetails';
import CompartimentDetailsPage from './pages/CompartimentDetails';
import AddCompartimentForm from './components/AddCompartimentForm';
import AddLogementForm from './components/AddLogementForm';
import TenantManagement from './pages/TenantManagement';
import AddTenantForm from './components/AddTenantForm';
import EtatDesLieuxForm from './pages/EtatDesLieuxForm';
import PaymentManagement from './pages/PaymentManagement';
import PaymentHistory from './pages/PaymentHistory';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminData from './pages/admin/AdminData';
import AdminLogs from './pages/admin/AdminLogs';
import { isAuthenticated } from './api/auth';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './assets/css/theme.css';

setupIonicReact();

const PrivateRoute: React.FC<{ component: React.FC; path: string; exact?: boolean }> = ({
  component: Component, path, exact,
}) => (
  <Route
    path={path}
    exact={exact}
    render={() =>
      isAuthenticated() ? <Component /> : <Redirect to="/login" />
    }
  />
);

const App: React.FC = () => {
  useEffect(() => {
    // <input type="number"> change de valeur (incrémente/décrémente) au
    // simple survol + molette, sans que l'utilisateur ait rien tapé --
    // c'est le mécanisme le plus probable derrière des montants (loyer,
    // caution, paiement) qui semblent "changer tout seuls" de quelques
    // unités. On retire le focus dès qu'une molette est utilisée sur un
    // champ numérique, pour laisser la page défiler normalement au lieu
    // de modifier la valeur -- un seul listener global couvre tous les
    // champs numériques de l'app, présents et futurs.
    const handler = (e: WheelEvent) => {
      const target = document.activeElement;
      if (target instanceof HTMLInputElement && target.type === 'number') {
        target.blur();
      }
    };
    document.addEventListener('wheel', handler, { passive: true });
    return () => document.removeEventListener('wheel', handler);
  }, []);

  return (
  <IonApp>
    <IonReactRouter>
      <TopHeader />
      <Navbar />
      <div className="content-container">
        <IonRouterOutlet>
          <Route path="/login" component={Login} exact />
          <Route path="/register" component={Register} exact />
          <Route path="/mot-de-passe-oublie" component={ForgotPassword} exact />
          <Route path="/reinitialiser-mot-de-passe" component={ResetPassword} exact />
          <Route path="/verifier-email" component={VerifyEmail} exact />
          <Route path="/cgu" component={Cgu} exact />
          <Route path="/confidentialite" component={Confidentialite} exact />

          <PrivateRoute path="/dashboard"  component={Dashboard}   exact />
          <PrivateRoute path="/logement"   component={LogementPage} exact />
          <PrivateRoute path="/logement/:id" component={LogementDetails} exact />
          <PrivateRoute path="/compartiment/:id" component={CompartimentDetailsPage} exact />
          <PrivateRoute path="/logement/:logement_id/ajouter-compartiment" component={AddCompartimentForm} exact />
          <PrivateRoute path="/ajouter-logement" component={AddLogementForm} exact />
          <PrivateRoute path="/locataire"  component={TenantManagement} exact />
          <PrivateRoute path="/ajouter-locataire" component={AddTenantForm} exact />
          <PrivateRoute path="/etat-des-lieux/nouveau" component={EtatDesLieuxForm} exact />
          <PrivateRoute path="/paiement"   component={PaymentManagement} exact />
          <PrivateRoute path="/historique/:id" component={PaymentHistory} exact />
          <PrivateRoute path="/profil" component={ProfilePage} exact />

          <AdminRoute path="/admin"       component={AdminDashboard} exact />
          <AdminRoute path="/admin/users" component={AdminUsers}     exact />
          <AdminRoute path="/admin/data"  component={AdminData}      exact />
          <AdminRoute path="/admin/logs"  component={AdminLogs}      exact />

          <Route exact path="/">
            {isAuthenticated() ? <Redirect to="/dashboard" /> : <LandingPage />}
          </Route>
        </IonRouterOutlet>
      </div>
    </IonReactRouter>
  </IonApp>
  );
};

export default App;