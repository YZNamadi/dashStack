import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, User, Shield, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export const Settings = () => {
  const { user } = useAuthStore();
  const { getRoles, getPermissions, createRole, updateRole, deleteRole, assignRoleToUser, removeRoleFromUser } = useAppStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rolesData, permissionsData] = await Promise.all([
          getRoles(),
          getPermissions()
        ]);
        setRoles(rolesData);
        setPermissions(permissionsData);
      } catch (error) {
        console.error('Failed to load RBAC data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getRoles, getPermissions]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const selectedPermissions = Array.from(form.querySelectorAll('input[name="permissions"]:checked')).map((el: any) => el.value);
    
    try {
      await createRole({ name, description, permissions: selectedPermissions });
      setShowCreateRoleDialog(false);
      // Reload roles
      const updatedRoles = await getRoles();
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const selectedPermissions = Array.from(form.querySelectorAll('input[name="permissions"]:checked')).map((el: any) => el.value);
    
    try {
      await updateRole(editingRole.id, { name, description, permissions: selectedPermissions });
      setShowEditRoleDialog(false);
      setEditingRole(null);
      // Reload roles
      const updatedRoles = await getRoles();
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      // Reload roles
      const updatedRoles = await getRoles();
      setRoles(updatedRoles);
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">
            Manage your account and system settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              User Profile
            </CardTitle>
            <CardDescription>
              Your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={user?.name || ''} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div>
              <Label>Member Since</Label>
              <Input value={user ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
            </div>
          </CardContent>
        </Card>

        {/* User Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Your Roles & Permissions
            </CardTitle>
            <CardDescription>
              Roles assigned to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="mr-2">
                User
              </Badge>
              <Badge variant="outline" className="mr-2">
                Project Manager
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RBAC Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Role-Based Access Control
            </div>
            <Button 
              onClick={() => setShowCreateRoleDialog(true)}
              className="bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Role
            </Button>
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h3 className="font-medium">{role.name}</h3>
                  <p className="text-sm text-slate-600">{role.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.permissions?.map((permission: string) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingRole(role); setShowEditRoleDialog(true); }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      {showCreateRoleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Role</h2>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <Input name="name" required />
              </div>
              <div>
                <Label>Description</Label>
                <Input name="description" />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permission.name}
                        className="mr-2"
                      />
                      {permission.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Dialog */}
      {showEditRoleDialog && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Role</h2>
            <form onSubmit={handleEditRole} className="space-y-4">
              <div>
                <Label>Role Name</Label>
                <Input name="name" defaultValue={editingRole.name} required />
              </div>
              <div>
                <Label>Description</Label>
                <Input name="description" defaultValue={editingRole.description} />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permission.name}
                        defaultChecked={editingRole.permissions?.includes(permission.name)}
                        className="mr-2"
                      />
                      {permission.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowEditRoleDialog(false); setEditingRole(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white">
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
