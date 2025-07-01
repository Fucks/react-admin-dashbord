import { useApiConfig } from '../contexts/ApiConfigContext';

// A wrapper hook to get memoized API config or throw if not available
const useApiClient = () => {
  const { apiConfig } = useApiConfig();
  if (!apiConfig) {
    // This should ideally not be reached if App.tsx correctly gates content
    // or if components that need the API always check for apiConfig first.
    console.error('API configuration is not available. Please configure it in Settings.');
    // Optionally, you could throw an error or return a dummy client that always fails.
    // For now, we'll proceed, but API calls will likely fail or use defaults if any.
  }
  return apiConfig;
};

interface RequestOptions extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any; // Allow any body type for now, will be stringified
}

async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  // It's not ideal to call a hook inside a non-React function.
  // Instead, the component calling apiClient should pass the apiConfig.
  // However, for simplicity in this iteration, we'll log a warning.
  // This will be refactored to pass config directly.
  // For now, this function expects `apiConfig` to be passed via options or a higher-order function.

  // This is a placeholder. In a real app, `apiConfig` would be passed to `apiClient`
  // or `apiClient` would be a class instance initialized with the config.
  const getConfig = () => {
    try {
        // This is a workaround and not best practice.
        // Hooks should only be called inside React components or other custom hooks.
        // This will be addressed in a refactor.
        // For now, we try to get it from localStorage directly if not passed.
        const storedConfig = localStorage.getItem('apiConfig');
        return storedConfig ? JSON.parse(storedConfig) : null;
    } catch (e) {
        console.warn("Could not retrieve API config for direct apiClient call. This may lead to errors.");
        return null;
    }
  };

  const currentApiConfig = (options as RequestOptions & { _internalApiConfig?: ReturnType<typeof useApiClient> })._internalApiConfig || getConfig();


  if (!currentApiConfig?.baseUrl || !currentApiConfig?.apiKey) {
    console.error('API client called without proper configuration.');
    throw new Error('API Base URL or API Key is not configured. Please configure it in Settings.');
  }

  const { baseUrl, apiKey } = currentApiConfig;
  const url = `${baseUrl}${endpoint}`;

  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    ...(options.headers || {}),
  });

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error: any = new Error(errorData.message || `API request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      // Handle No Content response
      return undefined as T;
    }

    const data = await response.json();
    return data as T;

  } catch (error) {
    console.error('API Client Error:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Example usage for fetching routes (to be used in RoutesPage.tsx)
/*
export const getRoutes = (apiConfig: ReturnType<typeof useApiClient>) => {
  if (!apiConfig) throw new Error("API Config not available for getRoutes");
  return apiClient<any[]>('/routes', { _internalApiConfig: apiConfig });
};
*/

// Updated approach: Export a factory that takes apiConfig
export const getApiService = (apiConfig: ReturnType<typeof useApiClient>) => {
    if (!apiConfig) {
        // Return a version of the service that will always throw or indicate misconfiguration
        return {
            get: async <T>(_endpoint: string, _options?: Omit<RequestOptions, '_internalApiConfig'>): Promise<T> => {
                throw new Error('APIService not configured. Please set API credentials in Settings.');
            },
            post: async <T>(_endpoint: string, _body: unknown, _options?: Omit<RequestOptions, '_internalApiConfig'>): Promise<T> => {
                 throw new Error('APIService not configured. Please set API credentials in Settings.');
            },
            put: async <T>(_endpoint: string, _body: unknown, _options?: Omit<RequestOptions, '_internalApiConfig'>): Promise<T> => {
                 throw new Error('APIService not configured. Please set API credentials in Settings.');
            },
            patch: async <T>(_endpoint: string, _body: unknown, _options?: Omit<RequestOptions, '_internalApiConfig'>): Promise<T> => {
                 throw new Error('APIService not configured. Please set API credentials in Settings.');
            },
            delete: async <T>(_endpoint: string, _options?: Omit<RequestOptions, '_internalApiConfig'>): Promise<T> => {
                 throw new Error('APIService not configured. Please set API credentials in Settings.');
            },
        };
    }

    return {
        get: <T>(endpoint: string, options?: Omit<RequestOptions, '_internalApiConfig'>) =>
            apiClient<T>(endpoint, { ...options, method: 'GET', _internalApiConfig: apiConfig }),
        post: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, '_internalApiConfig'>) =>
            apiClient<T>(endpoint, { ...options, method: 'POST', body, _internalApiConfig: apiConfig }),
        put: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, '_internalApiConfig'>) =>
            apiClient<T>(endpoint, { ...options, method: 'PUT', body, _internalApiConfig: apiConfig }),
        patch: <T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, '_internalApiConfig'>) =>
            apiClient<T>(endpoint, { ...options, method: 'PATCH', body, _internalApiConfig: apiConfig }),
        delete: <T>(endpoint: string, options?: Omit<RequestOptions, '_internalApiConfig'>) =>
            apiClient<T>(endpoint, { ...options, method: 'DELETE', _internalApiConfig: apiConfig }),
    };
};


export default apiClient;
