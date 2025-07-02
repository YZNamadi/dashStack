// src/pages/AuditLogs.tsx

import React, { useState, useEffect } from 'react';

// Define the interface for an audit log entry
interface AuditLogEntry {
  id: number;
  user: string;
  action: string;
  timestamp: string;
}

// Mock data for the audit logs
const mockAuditLogsData: AuditLogEntry[] = [
  { id: 1, user: 'admin@example.com', action: 'User logged in', timestamp: '2023-10-27T10:00:00Z' },
  { id: 2, user: 'editor@example.com', action: 'Updated page "Homepage"', timestamp: '2023-10-27T10:05:00Z' },
  { id: 3, user: 'viewer@example.com', action: 'Viewed dashboard "Sales"', timestamp: '2023-10-27T10:10:00Z' },
  { id: 4, user: 'admin@example.com', action: 'Created new user "testuser"', timestamp: '2023-10-27T10:15:00Z' },
  { id: 5, user: 'editor@example.com', action: 'Deleted page "About Us"', timestamp: '2023-10-27T10:20:00Z' },
];

const AuditLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data from an API
    setLoading(true);
    const timer = setTimeout(() => {
        setAuditLogs(mockAuditLogsData);
        setLoading(false);
    }, 500); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">Audit Logs</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
                <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500">Loading audit logs...</td>
                </tr>
            ) : (
                auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                ))
            )}
            {!loading && auditLogs.length === 0 && (
                 <tr>
                    <td colSpan={3} className="text-center py-10 text-gray-500">No audit logs found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { AuditLogs };
export default AuditLogs; 