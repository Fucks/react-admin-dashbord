import React from 'react';
import MainLayout from '../layouts/MainLayout';
import RouteForm from '../components/routes/RouteForm';
import { useParams } from 'react-router-dom';

const RouteEditPage: React.FC = () => {
  const { routeId } = useParams<{ routeId: string }>();

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Edit Route</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Modify the configuration for route: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{routeId}</span>
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 md:p-8">
        <RouteForm mode="edit" />
      </div>
    </MainLayout>
  );
};

export default RouteEditPage;
