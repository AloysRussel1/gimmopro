import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import './index.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import LogementPage from './pages/LogementPage';
import LogementDetails from './pages/LogementDetails';
import CompartimentDetailsPage from './pages/CompartimentDetails';
import AddCompartimentForm from './components/AddCompartimentForm';
import AddLogementForm from './components/AddLogementForm';
import TenantManagement from './pages/TenantManagement';
import AddTenantForm from './components/AddTenantForm';
import PaymentManagement from './pages/PaymentManagement';
import PaymentHistory from './pages/PaymentHistory';

/* Core CSS required for Ionic components to work properly */
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

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <Navbar />
    <div className="content-container">
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Routes */}
          <Route path="/" component={LogementPage} exact />
          <Route path="/dashboard" component={Dashboard} exact />
          <Route path="/logement" component={LogementPage} exact />
          <Route path="/logement/:id" component={LogementDetails} exact />
          <Route path="/compartiment/:id" component={CompartimentDetailsPage} exact />
          <Route path="/logement/:logement_id/ajouter-compartiment" component={AddCompartimentForm} exact />
          <Route path="/ajouter-logement" component={AddLogementForm} exact />
          <Route path="/locataire" component={TenantManagement} exact />
          <Route path="/ajouter-locataire" component={AddTenantForm} exact />
          <Route path="/paiement" component={PaymentManagement} exact />
          <Route path="/historique/:id" component={PaymentHistory} exact />
          
          {/* Redirection si nécessaire */}
          <Redirect exact from="/" to="/logement" />
        </IonRouterOutlet>
      </IonReactRouter>
    </div>
    <Footer /> {/* Footer en bas de la page */}
  </IonApp>
);

export default App;
