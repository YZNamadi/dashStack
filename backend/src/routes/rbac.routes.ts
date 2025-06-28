import { Router } from 'express';
import { 
  initializeRBAC,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  getPermissions,
  getUserRoles,
  assignRoleToUser,
  removeRoleFromUser,
  checkPermission
} from '../controllers/rbac.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all RBAC routes
router.use(authMiddleware);

// Initialize RBAC system
router.post('/initialize', initializeRBAC);

// Role management
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);
router.get('/roles/:roleId/permissions', getRolePermissions);

// Permission management
router.get('/permissions', getPermissions);

// User role management
router.get('/users/:userId/roles', getUserRoles);
router.post('/users/assign-role', assignRoleToUser);
router.post('/users/remove-role', removeRoleFromUser);

// Permission checking
router.post('/check-permission', checkPermission);

export default router; 