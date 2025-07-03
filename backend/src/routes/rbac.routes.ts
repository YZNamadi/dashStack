import express from 'express';
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
import { rbacMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @openapi
 * /rbac/initialize:
 *   post:
 *     tags:
 *       - RBAC
 *     summary: Initialize RBAC system with default roles and permissions
 *     responses:
 *       200:
 *         description: RBAC initialized
 */
router.post('/initialize', asyncHandler(initializeRBAC));

/**
 * @openapi
 * /rbac/roles:
 *   post:
 *     tags:
 *       - RBAC
 *     summary: Create a new role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               parentRoleId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Role created
 */
router.post('/roles', rbacMiddleware(['role:create']), asyncHandler(createRole));

/**
 * @openapi
 * /rbac/roles:
 *   get:
 *     tags:
 *       - RBAC
 *     summary: Get all roles
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/roles', rbacMiddleware(['role:read']), asyncHandler(getRoles));

/**
 * @openapi
 * /rbac/roles/{id}:
 *   put:
 *     tags:
 *       - RBAC
 *     summary: Update a role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               parentRoleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         description: Role not found
 */
router.put('/roles/:id', rbacMiddleware(['role:update']), asyncHandler(updateRole));

/**
 * @openapi
 * /rbac/roles/{id}:
 *   delete:
 *     tags:
 *       - RBAC
 *     summary: Delete a role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted
 *       404:
 *         description: Role not found
 */
router.delete('/roles/:id', rbacMiddleware(['role:delete']), asyncHandler(deleteRole));

/**
 * @openapi
 * /rbac/permissions:
 *   get:
 *     tags:
 *       - RBAC
 *     summary: Get all permissions
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/permissions', rbacMiddleware(['permission:read']), asyncHandler(getPermissions));

/**
 * @openapi
 * /rbac/roles/{roleId}/permissions:
 *   get:
 *     tags:
 *       - RBAC
 *     summary: Get permissions for a role
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of permissions for the role
 *       404:
 *         description: Role not found
 */
router.get('/roles/:roleId/permissions', rbacMiddleware(['permission:read']), asyncHandler(getRolePermissions));

/**
 * @openapi
 * /rbac/users/assign-role:
 *   post:
 *     tags:
 *       - RBAC
 *     summary: Assign a role to a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *               resourceId:
 *                 type: string
 *             required:
 *               - userId
 *               - roleId
 *     responses:
 *       200:
 *         description: Role assigned to user
 *       404:
 *         description: User or role not found
 */
router.post('/users/assign-role', rbacMiddleware(['user:assign_role']), asyncHandler(assignRoleToUser));

/**
 * @openapi
 * /rbac/users/remove-role:
 *   post:
 *     tags:
 *       - RBAC
 *     summary: Remove a role from a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *               resourceId:
 *                 type: string
 *             required:
 *               - userId
 *               - roleId
 *     responses:
 *       200:
 *         description: Role removed from user
 *       404:
 *         description: User or role not found
 */
router.post('/users/remove-role', rbacMiddleware(['user:remove_role']), asyncHandler(removeRoleFromUser));

/**
 * @openapi
 * /rbac/users/{userId}/roles:
 *   get:
 *     tags:
 *       - RBAC
 *     summary: Get roles for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of roles for the user
 *       404:
 *         description: User not found
 */
router.get('/users/:userId/roles', rbacMiddleware(['user:read']), asyncHandler(getUserRoles));

/**
 * @openapi
 * /rbac/check-permission:
 *   post:
 *     tags:
 *       - RBAC
 *     summary: Check if a user has a specific permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               permission:
 *                 type: string
 *             required:
 *               - userId
 *               - permission
 *     responses:
 *       200:
 *         description: Permission check result
 */
router.post('/check-permission', asyncHandler(checkPermission));

export default router; 