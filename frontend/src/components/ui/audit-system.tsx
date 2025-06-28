import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Shield,
  Database,
  Code,
  Mail
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTable } from './data-table';

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'warning';
}

interface AuditSystemProps {
  events?: AuditEvent[];
  onExport?: (events: AuditEvent[]) => void;
}

const mockAuditEvents: AuditEvent[] = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    userId: 'user1',
    userName: 'John Doe',
    action: 'login',
    resource: 'auth',
    details: { method: 'email', success: true },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'low',
    status: 'success',
  },
  {
    id: '2',
    timestamp: new Date('2024-01-15T10:35:00Z'),
    userId: 'user1',
    userName: 'John Doe',
    action: 'create',
    resource: 'project',
    resourceId: 'proj_123',
    details: { projectName: 'New Dashboard', description: 'Analytics dashboard' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'medium',
    status: 'success',
  },
  {
    id: '3',
    timestamp: new Date('2024-01-15T11:00:00Z'),
    userId: 'user2',
    userName: 'Jane Smith',
    action: 'update',
    resource: 'workflow',
    resourceId: 'wf_456',
    details: { workflowName: 'Data Pipeline', changes: ['Added new step', 'Updated schedule'] },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    severity: 'medium',
    status: 'success',
  },
  {
    id: '4',
    timestamp: new Date('2024-01-15T11:15:00Z'),
    userId: 'user3',
    userName: 'Bob Wilson',
    action: 'delete',
    resource: 'datasource',
    resourceId: 'ds_789',
    details: { datasourceName: 'Old Database', reason: 'Deprecated' },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'high',
    status: 'success',
  },
  {
    id: '5',
    timestamp: new Date('2024-01-15T11:30:00Z'),
    userId: 'unknown',
    userName: 'Unknown User',
    action: 'login',
    resource: 'auth',
    details: { method: 'email', success: false, reason: 'Invalid credentials' },
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'medium',
    status: 'failure',
  },
  {
    id: '6',
    timestamp: new Date('2024-01-15T12:00:00Z'),
    userId: 'user1',
    userName: 'John Doe',
    action: 'execute',
    resource: 'workflow',
    resourceId: 'wf_456',
    details: { workflowName: 'Data Pipeline', executionTime: '2.5s', status: 'completed' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'low',
    status: 'success',
  },
  {
    id: '7',
    timestamp: new Date('2024-01-15T12:30:00Z'),
    userId: 'user4',
    userName: 'Alice Johnson',
    action: 'permission_change',
    resource: 'user',
    resourceId: 'user2',
    details: { action: 'role_assigned', role: 'admin', reason: 'Promotion' },
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    severity: 'high',
    status: 'success',
  },
  {
    id: '8',
    timestamp: new Date('2024-01-15T13:00:00Z'),
    userId: 'user2',
    userName: 'Jane Smith',
    action: 'export',
    resource: 'data',
    details: { dataset: 'Customer Analytics', format: 'CSV', records: 15000 },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    severity: 'medium',
    status: 'success',
  },
];

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors = {
  success: 'bg-green-100 text-green-800',
  failure: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
};

const resourceIcons = {
  auth: Shield,
  project: Database,
  workflow: Code,
  datasource: Database,
  user: User,
  data: FileText,
  email: Mail,
};

export const AuditSystem: React.FC<AuditSystemProps> = ({
  events = mockAuditEvents,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('24h');

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = 
        event.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ipAddress.includes(searchTerm);

      const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
      const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
      const matchesResource = selectedResource === 'all' || event.resource === selectedResource;

      return matchesSearch && matchesSeverity && matchesStatus && matchesResource;
    });
  }, [events, searchTerm, selectedSeverity, selectedStatus, selectedResource]);

  const getEventStats = () => {
    const total = events.length;
    const bySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byStatus = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byResource = events.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, bySeverity, byStatus, byResource };
  };

  const stats = getEventStats();

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (value: Date) => (
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{value.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'userName',
      label: 'User',
      sortable: true,
      render: (value: string, row: AuditEvent) => (
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
    },
    {
      key: 'resource',
      label: 'Resource',
      sortable: true,
      render: (value: string) => {
        const Icon = resourceIcons[value as keyof typeof resourceIcons] || Activity;
        return (
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{value}</span>
          </div>
        );
      },
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value: string) => (
        <Badge className={severityColors[value as keyof typeof severityColors]}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge className={statusColors[value as keyof typeof statusColors]}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      sortable: true,
    },
  ];

  const exportAuditLog = () => {
    if (onExport) {
      onExport(filteredEvents);
    } else {
      // Default CSV export
      const csvContent = [
        ['Timestamp', 'User', 'Action', 'Resource', 'Severity', 'Status', 'IP Address', 'Details'].join(','),
        ...filteredEvents.map(event => [
          event.timestamp.toISOString(),
          event.userName,
          event.action,
          event.resource,
          event.severity,
          event.status,
          event.ipAddress,
          JSON.stringify(event.details)
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit System</h2>
          <p className="text-gray-600">Monitor user activities and system events</p>
        </div>
        <Button onClick={exportAuditLog}>
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-2xl font-bold">{stats.bySeverity.high || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round(((stats.byStatus.success || 0) / stats.total) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {new Set(events.map(e => e.userId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Severity</Label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resource</Label>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                  <SelectItem value="workflow">Workflows</SelectItem>
                  <SelectItem value="datasource">Datasources</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <DataTable
        data={filteredEvents}
        columns={columns}
        title="Audit Log"
        searchable={false}
        exportable={false}
        pageSize={20}
        onRowClick={(event) => {
          console.log('Event details:', event);
          // You can open a modal here to show detailed event information
        }}
      />
    </div>
  );
}; 