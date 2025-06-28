import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Database,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Chart } from './chart';

interface Metric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  unit: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

interface AnalyticsDashboardProps {
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: string) => void;
  onExport?: () => void;
}

const generateMockData = (timeRange: string): { metrics: Metric[]; charts: Record<string, ChartData> } => {
  const now = new Date();
  const labels = [];
  const data = [];
  
  // Generate time labels based on range
  let points = 24;
  let interval = 1;
  
  switch (timeRange) {
    case '1h':
      points = 60;
      interval = 1;
      break;
    case '24h':
      points = 24;
      interval = 1;
      break;
    case '7d':
      points = 7;
      interval = 24;
      break;
    case '30d':
      points = 30;
      interval = 24;
      break;
    case '90d':
      points = 90;
      interval = 24;
      break;
  }
  
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval * 60 * 60 * 1000);
    labels.push(time.toLocaleDateString() + ' ' + time.toLocaleTimeString());
    data.push(Math.floor(Math.random() * 1000) + 100);
  }

  const metrics: Metric[] = [
    {
      id: 'active_users',
      name: 'Active Users',
      value: 1247,
      change: 12.5,
      changeType: 'increase',
      unit: 'users',
      icon: Users,
      color: '#3B82F6'
    },
    {
      id: 'workflows_executed',
      name: 'Workflows Executed',
      value: 892,
      change: -3.2,
      changeType: 'decrease',
      unit: 'executions',
      icon: Zap,
      color: '#10B981'
    },
    {
      id: 'api_requests',
      name: 'API Requests',
      value: 45678,
      change: 8.7,
      changeType: 'increase',
      unit: 'requests',
      icon: Activity,
      color: '#F59E0B'
    },
    {
      id: 'database_queries',
      name: 'Database Queries',
      value: 23456,
      change: 15.3,
      changeType: 'increase',
      unit: 'queries',
      icon: Database,
      color: '#8B5CF6'
    }
  ];

  const charts: Record<string, ChartData> = {
    userActivity: {
      labels,
      datasets: [
        {
          label: 'Active Users',
          data: data.map(d => d + Math.floor(Math.random() * 200)),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)'
        }
      ]
    },
    workflowPerformance: {
      labels,
      datasets: [
        {
          label: 'Execution Time (ms)',
          data: data.map(d => Math.floor(d / 10)),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        }
      ]
    },
    errorRate: {
      labels,
      datasets: [
        {
          label: 'Error Rate (%)',
          data: data.map(d => (d % 10) / 10),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)'
        }
      ]
    },
    resourceUsage: {
      labels,
      datasets: [
        {
          label: 'CPU Usage (%)',
          data: data.map(d => (d % 80) + 20),
          borderColor: '#F59E0B',
          backgroundColor: 'rgba(245, 158, 11, 0.1)'
        },
        {
          label: 'Memory Usage (%)',
          data: data.map(d => (d % 60) + 40),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)'
        }
      ]
    }
  };

  return { metrics, charts };
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '24h',
  onTimeRangeChange,
  onExport
}) => {
  const [data, setData] = useState(generateMockData(timeRange));
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState('userActivity');

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setData(generateMockData(timeRange));
    setIsLoading(false);
  };

  const handleTimeRangeChange = (newRange: string) => {
    onTimeRangeChange?.(newRange);
    setData(generateMockData(newRange));
  };

  const renderMetricCard = (metric: Metric) => {
    const Icon = metric.icon;
    
    return (
      <Card key={metric.id}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
          <Icon className="w-4 h-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
          <div className="flex items-center space-x-2 text-xs">
            {metric.changeType === 'increase' ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </span>
            <span className="text-gray-500">from last period</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderChartCard = (title: string, chartData: ChartData, type: 'line' | 'bar' | 'pie' = 'line') => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {type === 'line' && <LineChart className="w-5 h-5" />}
          {type === 'bar' && <BarChart3 className="w-5 h-5" />}
          {type === 'pie' && <PieChart className="w-5 h-5" />}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Chart
          type={type}
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
            },
            scales: type !== 'pie' ? {
              y: {
                beginAtZero: true,
              },
            } : undefined,
          }}
        />
      </CardContent>
    </Card>
  );

  const renderAlerts = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <span>System Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-sm font-medium">High CPU Usage</div>
                <div className="text-xs text-gray-500">CPU usage is above 80%</div>
              </div>
            </div>
            <Badge variant="outline" className="text-yellow-600">Warning</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-sm font-medium">System Healthy</div>
                <div className="text-xs text-gray-500">All systems operational</div>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600">Normal</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPerformanceMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Performance Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Response Time</span>
              <span className="font-medium">245ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uptime</span>
              <span className="font-medium">99.9%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Error Rate</span>
              <span className="font-medium">0.1%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: '0.1%' }}></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Throughput</span>
              <span className="font-medium">1.2k req/s</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time metrics and performance monitoring</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map(renderMetricCard)}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderChartCard('User Activity', data.charts.userActivity, 'line')}
        {renderChartCard('Workflow Performance', data.charts.workflowPerformance, 'line')}
        {renderChartCard('Error Rate', data.charts.errorRate, 'line')}
        {renderChartCard('Resource Usage', data.charts.resourceUsage, 'line')}
      </div>

      {/* Alerts and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderAlerts()}
        {renderPerformanceMetrics()}
      </div>
    </div>
  );
}; 