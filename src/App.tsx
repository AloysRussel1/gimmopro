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

const App: React.FC = () => (
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

          <Route exact path="/">
            {isAuthenticated() ? <Redirect to="/dashboard" /> : <LandingPage />}
          </Route>
        </IonRouterOutlet>
      </div>
    </IonReactRouter>
  </IonApp>
);

export default App;