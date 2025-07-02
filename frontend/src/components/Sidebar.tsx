import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Layers, Zap, Database, ListChecks, Settings, Menu } from 'lucide-react';

const navItems = [
  { label: 'Projects', icon: <Layers className="w-5 h-5" />, to: '/projects' },
  { label: 'Pages', icon: <FileText className="w-5 h-5" />, to: '/pages' },
  { label: 'Workflows', icon: <Zap className="w-5 h-5" />, to: '/workflows' },
  { label: 'Integrations', icon: <Database className="w-5 h-5" />, to: '/integrations' },
  { label: 'Audit Logs', icon: <ListChecks className="w-5 h-5" />, to: '/audit-logs' },
  { label: 'Settings', icon: <Settings className="w-5 h-5" />, to: '/settings' },
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-white border shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Open sidebar navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-6 h-6 text-blue-600" />
      </button>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-64 bg-white border-r flex flex-col shadow-sm transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        role="navigation"
        aria-label="Main sidebar navigation"
        tabIndex={-1}
      >
        <div className="h-16 flex items-center justify-center border-b">
          <span className="text-xl font-bold text-blue-600 tracking-tight">DashStack</span>
        </div>
        <nav className="flex-1 py-4" aria-label="Sidebar links">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-2 rounded-lg transition-colors text-gray-700 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`
                  }
                  tabIndex={0}
                  aria-label={item.label}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t text-xs text-gray-400">v1.0.0</div>
      </aside>
    </>
  );
}
