import React, { useState, useEffect } from 'react';
import { useApiConfig } from '../contexts/ApiConfigContext';
import { Button } from './ui/button'; // Assuming you have a Button component

// Basic Modal and Input components (replace with your actual UI library components if available)
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input id={id} {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
  </div>
);


export const ApiConfigModal: React.FC = () => {
  const { apiConfig, setApiConfig, isConfigModalOpen, closeConfigModal } = useApiConfig();
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (apiConfig) {
      setBaseUrl(apiConfig.baseUrl);
      setApiKey(apiConfig.apiKey);
    } else {
      // Default values if no config is stored yet
      setBaseUrl('http://127.0.0.1:9180/apisix/admin');
      setApiKey('');
    }
  }, [apiConfig, isConfigModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (baseUrl && apiKey) {
      setApiConfig({ baseUrl, apiKey });
    } else {
      alert('Please fill in both Base URL and API Key.');
    }
  };

  return (
    <Modal isOpen={isConfigModalOpen} onClose={closeConfigModal} title="APISIX Admin API Configuration">
      <form onSubmit={handleSubmit}>
        <Input
          label="Admin API Base URL"
          id="baseUrl"
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="e.g., http://127.0.0.1:9180/apisix/admin"
          required
        />
        <Input
          label="X-API-KEY"
          id="apiKey"
          type="password" // Use password type for API keys
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your APISIX Admin API Key"
          required
        />
        <div className="flex justify-end space-x-2 mt-6">
          <Button type="button" variant="outline" onClick={closeConfigModal}>
            Cancel
          </Button>
          <Button type="submit">
            Save Configuration
          </Button>
        </div>
      </form>
    </Modal>
  );
};
