import { Request, Response, RequestHandler } from 'express';
import { RBACService } from '../services/rbac.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Initialize RBAC system with default roles and permissions
 */
export const initializeRBAC: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await RBACService.initializeRBAC();
    
    // Log the initialization
    await AuditService.logEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'rbac_initialized',
      resource: 'system',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high',
    });

    res.json({ 
      success: true, 
      message: 'RBAC system initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing RBAC:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize RBAC system' 
    });
  }
};

/**
 * Get all roles
 */
export const getRoles: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await RBACService.getAllRoles();
    res.json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch roles' 
    });
  }
};

/**
 * Get all permissions
 */
export const getPermissions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await RBACService.getAllPermissions();
    res.json({ success: true, permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch permissions' 
    });
  }
};

/**
 * Create a new role
 */
export const createRole: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, permissions, parentRoleId } = req.body;

    if (!name) {
      res.status(400).json({ 
        success: false, 
        message: 'Role name is required' 
      });
      return;
    }

    const role = await RBACService.createRole({
      name,
      description,
      permissions,
      parentRoleId,
    });

    // Log the role creation
    await AuditService.logCRUDEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'create',
      resource: 'role',
      resourceId: role.id,
      resourceName: role.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json({ success: true, role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create role' 
    });
  }
};

/**
 * Update a role
 */
export const updateRole: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, permissions, parentRoleId } = req.body;

    const role = await RBACService.updateRole(id, {
      name,
      description,
      permissions,
      parentRoleId,
    });

    // Log the role update
    await AuditService.logCRUDEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'update',
      resource: 'role',
      resourceId: role.id,
      resourceName: role.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ success: true, role });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update role' 
    });
  }
};

/**
 * Delete a role
 */
export const deleteRole: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const role = await RBACService.getAllRoles().then(roles => 
      roles.find(r => r.id === id)
    );

    await RBACService.deleteRole(id);

    // Log the role deletion
    await AuditService.logCRUDEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'delete',
      resource: 'role',
      resourceId: id,
      resourceName: role?.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ 
      success: true, 
      message: 'Role deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    if (error instanceof Error && error.message.includes('system roles')) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete role' 
      });
    }
  }
};

/**
 * Get user roles and permissions
 */
export const getUserRoles: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await RBACService.getUserWithRoles(userId);

    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    // Aggregate roles
    const roles = (user.userRoles || []).map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
    }));

    // Aggregate permissions
    const allPermissions = new Set<string>();
    for (const userRole of user.userRoles || []) {
      const rolePermissions = await RBACService.getEffectivePermissions(userRole.role.id);
      rolePermissions.forEach((perm: any) => {
        allPermissions.add(`${perm.resource}:${perm.action}`);
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
        permissions: Array.from(allPermissions),
      }
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user roles' 
    });
  }
};

/**
 * Assign a role to a user
 */
export const assignRoleToUser: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      res.status(400).json({ 
        success: false, 
        message: 'User ID and Role ID are required' 
      });
      return;
    }

    const user = await RBACService.getUserWithRoles(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    await RBACService.assignRoleToUser(userId, roleId);

    // Log the role assignment
    await AuditService.logPermissionEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'role_assigned',
      resource: 'user_role',
      resourceId: userId,
      targetUserId: userId,
      targetUserName: user.name ?? undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { roleId }
    });

    res.json({ 
      success: true, 
      message: 'Role assigned successfully' 
    });
  } catch (error) {
    console.error('Error assigning role to user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign role to user' 
    });
  }
};

/**
 * Remove a role from a user
 */
export const removeRoleFromUser: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      res.status(400).json({ 
        success: false, 
        message: 'User ID and Role ID are required' 
      });
      return;
    }

    const user = await RBACService.getUserWithRoles(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    await RBACService.removeRoleFromUser(userId, roleId);

    // Log the role removal
    await AuditService.logPermissionEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'role_removed',
      resource: 'user_role',
      resourceId: userId,
      targetUserId: userId,
      targetUserName: user.name ?? undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { roleId }
    });

    res.json({ 
      success: true, 
      message: 'Role removed successfully' 
    });
  } catch (error) {
    console.error('Error removing role from user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove role from user' 
    });
  }
};

/**
 * Check if user has permission
 */
export const checkPermission: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, permission } = req.params;

    if (!userId || !permission) {
      res.status(400).json({ 
        success: false, 
        message: 'User ID and permission are required' 
      });
      return;
    }

    const [resource, action] = permission.split(':');
    if (!resource || !action) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid permission format. Expected format: resource:action' 
      });
      return;
    }

    const hasPermission = await RBACService.hasPermission(userId, resource, action);

    res.json({ 
      success: true, 
      hasPermission,
      userId,
      permission
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check permission' 
    });
  }
};

/**
 * Get permissions for a specific role
 */
export const getRolePermissions: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;
    const permissions = await RBACService.getEffectivePermissions(roleId);

    res.json({ 
      success: true, 
      roleId,
      permissions
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch role permissions' 
    });
  }
}; 