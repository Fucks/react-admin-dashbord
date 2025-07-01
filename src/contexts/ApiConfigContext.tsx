import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

interface ApiConfigContextType {
  apiConfig: ApiConfig | null;
  setApiConfig: (config: ApiConfig) => void;
  isConfigModalOpen: boolean;
  openConfigModal: () => void;
  closeConfigModal: () => void;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

export const ApiConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiConfig, setApiConfigState] = useState<ApiConfig | null>(() => {
    const storedConfig = localStorage.getItem('apiConfig');
    return storedConfig ? JSON.parse(storedConfig) : null;
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const setApiConfig = (config: ApiConfig) => {
    localStorage.setItem('apiConfig', JSON.stringify(config));
    setApiConfigState(config);
    closeConfigModal();
  };

  const openConfigModal = () => setIsConfigModalOpen(true);
  const closeConfigModal = () => setIsConfigModalOpen(false);

  return (
    <ApiConfigContext.Provider value={{ apiConfig, setApiConfig, isConfigModalOpen, openConfigModal, closeConfigModal }}>
      {children}
    </ApiConfigContext.Provider>
  );
};

export const useApiConfig = (): ApiConfigContextType => {
  const context = useContext(ApiConfigContext);
  if (context === undefined) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
};
