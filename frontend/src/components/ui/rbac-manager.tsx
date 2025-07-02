import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  Settings,
  Save
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  inheritsFrom?: string[];
  isSystem?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
}

interface RBACManagerProps {
  initialRoles?: Role[];
  initialUsers?: User[];
  onSave?: (roles: Role[], users: User[]) => void;
}

const defaultPermissions: Permission[] = [
  // Project permissions
  { id: 'project:read', resource: 'project', action: 'read', description: 'View projects' },
  { id: 'project:create', resource: 'project', action: 'create', description: 'Create projects' },
  { id: 'project:update', resource: 'project', action: 'update', description: 'Edit projects' },
  { id: 'project:delete', resource: 'project', action: 'delete', description: 'Delete projects' },
  
  // Workflow permissions
  { id: 'workflow:read', resource: 'workflow', action: 'read', description: 'View workflows' },
  { id: 'workflow:create', resource: 'workflow', action: 'create', description: 'Create workflows' },
  { id: 'workflow:update', resource: 'workflow', action: 'update', description: 'Edit workflows' },
  { id: 'workflow:delete', resource: 'workflow', action: 'delete', description: 'Delete workflows' },
  { id: 'workflow:execute', resource: 'workflow', action: 'execute', description: 'Execute workflows' },
  
  // Datasource permissions
  { id: 'datasource:read', resource: 'datasource', action: 'read', description: 'View datasources' },
  { id: 'datasource:create', resource: 'datasource', action: 'create', description: 'Create datasources' },
  { id: 'datasource:update', resource: 'datasource', action: 'update', description: 'Edit datasources' },
  { id: 'datasource:delete', resource: 'datasource', action: 'delete', description: 'Delete datasources' },
  
  // User management permissions
  { id: 'user:read', resource: 'user', action: 'read', description: 'View users' },
  { id: 'user:create', resource: 'user', action: 'create', description: 'Create users' },
  { id: 'user:update', resource: 'user', action: 'update', description: 'Edit users' },
  { id: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },
  
  // Role management permissions
  { id: 'role:read', resource: 'role', action: 'read', description: 'View roles' },
  { id: 'role:create', resource: 'role', action: 'create', description: 'Create roles' },
  { id: 'role:update', resource: 'role', action: 'update', description: 'Edit roles' },
  { id: 'role:delete', resource: 'role', action: 'delete', description: 'Delete roles' },
  
  // System permissions
  { id: 'system:admin', resource: 'system', action: 'admin', description: 'Full system access' },
  { id: 'system:audit', resource: 'system', action: 'audit', description: 'View audit logs' },
];

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: defaultPermissions.map(p => p.id),
    isSystem: true,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage projects, workflows, and team members',
    permissions: [
      'project:read', 'project:create', 'project:update',
      'workflow:read', 'workflow:create', 'workflow:update', 'workflow:execute',
      'datasource:read', 'datasource:create', 'datasource:update',
      'user:read', 'user:create', 'user:update',
    ],
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Can create and edit workflows and datasources',
    permissions: [
      'project:read',
      'workflow:read', 'workflow:create', 'workflow:update', 'workflow:execute',
      'datasource:read', 'datasource:create', 'datasource:update',
    ],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to projects and workflows',
    permissions: [
      'project:read',
      'workflow:read',
      'datasource:read',
    ],
  },
];

// Add a list of example resources for demonstration
const exampleResources = [
  { id: '', name: 'Global (all resources)' },
  { id: 'integration_1', name: 'Integration 1' },
  { id: 'page_1', name: 'Page 1' },
  { id: 'workflow_1', name: 'Workflow 1' },
];

