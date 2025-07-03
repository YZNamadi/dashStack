import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  listGroupUsers,
  assignRoleToGroup,
  removeRoleFromGroup,
  listGroupRoles
} from '../controllers/group.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /groups:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Create a new group
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
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Group created
 */
router.post('/', asyncHandler(createGroup));

/**
 * @openapi
 * /groups:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get all groups
 *     responses:
 *       200:
 *         description: List of groups
 */
router.get('/', asyncHandler(getGroups));

/**
 * @openapi
 * /groups/{id}:
 *   get:
 *     tags:
 *       - Groups
 *     summary: Get group by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *       404:
 *         description: Group not found
 */
router.get('/:id', asyncHandler(getGroupById));

/**
 * @openapi
 * /groups/{id}:
 *   put:
 *     tags:
 *       - Groups
 *     summary: Update a group
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
 *     responses:
 *       200:
 *         description: Group updated
 *       404:
 *         description: Group not found
 */
router.put('/:id', asyncHandler(updateGroup));

/**
 * @openapi
 * /groups/{id}:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Delete a group
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted
 *       404:
 *         description: Group not found
 */
router.delete('/:id', asyncHandler(deleteGroup));

/**
 * @openapi
 * /groups/{groupId}/users:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Add user to group
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               userId:
 *                 type: string
 *             required:
 *               - userId
 *     responses:
 *       201:
 *         description: User added to group
 *       404:
 *         description: Group or user not found
 */
router.post('/:groupId/users', asyncHandler(addUserToGroup));

/**
 * @openapi
 * /groups/{groupId}/users/{userId}:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Remove user from group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed from group
 *       404:
 *         description: Group or user not found
 */
router.delete('/:groupId/users/:userId', asyncHandler(removeUserFromGroup));

/**
 * @openapi
 * /groups/{groupId}/users:
 *   get:
 *     tags:
 *       - Groups
 *     summary: List users in a group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users in group
 *       404:
 *         description: Group not found
 */
router.get('/:groupId/users', asyncHandler(listGroupUsers));

/**
 * @openapi
 * /groups/{groupId}/roles:
 *   post:
 *     tags:
 *       - Groups
 *     summary: Assign role to group
 *     parameters:
 *       - in: path
 *         name: groupId
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
 *               roleId:
 *                 type: string
 *             required:
 *               - roleId
 *     responses:
 *       201:
 *         description: Role assigned to group
 *       404:
 *         description: Group or role not found
 */
router.post('/:groupId/roles', asyncHandler(assignRoleToGroup));

/**
 * @openapi
 * /groups/{groupId}/roles/{roleId}:
 *   delete:
 *     tags:
 *       - Groups
 *     summary: Remove role from group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role removed from group
 *       404:
 *         description: Group or role not found
 */
router.delete('/:groupId/roles/:roleId', asyncHandler(removeRoleFromGroup));

/**
 * @openapi
 * /groups/{groupId}/roles:
 *   get:
 *     tags:
 *       - Groups
 *     summary: List roles assigned to a group
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of roles in group
 *       404:
 *         description: Group not found
 */
router.get('/:groupId/roles', asyncHandler(listGroupRoles));

export default router; 