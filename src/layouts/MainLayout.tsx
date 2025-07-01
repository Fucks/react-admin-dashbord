import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApiConfig } from '../contexts/ApiConfigContext';
import { Button } from '../components/ui/button'; // Assuming you have a Button component

interface MainLayoutProps {
  children: ReactNode;
}

const NavLink: React.FC<{ to: string; children: ReactNode }> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== '/');

  return (
    <Link
      to={to}
      className={`block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 hover:text-white ${
        isActive ? 'bg-sky-500 text-white' : 'text-gray-300'
      }`}
    >
      {children}
    </Link>
  );
};


const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { apiConfig, openConfigModal } = useApiConfig();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 dark:bg-gray-800 text-white flex flex-col p-4">
        <div className="text-2xl font-semibold mb-6 px-2">APISIX UI</div>
        <nav className="flex-grow space-y-1">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/routes">Routes</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/upstreams">Upstreams</NavLink>
          <NavLink to="/consumers">Consumers</NavLink>
          {/* Add more navigation links here as needed */}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-700">
          <NavLink to="/settings">Settings</NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {/* Dynamically set page title based on route or props */}
            {location.pathname.split('/').pop()?.replace('-', ' ')?.toUpperCase() || 'Dashboard'}
          </h2>
          {!apiConfig && (
             <Button variant="outline" onClick={openConfigModal}>Configure API</Button>
          )}
        </header>
        <div className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900/50">
          {!apiConfig && location.pathname !== '/settings' ? (
            <div className="text-center mt-10 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3">API Configuration Required</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please configure the APISIX Admin API connection to manage your resources.
              </p>
              <Button onClick={openConfigModal} size="lg">
                Go to Settings &amp; Configure
              </Button>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
