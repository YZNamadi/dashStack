import { useAppStore } from '../store/appStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Edit, Trash2, TestTube, Eye, Globe, Code } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DatasourceConfigDialog } from '../components/DatasourceConfigDialog';
import { useToast } from '../hooks/use-toast';
import { apiClient } from '../lib/api';

export const Datasources = () => {
  const { currentProject, datasources, fetchDatasources, createDatasource, updateDatasource, deleteDatasource } = useAppStore();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingDatasource, setEditingDatasource] = useState<any>(null);
  const [deletingDatasource, setDeletingDatasource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    const loadDatasources = async () => {
      if (!currentProject) return;
      try {
        setLoading(true);
        await fetchDatasources(currentProject.id);
      } catch (error) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    loadDatasources();
  }, [currentProject, fetchDatasources]);

  const handleEdit = (datasource: any) => {
    setEditingDatasource(datasource);
    setShowEditDialog(true);
  };

  const handleDelete = (datasource: any) => {
    setDeletingDatasource(datasource);
    setShowDeleteDialog(true);
  };

  const handleTestConnection = async (datasource: any) => {
    setTestingConnection(datasource.id);
    try {
      const result = await apiClient.testDatasourceConnection(currentProject.id, {
        type: datasource.type,
        config: datasource.config
      });
      
      toast({
        title: 'Connection Test',
        description: result.success ? 'Connection successful!' : 'Connection failed',
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      toast({
        title: 'Connection Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleCreateDatasource = async (datasourceData: any) => {
    try {
      await createDatasource(currentProject.id, datasourceData);
      setShowCreateDialog(false);
      toast({
        title: 'Datasource Created',
        description: 'Datasource has been created successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpdateDatasource = async (datasourceData: any) => {
    try {
      await updateDatasource(editingDatasource.id, datasourceData);
      setShowEditDialog(false);
      setEditingDatasource(null);
      toast({
        title: 'Datasource Updated',
        description: 'Datasource has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getDatasourceIcon = (type: string) => {
    switch (type) {
      case 'PostgreSQL':
      case 'MySQL':
        return <Database className="w-5 h-5" />;
      case 'REST':
        return <Globe className="w-5 h-5" />;
      case 'GraphQL':
        return <Code className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getDatasourceColor = (type: string) => {
    switch (type) {
      case 'PostgreSQL':
        return 'text-blue-600';
      case 'MySQL':
        return 'text-orange-600';
      case 'REST':
        return 'text-green-600';
      case 'GraphQL':
        return 'text-purple-600';
      default:
        return 'text-slate-600';
    }
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No project selected</h3>
        <p className="text-slate-600">
          Select a project to view and manage its datasources
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Datasources</h1>
          <p className="text-slate-600 mt-1">
            Datasources in {currentProject.name}
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Datasource
        </Button>
      </div>

      {datasources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasources.map((datasource) => (
            <Card key={datasource.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center">
                    <div className={`mr-2 ${getDatasourceColor(datasource.type)}`}>
                      {getDatasourceIcon(datasource.type)}
                    </div>
                    {datasource.name}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {datasource.type}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {datasource.config?.host || datasource.config?.baseUrl || datasource.config?.graphqlEndpoint || 'No endpoint configured'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Created {new Date(datasource.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(datasource)}
                      disabled={testingConnection === datasource.id}
                      className="h-8 w-8 p-0"
                      title="Test Connection"
                    >
                      {testingConnection === datasource.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                      <TestTube className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(datasource)}
                      className="h-8 w-8 p-0"
                      title="Edit Datasource"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(datasource)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Delete Datasource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No datasources yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first datasource for {currentProject.name}
          </p>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Datasource
          </Button>
        </div>
      )}

      {/* Enhanced Datasource Create Dialog */}
      <DatasourceConfigDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateDatasource}
        projectId={currentProject.id}
      />

      {/* Enhanced Datasource Edit Dialog */}
      <DatasourceConfigDialog
        isOpen={showEditDialog}
        onClose={() => {
                setShowEditDialog(false);
                setEditingDatasource(null);
              }}
        onSubmit={handleUpdateDatasource}
        editingDatasource={editingDatasource}
        projectId={currentProject.id}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingDatasource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Datasource</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{deletingDatasource.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setShowDeleteDialog(false); setDeletingDatasource(null); }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  try {
                  await deleteDatasource(deletingDatasource.id);
                  setShowDeleteDialog(false);
                  setDeletingDatasource(null);
                    toast({
                      title: 'Datasource Deleted',
                      description: 'Datasource has been deleted successfully.',
                    });
                  } catch (error: any) {
                    toast({
                      title: 'Deletion Failed',
                      description: error.message,
                      variant: 'destructive'
                    });
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
