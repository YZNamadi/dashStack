import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuthStore } from '../state/auth.store';
import SidebarItem from '../components/SidebarItem';
import Canvas from '../components/Canvas';
import QueryPanel from '../components/QueryPanel';
import DatasourceManager from '../components/DatasourceManager';
import WorkflowManager from '../components/WorkflowManager';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'canvas' | 'datasources' | 'workflows'>('canvas');
  const [currentProjectId, setCurrentProjectId] = useState('demo-project'); // TODO: Get from project selection

  const componentTypes = ['Table', 'Button', 'Input', 'Text'];

  const tabs = [
    { id: 'canvas', label: 'Canvas', icon: '🎨' },
    { id: 'datasources', label: 'Data Sources', icon: '🔌' },
    { id: 'workflows', label: 'Workflows', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'canvas':
        return (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 p-5 bg-white shadow-md">
              <h2 className="text-xl font-bold">Components</h2>
              <ul className="mt-5">
                {componentTypes.map((type) => (
                  <SidebarItem key={type} type={type}>
                    {type}
                  </SidebarItem>
                ))}
              </ul>
              
              <div className="absolute bottom-5 w-56">
                  <p className="text-sm">Logged in as {user?.email}</p>
                  <button 
                    onClick={logout} 
                    className="w-full p-2 mt-2 text-sm text-white bg-red-500 rounded-md"
                  >
                    Logout
                  </button>
              </div>
            </div>

            {/* Main Canvas */}
            <div className="relative flex-1 p-10">
                <Canvas />
            </div>
          </div>
        );
      case 'datasources':
        return (
          <div className="flex-1 p-6">
            <DatasourceManager projectId={currentProjectId} />
          </div>
        );
      case 'workflows':
        return (
          <div className="flex-1 p-6">
            <WorkflowManager projectId={currentProjectId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header with Tabs */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">DashStack</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Project: Demo Project</span>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Switch Project
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
        
        {/* Query Panel - Only show on canvas tab */}
        {activeTab === 'canvas' && <QueryPanel />}
      </div>
    </DndProvider>
  );
};

export default DashboardPage; 