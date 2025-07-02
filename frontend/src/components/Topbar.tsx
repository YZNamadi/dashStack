import React from 'react';

export const Topbar = () => (
  <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm" role="banner" aria-label="Top navigation bar">
    {/* Breadcrumbs placeholder */}
    <nav className="flex items-center space-x-2 text-gray-500 text-sm" aria-label="Breadcrumb">
      <span tabIndex={0}>Home</span>
      <span>/</span>
      <span className="text-gray-700 font-medium" tabIndex={0}>Section</span>
    </nav>
    {/* User menu placeholder */}
    <div className="flex items-center space-x-4" role="menu" aria-label="User menu">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold" tabIndex={0}>U</div>
      <span className="text-gray-700 font-medium" tabIndex={0}>User</span>
    </div>
  </header>
); 