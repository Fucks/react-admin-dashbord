import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiConfig } from '../../contexts/ApiConfigContext';
import { getApiService } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { InfoTooltip } from '../ui/tooltip';
import { Trash2, PlusCircle } from 'lucide-react';

// Simplified Route interface for the form
// Based on APISIX Admin API Route object
interface RouteFormData {
  id?: string;
  name?: string;
  desc?: string;
  uris: string[]; // Changed from string to string[]
  hosts: string[];
  remote_addrs: string[];
  methods: string[];
  priority: number;
  status: number; // 1 for enabled, 0 for disabled
  // upstream?: object; // Complex object, handle separately or simplify
  upstream_id?: string;
  service_id?: string;
  plugin_config_id?: string;
  // plugins?: object; // Complex, handle separately
  // script?: string; // or object
  // filter_func?: string;
  enable_websocket: boolean;
  // labels?: Record<string, string>;
  // timeout?: { connect: number; send: number; read: number };
  // vars?: Array<[string, string, string | number]>; // Example: [["arg_name", "==", "json"]]
}

const initialFormData: RouteFormData = {
  name: '',
  desc: '',
  uris: ['/'],
  hosts: [],
  remote_addrs: [],
  methods: [], // Empty array means all methods
  priority: 0,
  status: 1,
  upstream_id: '',
  service_id: '',
  plugin_config_id: '',
  enable_websocket: false,
};

const availableMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'];

interface RouteFormProps {
  mode: 'create' | 'edit';
}

