import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Play, 
  Square, 
  Save, 
  Settings,
  Zap,
  Database,
  Code,
  Mail,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'output';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

interface WorkflowBuilderProps {
  initialNodes?: WorkflowNode[];
  initialConnections?: WorkflowConnection[];
  onSave?: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => void;
  onRun?: (workflow: { nodes: WorkflowNode[]; connections: WorkflowConnection[] }) => void;
}

const nodeTypes = {
  trigger: [
    { value: 'manual', label: 'Manual Trigger', icon: Play },
    { value: 'schedule', label: 'Scheduled', icon: Clock },
    { value: 'webhook', label: 'Webhook', icon: Zap },
    { value: 'database', label: 'Database Change', icon: Database },
  ],
  action: [
    { value: 'api_call', label: 'API Call', icon: Zap },
    { value: 'database_query', label: 'Database Query', icon: Database },
    { value: 'email', label: 'Send Email', icon: Mail },
    { value: 'file_operation', label: 'File Operation', icon: FileText },
    { value: 'code_execution', label: 'Code Execution', icon: Code },
  ],
  condition: [
    { value: 'if_else', label: 'If/Else', icon: AlertCircle },
    { value: 'switch', label: 'Switch', icon: Settings },
  ],
  output: [
    { value: 'return', label: 'Return Data', icon: CheckCircle },
    { value: 'log', label: 'Log Result', icon: FileText },
  ],
};

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  initialNodes = [],
  initialConnections = [],
  onSave,
  onRun
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [connections, setConnections] = useState<WorkflowConnection[]>(initialConnections);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = (type: WorkflowNode['type'], nodeType: string) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      config: { type: nodeType },
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      connections: [],
    };
    setNodes([...nodes, newNode]);
  };

  const updateNode = (id: string, updates: Partial<WorkflowNode>) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id));
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id));
  };

  const addConnection = (from: string, to: string) => {
    const newConnection: WorkflowConnection = {
      id: `conn_${Date.now()}`,
      from,
      to,
    };
    setConnections([...connections, newConnection]);
    
    // Update node connections
    setNodes(nodes.map(node => {
      if (node.id === from) {
        return { ...node, connections: [...node.connections, to] };
      }
      return node;
    }));
  };

  const removeConnection = (id: string) => {
    const connection = connections.find(conn => conn.id === id);
    if (connection) {
      setNodes(nodes.map(node => {
        if (node.id === connection.from) {
          return { ...node, connections: node.connections.filter(conn => conn !== connection.to) };
        }
        return node;
      }));
    }
    setConnections(connections.filter(conn => conn.id !== id));
  };

  const runWorkflow = async () => {
    setIsRunning(true);
    setExecutionLog([]);
    
    try {
      // Simulate workflow execution
      const log = (message: string) => {
        setExecutionLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
      };

      log('Starting workflow execution...');
      
      // Find trigger nodes
      const triggers = nodes.filter(node => node.type === 'trigger');
      
      for (const trigger of triggers) {
        log(`Executing trigger: ${trigger.name}`);
        
        // Execute connected nodes
        for (const connectionId of trigger.connections) {
          const connection = connections.find(conn => conn.from === trigger.id && conn.to === connectionId);
          if (connection) {
            const targetNode = nodes.find(node => node.id === connectionId);
            if (targetNode) {
              log(`Executing ${targetNode.type}: ${targetNode.name}`);
              await new Promise(resolve => setTimeout(resolve, 500)); // Simulate execution time
            }
          }
        }
      }
      
      log('Workflow execution completed successfully!');
      onRun?.({ nodes, connections });
    } catch (error) {
      setExecutionLog(prev => [...prev, `Error: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const renderNode = (node: WorkflowNode) => {
    const nodeTypeConfig = nodeTypes[node.type].find(n => n.value === node.config.type);
    const Icon = nodeTypeConfig?.icon || Settings;

    return (
      <div
        key={node.id}
        className={`absolute p-4 border-2 rounded-lg cursor-move bg-white shadow-lg min-w-[200px] ${
          selectedNode === node.id ? 'border-blue-500' : 'border-gray-300'
        }`}
        style={{ left: node.position.x, top: node.position.y }}
        onClick={() => setSelectedNode(node.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4" />
            <span className="font-medium text-sm">{node.name}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {node.type}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Input
            value={node.name}
            onChange={(e) => updateNode(node.id, { name: e.target.value })}
            className="text-sm"
          />
          
          {node.type === 'trigger' && (
            <Select
              value={node.config.type || ''}
              onValueChange={(value) => updateNode(node.id, { config: { ...node.config, type: value } })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select trigger type" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes.trigger.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {node.type === 'action' && (
            <Select
              value={node.config.type || ''}
              onValueChange={(value) => updateNode(node.id, { config: { ...node.config, type: value } })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes.action.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeNode(node.id)}
            className="text-red-600 h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </div>
    );
  };

  const renderConnection = (connection: WorkflowConnection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return null;
    
    const fromX = fromNode.position.x + 200;
    const fromY = fromNode.position.y + 50;
    const toX = toNode.position.x;
    const toY = toNode.position.y + 50;
    
    return (
      <svg
        key={connection.id}
        className="absolute pointer-events-none"
        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
      >
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke="#6b7280"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Builder</h2>
          <p className="text-gray-600">Create visual workflows with drag-and-drop nodes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={runWorkflow}
            disabled={isRunning || nodes.length === 0}
          >
            {isRunning ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'Stop' : 'Run Workflow'}
          </Button>
          <Button onClick={() => onSave?.(nodes, connections)}>
            <Save className="w-4 h-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Node Palette */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Node Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(nodeTypes).map(([type, typeNodes]) => (
                <div key={type}>
                  <Label className="text-sm font-medium text-gray-700 capitalize">{type}</Label>
                  <div className="mt-2 space-y-2">
                    {typeNodes.map((nodeType) => {
                      const Icon = nodeType.icon;
                      return (
                        <Button
                          key={nodeType.value}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => addNode(type as WorkflowNode['type'], nodeType.value)}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {nodeType.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Canvas */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className="relative w-full h-[600px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden"
              >
                {connections.map(renderConnection)}
                {nodes.map(renderNode)}
                
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Drag nodes from the palette to start building your workflow</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
              {executionLog.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 