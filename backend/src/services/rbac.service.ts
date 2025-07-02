import { PrismaClient, User, Role, Permission, UserRole, RolePermission } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserWithRoles extends User {
  userRoles: (UserRole & {
    role: Role & {
      permissions: (RolePermission & {
        permission: Permission;
      })[];
    };
  })[];
}

export interface RoleWithPermissions extends Role {
  permissions: (RolePermission & {
    permission: Permission;
  })[];
  childRoles: Role[];
}

export class RBACService {
  // Default permissions for the system
  static readonly DEFAULT_PERMISSIONS = [
    // Project permissions
    { resource: 'project', action: 'read', description: 'View projects' },
    { resource: 'project', action: 'create', description: 'Create projects' },
    { resource: 'project', action: 'update', description: 'Edit projects' },
    { resource: 'project', action: 'delete', description: 'Delete projects' },
    
    // Workflow permissions
    { resource: 'workflow', action: 'read', description: 'View workflows' },
    { resource: 'workflow', action: 'create', description: 'Create workflows' },
    { resource: 'workflow', action: 'update', description: 'Edit workflows' },
    { resource: 'workflow', action: 'delete', description: 'Delete workflows' },
    { resource: 'workflow', action: 'execute', description: 'Execute workflows' },
    
    // Datasource permissions
    { resource: 'datasource', action: 'read', description: 'View datasources' },
    { resource: 'datasource', action: 'create', description: 'Create datasources' },
    { resource: 'datasource', action: 'update', description: 'Edit datasources' },
    { resource: 'datasource', action: 'delete', description: 'Delete datasources' },
    
    // User management permissions
    { resource: 'user', action: 'read', description: 'View users' },
    { resource: 'user', action: 'create', description: 'Create users' },
    { resource: 'user', action: 'update', description: 'Edit users' },
    { resource: 'user', action: 'delete', description: 'Delete users' },
    
    // Role management permissions
    { resource: 'role', action: 'read', description: 'View roles' },
    { resource: 'role', action: 'create', description: 'Create roles' },
    { resource: 'role', action: 'update', description: 'Edit roles' },
    { resource: 'role', action: 'delete', description: 'Delete roles' },
    
    // System permissions
    { resource: 'system', action: 'admin', description: 'Full system access' },
    { resource: 'system', action: 'audit', description: 'View audit logs' },
  ];

  // Default roles for the system
  static readonly DEFAULT_ROLES = [
    {
      name: 'Administrator',
      description: 'Full system access with all permissions',
      isSystem: true,
      permissions: RBACService.DEFAULT_PERMISSIONS.map(p => `${p.resource}:${p.action}`),
    },
    {
      name: 'Manager',
      description: 'Can manage projects, workflows, and team members',
      isSystem: true,
      permissions: [
        'project:read', 'project:create', 'project:update',
        'workflow:read', 'workflow:create', 'workflow:update', 'workflow:execute',
        'datasource:read', 'datasource:create', 'datasource:update',
        'user:read', 'user:create', 'user:update',
      ],
    },
    {
      name: 'Developer',
      description: 'Can create and edit workflows and datasources',
      isSystem: true,
      permissions: [
        'project:read',
        'workflow:read', 'workflow:create', 'workflow:update', 'workflow:execute',
        'datasource:read', 'datasource:create', 'datasource:update',
      ],
    },
    {
      name: 'Viewer',
      description: 'Read-only access to projects and workflows',
      isSystem: true,
      permissions: [
        'project:read',
        'workflow:read',
        'datasource:read',
      ],
    },
  ];