export const RBACManager: React.FC<RBACManagerProps> = ({
  initialRoles = defaultRoles,
  initialUsers = [],
  onSave
}) => {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'permissions'>('roles');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  const addRole = () => {
    const newRole: Role = {
      id: `role_${Date.now()}`,
      name: 'New Role',
      description: '',
      permissions: [],
    };
    setRoles([...roles, newRole]);
    setSelectedRole(newRole);
  };

  const updateRole = (id: string, updates: Partial<Role>) => {
    setRoles(roles.map(role => 
      role.id === id ? { ...role, ...updates } : role
    ));
  };

  const removeRole = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.isSystem) {
      alert('Cannot delete system roles');
      return;
    }
    setRoles(roles.filter(role => role.id !== id));
    setUsers(users.map(user => ({
      ...user,
      roles: user.roles.filter(roleId => roleId !== id)
    })));
  };

  const addUser = () => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: 'New User',
      email: 'user@example.com',
      roles: [],
      isActive: true,
    };
    setUsers([...users, newUser]);
    setSelectedUser(newUser);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };

  const removeUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const getEffectivePermissions = (role: Role): string[] => {
    const permissions = new Set(role.permissions);
    
    // Add inherited permissions
    if (role.inheritsFrom) {
      role.inheritsFrom.forEach(parentRoleId => {
        const parentRole = roles.find(r => r.id === parentRoleId);
        if (parentRole) {
          getEffectivePermissions(parentRole).forEach(perm => permissions.add(perm));
        }
      });
    }
    
    return Array.from(permissions);
  };

  const hasPermission = (user: User, permission: string): boolean => {
    return user.roles.some(roleId => {
      const role = roles.find(r => r.id === roleId);
      return role ? getEffectivePermissions(role).includes(permission) : false;
    });
  };

  // Modified add role to user logic to support resourceId
  const assignRoleToUser = (userId: string, roleId: string, resourceId?: string) => {
    setUsers(users.map(user => {
      if (user.id !== userId) return user;
      // Store roles as roleId:resourceId for demonstration
      const roleKey = resourceId ? `${roleId}:${resourceId}` : roleId;
      return {
        ...user,
        roles: [...user.roles, roleKey],
      };
    }));
  };

  const removeRoleFromUser = (userId: string, roleId: string, resourceId?: string) => {
    setUsers(users.map(user => {
      if (user.id !== userId) return user;
      const roleKey = resourceId ? `${roleId}:${resourceId}` : roleId;
      return {
        ...user,
        roles: user.roles.filter(r => r !== roleKey),
      };
    }));
  };

  const renderRoleEditor = () => (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Roles</CardTitle>
              <Button onClick={addRole} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roles.map(role => (
                <div
                  key={role.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedRole?.id === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-600">{role.description}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getEffectivePermissions(role).length} permissions
                        </Badge>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </div>
                    </div>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRole(role.id);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedRole && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Edit Role: {selectedRole.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <Input
                  value={selectedRole.name}
                  onChange={(e) => updateRole(selectedRole.id, { name: e.target.value })}
                  disabled={selectedRole.isSystem}
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedRole.description}
                  onChange={(e) => updateRole(selectedRole.id, { description: e.target.value })}
                  disabled={selectedRole.isSystem}
                />
              </div>

              <div>
                <Label>Inherits From</Label>
                <Select
                  value={selectedRole.inheritsFrom?.[0] || ''}
                  onValueChange={(value) => updateRole(selectedRole.id, { inheritsFrom: value ? [value] : undefined })}
                  disabled={selectedRole.isSystem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(role => role.id !== selectedRole.id).map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label>Permissions</Label>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {defaultPermissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Switch
                        checked={selectedRole.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          const newPermissions = checked
                            ? [...selectedRole.permissions, permission.id]
                            : selectedRole.permissions.filter(p => p !== permission.id);
                          updateRole(selectedRole.id, { permissions: newPermissions });
                        }}
                        disabled={selectedRole.isSystem}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{permission.description}</div>
                        <div className="text-xs text-gray-500">{permission.resource}:{permission.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderUserManager = () => (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users</CardTitle>
              <Button onClick={addUser} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {user.roles.length} roles
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUser(user.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Edit User: {selectedUser.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={selectedUser.name}
                  onChange={(e) => updateUser(selectedUser.id, { name: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  value={selectedUser.email}
                  onChange={(e) => updateUser(selectedUser.id, { email: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedUser.isActive}
                  onCheckedChange={(checked) => updateUser(selectedUser.id, { isActive: checked })}
                />
                <Label>Active</Label>
              </div>

              <Separator />

              <div>
                <Label>Roles</Label>
                <div className="mt-2 space-y-2">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Switch
                        checked={selectedUser.roles.includes(role.id)}
                        onCheckedChange={(checked) => {
                          const newRoles = checked
                            ? [...selectedUser.roles, role.id]
                            : selectedUser.roles.filter(r => r !== role.id);
                          updateUser(selectedUser.id, { roles: newRoles });
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{role.name}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Effective Permissions</Label>
                <div className="mt-2 space-y-1">
                  {defaultPermissions.map(permission => (
                    <div key={permission.id} className="flex items-center justify-between text-sm">
                      <span>{permission.description}</span>
                      {hasPermission(selectedUser, permission.id) ? (
                        <Badge variant="default" className="text-xs">✓</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">✗</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <Label className="block mb-1">Resource</Label>
                <select
                  value={selectedResourceId}
                  onChange={e => setSelectedResourceId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {exampleResources.map(res => (
                    <option key={res.id} value={res.id}>{res.name}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => {
                  if (selectedUser && selectedRole) {
                    assignRoleToUser(selectedUser.id, selectedRole.id, selectedResourceId || undefined);
                  }
                }}
                className="mt-2"
              >
                Assign Role to User (Resource-level)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderPermissionsView = () => (
    <Card>
      <CardHeader>
        <CardTitle>System Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaultPermissions.map(permission => (
              <TableRow key={permission.id}>
                <TableCell className="font-mono text-sm">{permission.id}</TableCell>
                <TableCell>
                  <Badge variant="outline">{permission.resource}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{permission.action}</Badge>
                </TableCell>
                <TableCell>{permission.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role-Based Access Control</h2>
          <p className="text-gray-600">Manage roles, permissions, and user access</p>
        </div>
        <Button onClick={() => onSave?.(roles, users)}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="flex space-x-1 border-b">
        <Button
          variant={activeTab === 'roles' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('roles')}
        >
          <Shield className="w-4 h-4 mr-2" />
          Roles
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
        >
          <Users className="w-4 h-4 mr-2" />
          Users
        </Button>
        <Button
          variant={activeTab === 'permissions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('permissions')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Permissions
        </Button>
      </div>

      {activeTab === 'roles' && renderRoleEditor()}
      {activeTab === 'users' && renderUserManager()}
      {activeTab === 'permissions' && renderPermissionsView()}
    </div>
  );
}; 