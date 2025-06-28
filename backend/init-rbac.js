const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Default permissions for the system
const DEFAULT_PERMISSIONS = [
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
const DEFAULT_ROLES = [
  {
    name: 'Administrator',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: DEFAULT_PERMISSIONS.map(p => `${p.resource}:${p.action}`),
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

async function initializeRBAC() {
  try {
    console.log('Initializing RBAC system...');

    // Create default permissions
    for (const perm of DEFAULT_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
        update: {},
        create: {
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        },
      });
    }
    console.log('✓ Permissions created');

    // Create default roles
    for (const roleData of DEFAULT_ROLES) {
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
        const permission = await prisma.permission.findUnique({
          where: { resource_action: { resource, action } },
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
    console.log('✓ Roles created');

    console.log('RBAC system initialized successfully!');
  } catch (error) {
    console.error('Error initializing RBAC system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeRBAC(); 