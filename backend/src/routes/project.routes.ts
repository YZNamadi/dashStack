import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { createProject, getProjects, getProjectById, renameProject, deleteProject } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import pageRoutes from './page.routes';
import datasourceRoutes from './datasource.routes';
import workflowRoutes from './workflow.routes';

const router = Router();

/**
 * @openapi
 * /projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a new project
 *     security:
 *       - bearerAuth: []
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
 *         description: Project created
 *       400:
 *         description: Invalid input
 */
router.post('/', authMiddleware, asyncHandler(createProject));

/**
 * @openapi
 * /projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get all projects for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', authMiddleware, asyncHandler(getProjects));

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get a project by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:id', authMiddleware, asyncHandler(getProjectById));

/**
 * @openapi
 * /projects/{id}:
 *   put:
 *     tags:
 *       - Projects
 *     summary: Rename a project
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Project renamed
 *       404:
 *         description: Project not found
 */
router.put('/:id', authMiddleware, asyncHandler(renameProject));

/**
 * @openapi
 * /projects/{id}:
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Delete a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
router.delete('/:id', authMiddleware, asyncHandler(deleteProject));

router.use('/:projectId/pages', authMiddleware, pageRoutes);
router.use('/:projectId/datasources', authMiddleware, datasourceRoutes);
router.use('/:projectId/workflows', authMiddleware, workflowRoutes);

export default router; 