  /**
   * Initialize the RBAC system with default roles and permissions
   */
  static async initializeRBAC() {
    try {
      // Create default permissions
      for (const perm of RBACService.DEFAULT_PERMISSIONS) {
        const existingPermission = await prisma.permission.findFirst({
          where: { 
            resource: perm.resource,
            action: perm.action,
            resourceId: null 
          },
        });
        
        if (!existingPermission) {
          await prisma.permission.create({
            data: {
              resource: perm.resource,
              action: perm.action,
              description: perm.description,
              resourceId: null,
            },
          });
        }
      }

      // Create default roles
      for (const roleData of RBACService.DEFAULT_ROLES) {
        const role = await prisma.role.upsert({
          where: { name: roleData.name },
          update: {},
          create: {
            name: roleData.name,
            description: roleData.description,
            isSystem: roleData.isSystem,
          },
        });

        // Assign permissions to role
        for (const permString of roleData.permissions) {
          const [resource, action] = permString.split(':');
          const permission = await prisma.permission.findFirst({
            where: { 
              resource,
              action,
              resourceId: null
            },
          });

          if (permission) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }

      console.log('RBAC system initialized successfully');
    } catch (error) {
      console.error('Error initializing RBAC system:', error);
      throw error;
    }
  }

  /**
   * Get user with all their roles and permissions
   */
  static async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
                childRoles: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Check if user has a specific permission, optionally for a specific resource
   */
  static async hasPermission(userId: string, resource: string, action: string, resourceId?: string): Promise<boolean> {
    const user = await this.getUserWithRoles(userId);
    if (!user) return false;

    const allPermissions = new Set<string>();

    // Collect all permissions from user's roles
    for (const userRole of user.userRoles) {
      // If resourceId is specified, only consider roles for that resource or global (null resourceId)
      if (resourceId && userRole.resourceId !== null && userRole.resourceId !== resourceId) continue;
      const rolePermissions = await this.getEffectivePermissions(userRole.role.id);
      rolePermissions.forEach(perm => allPermissions.add(`${perm.resource}:${perm.action}`));
    }

    return allPermissions.has(`${resource}:${action}`);
  }

  /**
   * Get effective permissions for a role (including inherited permissions)
   */
  static async getEffectivePermissions(roleId: string): Promise<Permission[]> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        childRoles: true,
      },
    });

    if (!role) return [];

    const permissions = new Set<string>();
    
    // Add direct permissions
    role.permissions.forEach(rp => {
      permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
    });

    // Add inherited permissions from parent role
    if (role.parentRoleId) {
      const parentPermissions = await this.getEffectivePermissions(role.parentRoleId);
      parentPermissions.forEach(perm => {
        permissions.add(`${perm.resource}:${perm.action}`);
      });
    }

    // Convert back to Permission objects
    const permissionStrings = Array.from(permissions);
    const permissionObjects: Permission[] = [];

    for (const permString of permissionStrings) {
      const [resource, action] = permString.split(':');
      const permission = await prisma.permission.findFirst({
        where: { 
          resource,
          action,
          resourceId: null // Global permission
        },
      });
      if (permission) {
        permissionObjects.push(permission);
      }
    }

    return permissionObjects;
  }

  /**
   * Assign a role to a user, optionally for a specific resource
   */
  static async assignRoleToUser(userId: string, roleId: string, resourceId?: string): Promise<void> {
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        resourceId: resourceId || null,
      },
    });

    if (existingUserRole) {
      // Role already assigned, no need to do anything
      return;
    }

    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        resourceId: resourceId || null,
      },
    });
  }

  /**
   * Remove a role from a user, optionally for a specific resource
   */
  static async removeRoleFromUser(userId: string, roleId: string, resourceId?: string): Promise<void> {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        resourceId: resourceId || null,
      },
    });

    if (userRole) {
      await prisma.userRole.delete({
        where: { id: userRole.id },
      });
    }
  }

  /**
   * Create a new role
   */
  static async createRole(data: {
    name: string;
    description?: string;
    permissions?: string[];
    parentRoleId?: string;
  }): Promise<Role> {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        parentRoleId: data.parentRoleId,
      },
    });

    if (data.permissions) {
      for (const permString of data.permissions) {
        const [resource, action] = permString.split(':');
        const permission = await prisma.permission.findFirst({
          where: { 
            resource,
            action,
            resourceId: null // Global permission
          },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    return role;
  }

  /**
   * Update a role
   */
  static async updateRole(roleId: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
    parentRoleId?: string;
  }): Promise<Role> {
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description,
        parentRoleId: data.parentRoleId,
      },
    });

    if (data.permissions !== undefined) {
      // Remove all existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Add new permissions
      for (const permString of data.permissions) {
        const [resource, action] = permString.split(':');
        const permission = await prisma.permission.findFirst({
          where: { 
            resource,
            action,
            resourceId: null // Global permission
          },
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }

    return role;
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (role?.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    await prisma.role.delete({
      where: { id: roleId },
    });
  }

  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<RoleWithPermissions[]> {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        childRoles: true,
      },
    });
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions(): Promise<Permission[]> {
    return prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });
  }
} 