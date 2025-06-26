import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Workflow {
  id: string;
  name: string;
  type: 'Python' | 'JavaScript';
  trigger: 'manual' | 'cron' | 'api';
  code: string;
}

interface WorkflowManagerProps {
  projectId: string;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ projectId }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Python' as Workflow['type'],
    trigger: 'manual' as Workflow['trigger'],
    code: '',
  });

  useEffect(() => {
    fetchWorkflows();
  }, [projectId]);

  const fetchWorkflows = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/workflows`);
      setWorkflows(response.data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/workflows`, formData);
      setShowForm(false);
      setFormData({ name: '', type: 'Python', trigger: 'manual', code: '' });
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const handleRunWorkflow = async (workflowId: string) => {
    try {
      const response = await api.post(`/workflows/${workflowId}/run`, {
        input: { test: 'data' },
      });
      alert(`Workflow executed successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
      alert(`Error running workflow: ${error}`);
    }
  };

  const getCodeTemplate = (type: Workflow['type']) => {
    if (type === 'Python') {
      return `# Python workflow
# Input data is available as 'input' parameter
# Return data to be sent back to the frontend

def run(input):
    # Example: Process KYC approval
    user_id = input.get('id')
    
    # Your logic here
    result = {
        "status": "approved",
        "user_id": user_id,
        "timestamp": "2024-01-01T00:00:00Z"
    }
    
    return result`;
    } else {
      return `// JavaScript workflow
// Input data is available as 'input' parameter
// Return data to be sent back to the frontend

async function run(input) {
    // Example: Process KYC approval
    const userId = input.id;
    
    // Your logic here
    const result = {
        status: "approved",
        userId: userId,
        timestamp: new Date().toISOString()
    };
    
    return result;
}`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Workflows</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Add Workflow
        </button>
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
          >
            <div>
              <h4 className="font-medium text-gray-900">{workflow.name}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {workflow.type}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {workflow.trigger}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleRunWorkflow(workflow.id)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Run
              </button>
              <button
                onClick={() => setSelectedWorkflow(workflow)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Workflow Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Workflow
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.type}
                      onChange={(e) => {
                        const type = e.target.value as Workflow['type'];
                        setFormData({
                          ...formData,
                          type,
                          code: getCodeTemplate(type),
                        });
                      }}
                    >
                      <option value="Python">Python</option>
                      <option value="JavaScript">JavaScript</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trigger
                  </label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.trigger}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trigger: e.target.value as Workflow['trigger'],
                      })
                    }
                  >
                    <option value="manual">Manual</option>
                    <option value="cron">Cron</option>
                    <option value="api">API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Code
                  </label>
                  <textarea
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    rows={15}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>

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
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Workflow Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedWorkflow.name}
                </h3>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {selectedWorkflow.type}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedWorkflow.trigger}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code
                  </label>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                    {selectedWorkflow.code}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManager; 