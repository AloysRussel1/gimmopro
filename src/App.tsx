import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import './index.css';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import LogementPage from './pages/LogementPage';
import LogementDetails from './pages/LogementDetails';
import CompartimentDetailsPage from './pages/CompartimentDetails';
import AddCompartimentForm from './components/AddCompartimentForm';
import AddLogementForm from './components/AddLogementForm';
import TenantManagement from './pages/TenantManagement';


/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
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
          <Route path="/" component={Dashboard} exact />
          <Route path="/dashboard" component={Dashboard} exact />
          <Route path="/logement" component={LogementPage} exact />
          <Route path="/logement/:id" component={LogementDetails} exact />
          <Route path="/compartiment/:id" component={CompartimentDetailsPage} exact />
          <Route path="/ajouter-compartiment" component={AddCompartimentForm} exact />
          <Route path="/ajouter-logement" component={AddLogementForm} exact/>
          <Route path="/locataire" component={TenantManagement} exact/>
          {/* Redirection si nécessaire */}
          <Redirect exact from="/" to="/dashboard" />
        </IonRouterOutlet>
      </IonReactRouter> 
    </div>
  </IonApp>
);

export default App;
