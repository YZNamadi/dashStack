import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Datasource {
  id: string;
  type: 'MySQL' | 'PostgreSQL' | 'REST' | 'Python' | 'JS';
  config: any;
}

interface DatasourceManagerProps {
  projectId: string;
}

const DatasourceManager: React.FC<DatasourceManagerProps> = ({ projectId }) => {
  const [datasources, setDatasources] = useState<Datasource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'MySQL' as Datasource['type'],
    config: {} as any,
  });

  useEffect(() => {
    fetchDatasources();
  }, [projectId]);

  const fetchDatasources = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/datasources`);
      setDatasources(response.data);
    } catch (error) {
      console.error('Error fetching datasources:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/datasources`, formData);
      setShowForm(false);
      setFormData({ type: 'MySQL', config: {} });
      fetchDatasources();
    } catch (error) {
      console.error('Error creating datasource:', error);
    }
  };

  const renderConfigForm = () => {
    switch (formData.type) {
      case 'MySQL':
      case 'PostgreSQL':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Connection String
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="mysql://user:password@localhost:3306/database"
                value={formData.config.connectionString || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, connectionString: e.target.value },
                  })
                }
              />
            </div>
          </div>
        );

      case 'REST':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base URL
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://api.example.com"
                value={formData.config.baseUrl || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, baseUrl: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Auth Headers (JSON)
              </label>
              <textarea
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder='{"Authorization": "Bearer token"}'
                value={formData.config.authHeaders ? JSON.stringify(formData.config.authHeaders, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    setFormData({
                      ...formData,
                      config: { ...formData.config, authHeaders: headers },
                    });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Data Sources</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add Data Source
        </button>
      </div>

      {/* Datasources List */}
      <div className="space-y-3">
        {datasources.map((ds) => (
          <div
            key={ds.id}
            className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
          >
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {ds.type}
              </span>
              <span className="ml-2 text-sm text-gray-600">
                {ds.type === 'MySQL' || ds.type === 'PostgreSQL'
                  ? 'Database'
                  : ds.type === 'REST'
                  ? ds.config.baseUrl
                  : 'Code'}
              </span>
            </div>
            <button
              onClick={() => {
                setDatasources(datasources.filter((d) => d.id !== ds.id));
              }}
              className="text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add Datasource Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Data Source
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as Datasource['type'],
                        config: {},
                      })
                    }
                  >
                    <option value="MySQL">MySQL</option>
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="REST">REST API</option>
                    <option value="Python">Python</option>
                    <option value="JS">JavaScript</option>
                  </select>
                </div>

                {renderConfigForm()}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasourceManager; 