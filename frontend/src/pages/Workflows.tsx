import { useAppStore } from '../store/appStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Workflow, Plus, Edit, Trash2, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Workflows = () => {
  const { currentProject, workflows, fetchWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } = useAppStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkflows = async () => {
      if (!currentProject) return;
      try {
        setLoading(true);
        await fetchWorkflows(currentProject.id);
      } catch (error) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    loadWorkflows();
  }, [currentProject, fetchWorkflows]);

  const handleEdit = (workflow: any) => {
    setEditingWorkflow(workflow);
    setShowEditDialog(true);
  };

  const handleDelete = (workflow: any) => {
    setDeletingWorkflow(workflow);
    setShowDeleteDialog(true);
  };

  const handleRunWorkflow = async (workflow: any) => {
    try {
      const { runWorkflow } = useAppStore.getState();
      await runWorkflow(workflow.id);
    } catch (error) {
      console.error('Workflow execution failed:', error);
    }
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <Workflow className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No project selected</h3>
        <p className="text-slate-600">
          Select a project to view and manage its workflows
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workflows</h1>
          <p className="text-slate-600 mt-1">
            Workflows in {currentProject.name}
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center">
                    <Workflow className="w-5 h-5 mr-2 text-orange-600" />
                    {workflow.name}
                  </div>
                  <Badge 
                    variant={workflow.status === 'active' ? 'default' : 'secondary'}
                    className={workflow.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                  >
                    {workflow.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {workflow.type} • {workflow.trigger}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Created {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunWorkflow(workflow)}
                      className="h-8 w-8 p-0"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(workflow)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(workflow)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
          <Workflow className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No workflows yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first workflow for {currentProject.name}
          </p>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      )}

      {/* Workflow Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Workflow</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const name = formData.get('name') as string;
                const type = formData.get('type') as string;
                const trigger = formData.get('trigger') as string;
                const code = formData.get('code') as string;
                await createWorkflow(currentProject.id, { name, type, trigger, code });
                setShowCreateDialog(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input name="name" required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select name="type" required className="w-full border rounded px-3 py-2">
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trigger</label>
                <select name="trigger" required className="w-full border rounded px-3 py-2">
                  <option value="manual">Manual</option>
                  <option value="schedule">Schedule</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <textarea name="code" required className="w-full border rounded px-3 py-2 h-32" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Edit Dialog */}
      {showEditDialog && editingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Workflow</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const name = formData.get('name') as string;
                const type = formData.get('type') as string;
                const trigger = formData.get('trigger') as string;
                const code = formData.get('code') as string;
                await updateWorkflow(editingWorkflow.id, { name, type, trigger, code });
                setShowEditDialog(false);
                setEditingWorkflow(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input name="name" defaultValue={editingWorkflow.name} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select name="type" defaultValue={editingWorkflow.type} required className="w-full border rounded px-3 py-2">
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trigger</label>
                <select name="trigger" defaultValue={editingWorkflow.trigger} required className="w-full border rounded px-3 py-2">
                  <option value="manual">Manual</option>
                  <option value="schedule">Schedule</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <textarea name="code" defaultValue={editingWorkflow.code} required className="w-full border rounded px-3 py-2 h-32" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setEditingWorkflow(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white">
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Workflow</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{deletingWorkflow.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setShowDeleteDialog(false); setDeletingWorkflow(null); }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  await deleteWorkflow(deletingWorkflow.id);
                  setShowDeleteDialog(false);
                  setDeletingWorkflow(null);
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
