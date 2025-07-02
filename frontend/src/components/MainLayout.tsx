import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  </div>
);
