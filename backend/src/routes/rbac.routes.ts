import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import {
  initializeRBAC,
  createRole,
  getRoles,
  updateRole,
  deleteRole,
  getPermissions,
  getRolePermissions,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  checkPermission
} from '../controllers/rbac.controller';
import { authMiddleware, rbacMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all RBAC routes
router.use(authMiddleware);

// Route for initializing the RBAC system. 
router.post('/initialize', asyncHandler(initializeRBAC));

// Role management
router.post('/roles', rbacMiddleware(['role:create']), asyncHandler(createRole));
router.get('/roles', rbacMiddleware(['role:read']), asyncHandler(getRoles));
router.put('/roles/:id', rbacMiddleware(['role:update']), asyncHandler(updateRole));
router.delete('/roles/:id', rbacMiddleware(['role:delete']), asyncHandler(deleteRole));

// Permission management
router.get('/permissions', rbacMiddleware(['permission:read']), asyncHandler(getPermissions));
router.get('/roles/:roleId/permissions', rbacMiddleware(['permission:read']), asyncHandler(getRolePermissions));

// User role management
router.post('/users/assign-role', rbacMiddleware(['user:assign_role']), asyncHandler(assignRoleToUser));
router.post('/users/remove-role', rbacMiddleware(['user:remove_role']), asyncHandler(removeRoleFromUser));
router.get('/users/:userId/roles', rbacMiddleware(['user:read']), asyncHandler(getUserRoles));

// Permission checking
router.post('/check-permission', asyncHandler(checkPermission));

export default router; 