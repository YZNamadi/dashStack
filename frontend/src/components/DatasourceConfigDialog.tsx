import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';
import { apiClient } from '../lib/api';
import { Database, TestTube, Eye, EyeOff, Globe, Code, Zap } from 'lucide-react';

interface DatasourceConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (datasource: any) => void;
  editingDatasource?: any;
  projectId: string;
}

export const DatasourceConfigDialog: React.FC<DatasourceConfigDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingDatasource,
  projectId
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('config');
  const [datasourceType, setDatasourceType] = useState('PostgreSQL');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<any>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [schema, setSchema] = useState<any>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editingDatasource) {
      setName(editingDatasource.name);
      setDatasourceType(editingDatasource.type);
      setConfig(editingDatasource.config || {});
    } else {
      setName('');
      setDatasourceType('PostgreSQL');
      setConfig({});
    }
    setConnectionResult(null);
    setSchema(null);
  }, [editingDatasource, isOpen]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await apiClient.post(`/projects/${projectId}/datasources/test-connection`, {
        type: datasourceType,
        config
      });
      setConnectionResult(result);
      toast({
        title: 'Connection Test',
        description: result.success ? 'Connection successful!' : 'Connection failed',
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      setConnectionResult({ success: false, error: error.message });
      toast({
        title: 'Connection Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const loadSchema = async () => {
    if (!editingDatasource) return;
    
    setLoadingSchema(true);
    try {
      const schemaData = await apiClient.get(`/projects/${projectId}/datasources/${editingDatasource.id}/schema`);
      setSchema(schemaData);
      toast({
        title: 'Schema Loaded',
        description: 'Database schema loaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Schema Load Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Datasource name is required',
        variant: 'destructive'
      });
      return;
    }

    onSubmit({
      name,
      type: datasourceType,
      config
    });
  };

  const renderConfigFields = () => {
    switch (datasourceType) {
      case 'MySQL':
      case 'PostgreSQL':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Host</Label>
                <Input
                  value={config.host || ''}
                  onChange={(e) => handleConfigChange('host', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  value={config.port || ''}
                  onChange={(e) => handleConfigChange('port', e.target.value)}
                  placeholder={datasourceType === 'MySQL' ? '3306' : '5432'}
                />
              </div>
            </div>
            <div>
              <Label>Database</Label>
              <Input
                value={config.database || ''}
                onChange={(e) => handleConfigChange('database', e.target.value)}
                placeholder="database_name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={config.username || ''}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                  placeholder="username"
                />
              </div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={config.password || ''}
                    onChange={(e) => handleConfigChange('password', e.target.value)}
                    placeholder="password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Connection String (Optional)</Label>
              <Input
                value={config.connectionString || ''}
                onChange={(e) => handleConfigChange('connectionString', e.target.value)}
                placeholder={`${datasourceType === 'MySQL' ? 'mysql://' : 'postgresql://'}user:pass@host:port/db`}
              />
            </div>
          </div>
        );

      case 'REST':
        return (
          <div className="space-y-4">
            <div>
              <Label>Base URL</Label>
              <Input
                value={config.baseUrl || ''}
                onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            <div>
              <Label>Authentication Headers (JSON)</Label>
              <Textarea
                value={config.authHeaders ? JSON.stringify(config.authHeaders, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleConfigChange('authHeaders', headers);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"Authorization": "Bearer token", "X-API-Key": "key"}'
                rows={4}
              />
            </div>
            <div>
              <Label>Default Headers (JSON)</Label>
              <Textarea
                value={config.defaultHeaders ? JSON.stringify(config.defaultHeaders, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleConfigChange('defaultHeaders', headers);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"Content-Type": "application/json"}'
                rows={4}
              />
            </div>
          </div>
        );

      case 'GraphQL':
        return (
          <div className="space-y-4">
            <div>
              <Label>GraphQL Endpoint</Label>
              <Input
                value={config.graphqlEndpoint || ''}
                onChange={(e) => handleConfigChange('graphqlEndpoint', e.target.value)}
                placeholder="https://api.example.com/graphql"
              />
            </div>
            <div>
              <Label>Authentication Headers (JSON)</Label>
              <Textarea
                value={config.authHeaders ? JSON.stringify(config.authHeaders, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleConfigChange('authHeaders', headers);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"Authorization": "Bearer token"}'
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return <div>Unsupported datasource type</div>;
    }
  };

  const renderSchemaView = () => {
    if (!schema) {
      return (
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No schema loaded</p>
          {editingDatasource && (
            <Button onClick={loadSchema} disabled={loadingSchema} className="mt-4">
              {loadingSchema ? 'Loading...' : 'Load Schema'}
            </Button>
          )}
        </div>
      );
    }

    if (datasourceType === 'GraphQL') {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Query Types</h4>
            {schema.queryType && (
              <div className="bg-slate-50 p-3 rounded">
                <Badge variant="outline" className="mb-2">Query Root</Badge>
                <p className="text-sm">{schema.queryType.name}</p>
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium mb-2">Available Types</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {schema.types?.filter((type: any) => type.kind === 'OBJECT' && type.fields).map((type: any) => (
                <Card key={type.name} className="p-3">
                  <CardTitle className="text-sm">{type.name}</CardTitle>
                  {type.description && (
                    <p className="text-xs text-slate-600 mt-1">{type.description}</p>
                  )}
                  {type.fields && (
                    <div className="mt-2">
                      {type.fields.slice(0, 3).map((field: any) => (
                        <div key={field.name} className="text-xs text-slate-500">
                          {field.name}: {field.type?.name || 'Unknown'}
                        </div>
                      ))}
                      {type.fields.length > 3 && (
                        <div className="text-xs text-slate-400">+{type.fields.length - 3} more fields</div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="font-medium">Database Tables</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {schema.tables?.map((table: any) => (
            <Card key={table.table} className="p-3">
              <CardTitle className="text-sm">{table.table}</CardTitle>
              {table.comment && (
                <p className="text-xs text-slate-600 mt-1">{table.comment}</p>
              )}
              {table.columns && (
                <div className="mt-2">
                  {table.columns.slice(0, 3).map((column: any) => (
                    <div key={column.column_name} className="text-xs text-slate-500">
                      {column.column_name}: {column.data_type}
                    </div>
                  ))}
                  {table.columns.length > 3 && (
                    <div className="text-xs text-slate-400">+{table.columns.length - 3} more columns</div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {editingDatasource ? 'Edit Datasource' : 'Create New Datasource'}
          </h2>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="test">Test Connection</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6">
              <div>
                <Label>Datasource Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Database"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Datasource Type</Label>
                <Select value={datasourceType} onValueChange={setDatasourceType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PostgreSQL">
                      <div className="flex items-center">
                        <Database className="w-4 h-4 mr-2" />
                        PostgreSQL
                      </div>
                    </SelectItem>
                    <SelectItem value="MySQL">
                      <div className="flex items-center">
                        <Database className="w-4 h-4 mr-2" />
                        MySQL
                      </div>
                    </SelectItem>
                    <SelectItem value="REST">
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        REST API
                      </div>
                    </SelectItem>
                    <SelectItem value="GraphQL">
                      <div className="flex items-center">
                        <Code className="w-4 h-4 mr-2" />
                        GraphQL
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderConfigFields()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Test Connection</h3>
                <Button
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {connectionResult && (
                <Card>
                  <CardContent className="pt-6">
                    <div className={`flex items-center gap-2 mb-2 ${
                      connectionResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        connectionResult.success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">
                        {connectionResult.success ? 'Connection Successful' : 'Connection Failed'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{connectionResult.message}</p>
                    {connectionResult.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        {connectionResult.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="schema" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Database Schema</h3>
                {editingDatasource && (
                  <Button
                    onClick={loadSchema}
                    disabled={loadingSchema}
                    className="flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    {loadingSchema ? 'Loading...' : 'Refresh Schema'}
                  </Button>
                )}
              </div>
              {renderSchemaView()}
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingDatasource ? 'Update Datasource' : 'Create Datasource'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 