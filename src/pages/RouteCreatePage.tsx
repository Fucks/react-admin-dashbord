import React from 'react';
import MainLayout from '../layouts/MainLayout';
import RouteForm from '../components/routes/RouteForm';

const RouteCreatePage: React.FC = () => {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Create New Route</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Define the configuration for a new APISIX route.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 md:p-8">
        <RouteForm mode="create" />
      </div>
    </MainLayout>
  );
};

export default RouteCreatePage;