const RouteForm: React.FC<RouteFormProps> = ({ mode }) => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const { apiConfig } = useApiConfig();
  const apiService = apiConfig ? getApiService(apiConfig) : getApiService(null);

  const [formData, setFormData] = useState<RouteFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRouteData = useCallback(async (id: string) => {
    if (!apiConfig) return;
    setIsLoading(true);
    try {
      const response = await apiService.get<{ value: RouteFormData }>(`/routes/${id}`);
      const routeData = response.value;
      // Ensure array fields are always arrays, even if API returns null or single string
      setFormData({
        ...initialFormData, // Start with defaults to ensure all fields are present
        ...routeData,
        uris: Array.isArray(routeData.uris) ? routeData.uris : (routeData.uris ? [String(routeData.uris)] : []),
        hosts: Array.isArray(routeData.hosts) ? routeData.hosts : [],
        remote_addrs: Array.isArray(routeData.remote_addrs) ? routeData.remote_addrs : [],
        methods: Array.isArray(routeData.methods) ? routeData.methods : [],
        priority: routeData.priority ?? 0,
        status: routeData.status ?? 1,
        enable_websocket: routeData.enable_websocket ?? false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch route details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiConfig, apiService]);

  useEffect(() => {
    if (mode === 'edit' && routeId) {
      fetchRouteData(routeId);
    } else {
      setFormData(initialFormData); // Reset for create mode
    }
  }, [mode, routeId, fetchRouteData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }
    else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: keyof RouteFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generic handler for adding items to array fields
  const handleAddToArrayField = (fieldName: keyof Pick<RouteFormData, 'uris' | 'hosts' | 'remote_addrs'>) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), ''],
    }));
  };

  // Generic handler for updating items in array fields
  const handleArrayFieldChange = (
    fieldName: keyof Pick<RouteFormData, 'uris' | 'hosts' | 'remote_addrs'>,
    index: number,
    value: string
  ) => {
    setFormData(prev => {
      const newArray = [...(prev[fieldName] || [])];
      newArray[index] = value;
      return { ...prev, [fieldName]: newArray };
    });
  };

  // Generic handler for removing items from array fields
  const handleRemoveFromArrayField = (
    fieldName: keyof Pick<RouteFormData, 'uris' | 'hosts' | 'remote_addrs'>,
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index),
    }));
  };

  const handleMethodToggle = (method: string) => {
    setFormData(prev => {
      const newMethods = prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method];
      return { ...prev, methods: newMethods };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiConfig) {
      setError("API configuration is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);

    // Prepare payload: APISIX expects `uri` if only one URI, `uris` if multiple.
    // If methods array is empty, it implies all methods, so don't send it.
    const payload: any = { ...formData };
    if (payload.uris && payload.uris.length === 1 && !payload.uris[0]) { // if only one uri and it's empty string
        delete payload.uris; // Remove empty uris array
    } else if (payload.uris && payload.uris.length === 1) {
        payload.uri = payload.uris[0];
        delete payload.uris;
    } else if (payload.uris && payload.uris.length > 1) {
        payload.uris = payload.uris.filter(u => u.trim() !== ''); // Remove empty strings
        if(payload.uris.length === 0) delete payload.uris; // if all were empty
    }


    if (payload.hosts && payload.hosts.length > 0) {
        payload.hosts = payload.hosts.filter(h => h.trim() !== '');
        if(payload.hosts.length === 0) delete payload.hosts;
    } else {
        delete payload.hosts;
    }

    if (payload.remote_addrs && payload.remote_addrs.length > 0) {
        payload.remote_addrs = payload.remote_addrs.filter(r => r.trim() !== '');
        if(payload.remote_addrs.length === 0) delete payload.remote_addrs;
    } else {
        delete payload.remote_addrs;
    }

    if (payload.methods && payload.methods.length === 0) {
      delete payload.methods; // APISIX interprets empty/omitted methods as ANY
    }

    // Remove empty optional string fields
    if (!payload.name) delete payload.name;
    if (!payload.desc) delete payload.desc;
    if (!payload.upstream_id) delete payload.upstream_id;
    if (!payload.service_id) delete payload.service_id;
    if (!payload.plugin_config_id) delete payload.plugin_config_id;


    try {
      if (mode === 'edit' && formData.id) {
        await apiService.put(`/routes/${formData.id}`, payload);
      } else {
        // For create, APISIX can auto-generate ID if not provided, or use provided one.
        // If you want to force auto-generation, remove `id` from payload.
        // If you allow user-defined ID on create, ensure it's unique.
        // For simplicity, we assume PUT for create with a user-provided or pre-filled ID (if any logic sets it)
        // Or POST if ID should always be auto-generated (more typical for "create")
        // Let's assume we need an ID for PUT create. If your form doesn't have an ID field for create,
        // you might need POST or generate ID client-side (not recommended for APISIX).
        // For now, if ID is not part of formData for create, this will fail.
        // A common pattern is to use POST for create, which returns the created object with its new ID.
        // Let's use POST for create and expect an ID to be part of the payload if it's a specific requirement.
        // For APISIX, PUT /{id} can create or update. POST / can create with auto-id.
        // We will use PUT with ID. The ID field should be added to the form for creation if manual ID is desired.
        // For now, let's assume `routeId` (from URL for edit) or a new UUID for create.
        // This part needs refinement based on how IDs are handled for creation.
        // If ID is not provided for creation, APISIX uses POST
        if (!payload.id) { // If no ID, it's a create operation expecting auto-generated ID
            await apiService.post(`/routes`, payload);
        } else { // If ID is present (either from edit or user input for create with specific ID)
            await apiService.put(`/routes/${payload.id}`, payload);
        }
      }
      navigate('/routes'); // Navigate back to list page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderArrayField = (
    label: string,
    fieldName: keyof Pick<RouteFormData, 'uris' | 'hosts' | 'remote_addrs'>,
    tooltipText: string,
    placeholder: string = "Enter value"
    ) => (
    <div className="space-y-2">
      <Label className="flex items-center">
        {label}
        <InfoTooltip text={tooltipText} />
      </Label>
      {(formData[fieldName] || []).map((value, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            type="text"
            value={value}
            onChange={(e) => handleArrayFieldChange(fieldName, index, e.target.value)}
            placeholder={placeholder}
            className="flex-grow"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveFromArrayField(fieldName, index)}
            aria-label={`Remove ${label.slice(0,-1)}`}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleAddToArrayField(fieldName)}
        className="mt-1"
      >
        <PlusCircle className="h-4 w-4 mr-2" /> Add {label.slice(0,-1)}
      </Button>
    </div>
  );


  if (isLoading && mode === 'edit') return <p>Loading route data...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ID Field (relevant for edit, potentially for create if manual ID) */}
      {mode === 'edit' && formData.id && (
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="id">Route ID</Label>
            <Input id="id" name="id" type="text" value={formData.id} readOnly disabled/>
            <InfoTooltip text="The unique identifier for this route. Cannot be changed after creation." />
        </div>
      )}
       {/* If you want to allow setting ID on create, add a similar field here without disabled/readOnly based on your logic */}


      {/* Name */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name" className="flex items-center">
            Name
            <InfoTooltip text="A descriptive name for the route (optional). E.g., `my-user-api`." />
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name || ''}
          onChange={handleChange}
          placeholder="e.g., my-user-api"
        />
      </div>

      {/* Description */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="desc" className="flex items-center">
            Description
            <InfoTooltip text="A brief description of this route's purpose (optional)." />
        </Label>
        <Textarea
          id="desc"
          name="desc"
          value={formData.desc || ''}
          onChange={handleChange}
          placeholder="e.g., Routes traffic for user authentication service"
        />
      </div>

      {/* URIs */}
      {renderArrayField("URIs", "uris", "Path prefixes to match. E.g., `/api/users`, `/service/*`. At least one is required.", "/example/path")}

      {/* Hosts */}
      {renderArrayField("Hosts", "hosts", "Hostnames to match. E.g., `example.com`, `*.example.org`. Wildcards `*` can be used.", "api.example.com")}

      {/* Remote Addresses */}
      {renderArrayField("Remote Addresses", "remote_addrs", "Client IP addresses or CIDRs to match. E.g., `192.168.1.10`, `10.0.0.0/8`.", "192.168.0.1")}


      {/* Methods */}
      <div className="space-y-2">
        <Label className="flex items-center">
            HTTP Methods
            <InfoTooltip text="Allowed HTTP methods. If none are selected, all methods are allowed." />
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 border rounded-md dark:border-gray-700">
          {availableMethods.map(method => (
            <div key={method} className="flex items-center space-x-2">
              <Checkbox
                id={`method-${method}`}
                checked={formData.methods.includes(method)}
                onCheckedChange={() => handleMethodToggle(method)}
              />
              <Label htmlFor={`method-${method}`} className="font-normal">{method}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="grid w-full max-w-xs items-center gap-1.5">
        <Label htmlFor="priority" className="flex items-center">
            Priority
            <InfoTooltip text="A number that determines order of matching if multiple routes match. Higher value means higher priority. Default: 0." />
        </Label>
        <Input
          id="priority"
          name="priority"
          type="number"
          value={formData.priority}
          onChange={handleChange}
        />
      </div>

      {/* Status */}
       <div className="grid w-full max-w-xs items-center gap-1.5">
        <Label htmlFor="status" className="flex items-center">
            Status
            <InfoTooltip text="Enable or disable this route. Default: Enabled." />
        </Label>
        <Select
            value={String(formData.status)}
            onValueChange={(value) => handleSelectChange('status', parseInt(value))}
        >
            <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="1">Enabled</SelectItem>
                <SelectItem value="0">Disabled</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* Upstream ID */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="upstream_id" className="flex items-center">
            Upstream ID
            <InfoTooltip text="ID of a pre-configured Upstream to forward requests to (optional)." />
        </Label>
        <Input
          id="upstream_id"
          name="upstream_id"
          type="text"
          value={formData.upstream_id || ''}
          onChange={handleChange}
          placeholder="e.g., upstream-prod-users"
        />
      </div>

      {/* Service ID */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="service_id" className="flex items-center">
            Service ID
            <InfoTooltip text="ID of a pre-configured Service to associate with this route (optional)." />
        </Label>
        <Input
          id="service_id"
          name="service_id"
          type="text"
          value={formData.service_id || ''}
          onChange={handleChange}
          placeholder="e.g., service-prod-auth"
        />
      </div>

      {/* Plugin Config ID */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="plugin_config_id" className="flex items-center">
            Plugin Config ID
            <InfoTooltip text="ID of a pre-configured Plugin Configuration (optional)." />
        </Label>
        <Input
          id="plugin_config_id"
          name="plugin_config_id"
          type="text"
          value={formData.plugin_config_id || ''}
          onChange={handleChange}
          placeholder="e.g., plugins-common-security"
        />
      </div>

      {/* Enable WebSocket */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enable_websocket"
          name="enable_websocket"
          checked={formData.enable_websocket}
          onCheckedChange={(checked) => handleSelectChange('enable_websocket', checked as boolean)}
        />
        <Label htmlFor="enable_websocket" className="font-normal flex items-center">
            Enable WebSocket Proxy
            <InfoTooltip text="If checked, enables WebSocket proxying for this route." />
        </Label>
      </div>

      {/* TODO: Add fields for Plugins, Script, Filter Func, Labels, Timeout, Vars with appropriate UI controls */}
      {/* For complex fields like plugins or vars, consider dedicated components or modals */}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={() => navigate('/routes')} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Route' : 'Save Changes')}
        </Button>
      </div>
    </form>
  );
};

export default RouteForm;
