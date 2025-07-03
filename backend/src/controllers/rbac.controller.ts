import { Request, Response, NextFunction } from 'express';
import { RBACService } from '../services/rbac.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Initialize RBAC system with default roles and permissions
 */
export const initializeRBAC = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await RBACService.initializeRBAC();
    
    // Log the initialization
    await AuditService.logEvent({
      userId: (req as AuthenticatedRequest).user?.userId,
      userName: (req as AuthenticatedRequest).user?.name,
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
    next(error);
  }
};

/**
 * Get all roles
 */
export const getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roles = await RBACService.getAllRoles();
    res.json({ success: true, roles });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all permissions
 */
export const getPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const permissions = await RBACService.getAllPermissions();
    res.json({ success: true, permissions });
  } catch (error) {
    next(error);
  }
};

/**
/**
 * Create a new role
 */
export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, permissions, parentRoleId, organizationId } = req.body;
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
      organizationId,
    });

    // Log the role creation
    await AuditService.logCRUDEvent({
      userId: (req as AuthenticatedRequest).user?.userId,
      userName: (req as AuthenticatedRequest).user?.name,
      action: 'create',
      resource: 'role',
      resourceId: role.id,
      resourceName: role.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json({ success: true, role });
  } catch (error) {
    next(error);
  }
};

/**
/**
 * Update a role
 */
export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      userId: (req as AuthenticatedRequest).user?.userId,
      userName: (req as AuthenticatedRequest).user?.name,
      action: 'update',
      resource: 'role',
      resourceId: role.id,
      resourceName: role.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({ success: true, role });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const role = await RBACService.getAllRoles().then(roles => 
      roles.find(r => r.id === id)
    );

    await RBACService.deleteRole(id);

    // Log the role deletion
    await AuditService.logCRUDEvent({
      userId: (req as AuthenticatedRequest).user?.userId,
      userName: (req as AuthenticatedRequest).user?.name,
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
    if (error instanceof Error && error.message.includes('system roles')) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      next(error);
    }
  }
};

/**
 * Get user roles and permissions
 */
export const getUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    next(error);
  }
};

/**
/**
 * Assign a role to a user (optionally for a specific resource)
 */
export const assignRoleToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, roleId, resourceId, organizationId } = req.body;
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
    await RBACService.assignRoleToUser(userId, roleId, resourceId, organizationId);

    // Log the role assignment
    await AuditService.logPermissionEvent({
      userId: (req as AuthenticatedRequest).user?.userId,
      userName: (req as AuthenticatedRequest).user?.name,
      action: 'role_assigned',
      resource: 'user_role',
      resourceId: userId,
      targetUserId: userId,
      targetUserName: user.name ?? undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { roleId, resourceId }
    });

    res.json({ 
      success: true, 
      message: 'Role assigned successfully' 
    });
  } catch (error) {
    next(error);
  }
};

/**
/**
 * Remove a role from a user (optionally for a specific resource)
 */
export const removeRoleFromUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, roleId, resourceId, organizationId } = req.body;
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
    await RBACService.removeRoleFromUser(userId, roleId, resourceId, organizationId);

    // Log the role removal
    await AuditService.logPermissionEvent({
      userId: (req as AuthenticatedRequest).user?.userId,
      userName: (req as AuthenticatedRequest).user?.name,
      action: 'role_removed',
      resource: 'user_role',
      resourceId: userId,
      targetUserId: userId,
      targetUserName: user.name ?? undefined,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { roleId, resourceId }
    });

    res.json({ 
      success: true, 
      message: 'Role removed successfully' 
    });
  } catch (error) {
    next(error);
  }
};

/**
/**
 * Check if a user has a permission (optionally for a specific resource)
 */
export const checkPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, permission, resourceId, organizationId } = req.body;
    if (!userId || !permission) {
      res.status(400).json({ success: false, message: 'User ID and permission are required' });
      return;
    }
    const [resource, action] = permission.split(':');
    const hasPerm = await RBACService.hasPermission(userId, resource, action, resourceId, organizationId);
    res.json({ success: true, hasPermission: hasPerm });
  } catch (error) {
    next(error);
  }
};

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const permissions = await RBACService.getEffectivePermissions(roleId);

    res.json({ 
      success: true, 
      roleId,
      permissions
    });
  } catch (error) {
    next(error);
  }
}; 