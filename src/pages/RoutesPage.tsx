import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useApiConfig } from '../contexts/ApiConfigContext';
import { getApiService } from '../services/api';
import { Button } from '../components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog'; // Import the dialog

// Define the structure of a Route object based on APISIX Admin API
interface ApiSixRoute {
  id: string;
  name?: string;
  uri?: string;
  uris?: string[];
  methods?: string[];
  status?: number;
  upstream_id?: string;
  service_id?: string;
  script?: unknown;
  plugins?: Record<string, unknown>;
  desc?: string;
  create_time?: number;
  update_time?: number;
}

interface ApiSixRouteNode {
    key: string;
    value: ApiSixRoute;
    modifiedIndex?: number;
    createdIndex?: number;
}

interface ApiSixRoutesListResponse {
  total: number;
  list: ApiSixRouteNode[];
  error_msg?: string;
}


const RoutesPage: React.FC = () => {
  const { apiConfig, openConfigModal } = useApiConfig();
  const apiService = apiConfig ? getApiService(apiConfig) : getApiService(null);
  const navigate = useNavigate();

  const [routes, setRoutes] = useState<ApiSixRouteNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation loading state
  const [error, setError] = useState<string | null>(null);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<ApiSixRoute | null>(null);


  const fetchRoutes = useCallback(async () => {
    if (!apiConfig) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get<ApiSixRoutesListResponse>(`/routes?page=${currentPage}&page_size=${pageSize}`);
      if (data && data.list) {
        setRoutes(data.list);
        setTotalRoutes(data.total || data.list.length);
      } else if (data && data.error_msg) {
        setError(data.error_msg);
        setRoutes([]);
        setTotalRoutes(0);
      } else {
        setRoutes([]);
        setTotalRoutes(0);
        setError("Received an unexpected response format from the server.");
      }
    } catch (err) {
      console.error('Failed to fetch routes:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setRoutes([]);
      setTotalRoutes(0);
    } finally {
      setIsLoading(false);
    }
  }, [apiConfig, currentPage, pageSize, apiService]);

  useEffect(() => {
    if (apiConfig) {
        fetchRoutes();
    }
  }, [fetchRoutes, apiConfig]);

  const handleCreateRoute = () => {
    navigate('/routes/create');
  };

  const handleEditRoute = (routeId: string) => {
    navigate(`/routes/edit/${routeId}`);
  };

  const openDeleteConfirmation = (route: ApiSixRoute) => {
    setRouteToDelete(route);
    setShowDeleteDialog(true);
  };

  const confirmDeleteRoute = async () => {
    if (!apiConfig || !routeToDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      await apiService.delete(`/routes/${routeToDelete.id}`);
      setShowDeleteDialog(false);
      setRouteToDelete(null);
      fetchRoutes(); // Refresh the list
    } catch (err) {
      console.error(`Failed to delete route ${routeToDelete.id}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to delete route.');
      // Keep dialog open on error to show feedback or let user retry/cancel
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalRoutes / pageSize);

  if (!apiConfig && !isLoading) {
    return (
      <MainLayout>
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">API Configuration Required</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">Please set up your APISIX Admin API connection to view and manage routes.</p>
          <Button onClick={openConfigModal}>Configure API Connection</Button>
        </div>
      </MainLayout>
    );
  }


  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">Routes Management</h1>
        <Button onClick={handleCreateRoute} disabled={!apiConfig || isLoading}>
          <PlusCircle className="h-5 w-5 mr-2" />
          Create Route
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading && !routes.length ? (
        <div className="flex justify-center items-center h-64">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading routes...</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
            <Table>
              <TableCaption className="py-4 text-base">
                Displaying {routes.length} of {totalRoutes} routes. Page {currentPage} of {totalPages}.
              </TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableHead>Name/ID</TableHead>
                  <TableHead>URIs</TableHead>
                  <TableHead>Methods</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((routeNode) => (
                  <TableRow key={routeNode.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <TableCell>
                        <div className="font-semibold text-sky-600 dark:text-sky-400">{routeNode.value.name || routeNode.value.id}</div>
                        {routeNode.value.name && <div className="text-xs text-gray-500 dark:text-gray-400">ID: {routeNode.value.id}</div>}
                        {routeNode.value.desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate max-w-xs" title={routeNode.value.desc}>{routeNode.value.desc}</div>}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300 text-sm break-all max-w-md">
                        {(routeNode.value.uris || [routeNode.value.uri]).filter(u => u).join(', ') || <span className="text-gray-400 italic">Not set</span>}
                    </TableCell>
                    <TableCell>
                      {routeNode.value.methods && routeNode.value.methods.length > 0 ? (
                        routeNode.value.methods.map(method => (
                          <Badge key={method} variant="secondary" className="mr-1 mb-1 text-xs">{method}</Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs">ANY</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={routeNode.value.status === 1 ? 'success' : 'destructive'} className="text-xs">
                        {routeNode.value.status === 1 ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300 text-sm">
                        {routeNode.value.upstream_id && <div title={routeNode.value.upstream_id}>Upstream: <span className="font-mono text-xs">{routeNode.value.upstream_id.substring(0,15)+(routeNode.value.upstream_id.length > 15 ? '...' : '')}</span></div>}
                        {routeNode.value.service_id && <div title={routeNode.value.service_id}>Service: <span className="font-mono text-xs">{routeNode.value.service_id.substring(0,15)+(routeNode.value.service_id.length > 15 ? '...' : '')}</span></div>}
                        {(!routeNode.value.upstream_id && !routeNode.value.service_id && routeNode.value.script) && <Badge variant="info" className="text-xs">Custom Script</Badge>}
                        {(!routeNode.value.upstream_id && !routeNode.value.service_id && !routeNode.value.script) && <span className="text-gray-400 italic">None</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditRoute(routeNode.value.id)} title="Edit Route" className="hover:text-sky-600 dark:hover:text-sky-400" disabled={isDeleting}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteConfirmation(routeNode.value)} disabled={isDeleting} title="Delete Route" className="hover:text-red-600 dark:hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {routes.length === 0 && !isLoading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-10">
                            <h3 className="text-lg font-semibold">No routes found.</h3>
                            <p className="text-sm">Try adjusting your filters or create a new route.</p>
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    Total Routes: {totalRoutes}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading || isDeleting}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700 dark:text-gray-300 px-2 py-1 border rounded-md dark:border-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading || isDeleting}
                  >
                    Next
                  </Button>
                  <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="p-2 h-9 border border-input bg-background rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-ring"
                      disabled={isLoading || isDeleting}
                    >
                      {[10, 20, 50, 100].map(size => (
                        <option key={size} value={size}>Show {size}</option>
                      ))}
                    </select>
                </div>
            </div>
          )}
        </>
      )}
       <ConfirmDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
            if (!isDeleting) { // Only allow close if not actively deleting
                 setShowDeleteDialog(false);
                 setRouteToDelete(null);
            }
        }}
        onConfirm={confirmDeleteRoute}
        title="Delete Route"
        description={`Are you sure you want to delete the route${routeToDelete?.name ? ` "${routeToDelete.name}"` : ''} (ID: ${routeToDelete?.id || ''})?`}
        itemName={routeToDelete?.name || routeToDelete?.id}
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};

export default RoutesPage;
