import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ApiConfigProvider, useApiConfig } from './contexts/ApiConfigContext';
import { ApiConfigModal } from './components/ApiConfigModal';
import MainLayout from './layouts/MainLayout';
import { Button } from './components/ui/button';

// Page Components
import RoutesPage from './pages/RoutesPage';
import RouteCreatePage from './pages/RouteCreatePage';
import RouteEditPage from './pages/RouteEditPage';

const HomePage = () => <MainLayout><div>Home Page Content - Placeholder</div></MainLayout>;
const ServicesPage = () => <MainLayout><div>Services Page Content - Placeholder</div></MainLayout>;
const UpstreamsPage = () => <MainLayout><div>Upstreams Page Content - Placeholder</div></MainLayout>;
const ConsumersPage = () => <MainLayout><div>Consumers Page Content - Placeholder</div></MainLayout>;


// Settings Page Component
const SettingsPage = () => {
  const { openConfigModal } = useApiConfig();
  return (
    <MainLayout>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>
        <p className="mb-4">Manage your APISIX Admin API configuration here.</p>
        <Button onClick={openConfigModal}>Configure API Connection</Button>
      </div>
    </MainLayout>
  );
};

const AppContent: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/create" element={<RouteCreatePage />} />
        <Route path="/routes/edit/:routeId" element={<RouteEditPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/upstreams" element={<UpstreamsPage />} />
        <Route path="/consumers" element={<ConsumersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <ApiConfigModal />
    </>
  );
};

function App() {
  return (
    <Router>
      <ApiConfigProvider>
        <AppContent />
      </ApiConfigProvider>
    </Router>
  );
}

export default App;
