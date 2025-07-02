import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Dialog } from '../components/ui/dialog';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAppStore } from '../store/appStore';

export const Integrations = () => {
  const { currentProject } = useAppStore();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'Database' });

  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    apiClient.getIntegrations(currentProject.id)
      .then(setIntegrations)
      .finally(() => setLoading(false));
  }, [currentProject]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', type: 'Database' });
    setShowDialog(true);
  };
  const openEdit = (integration: any) => {
    setEditing(integration);
    setForm({ name: integration.name, type: integration.type });
    setShowDialog(true);
  };
  const handleSave = async () => {
    if (!currentProject) return;
    if (editing) {
      const updated = await apiClient.updateIntegration(currentProject.id, editing.id, form);
      setIntegrations(integrations.map(i => i.id === editing.id ? updated : i));
    } else {
      const created = await apiClient.createIntegration(currentProject.id, { ...form, config: {} });
      setIntegrations([...integrations, created]);
    }
    setShowDialog(false);
  };
  const handleDelete = async (id: string) => {
    if (!currentProject) return;
    await apiClient.deleteIntegration(currentProject.id, id);
    setIntegrations(integrations.filter(i => i.id !== id));
  };
  const handleTest = async (id: string) => {
    if (!currentProject) return;
    await apiClient.testIntegration(currentProject.id, id);
    setIntegrations(integrations.map(i => i.id === id ? { ...i, status: 'Connected' } : i));
  };

  if (!currentProject) {
    return <div className="text-center py-12 text-gray-400">No project selected.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <Button className="bg-blue-600 text-white" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add Integration
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map(integration => (
                  <tr key={integration.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{integration.name}</td>
                    <td className="px-4 py-2">{integration.type}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${integration.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{integration.status}</span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(integration)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(integration.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleTest(integration.id)}><RefreshCw className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {/* Add/Edit Dialog */}
      {showDialog && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Integration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="Database">Database</option>
                  <option value="REST">REST</option>
                  <option value="GraphQL">GraphQL</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button className="bg-blue-600 text-white" onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}; 