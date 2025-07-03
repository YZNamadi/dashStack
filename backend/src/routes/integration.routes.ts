import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
} from '../controllers/integration.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

/**
 * @openapi
 * /projects/{projectId}/integrations:
 *   get:
 *     tags:
 *       - Integrations
 *     summary: Get all integrations for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of integrations
 */
router.get('/', asyncHandler(getIntegrations));

/**
 * @openapi
 * /projects/{projectId}/integrations/{integrationId}:
 *   get:
 *     tags:
 *       - Integrations
 *     summary: Get an integration by ID
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration details
 *       404:
 *         description: Integration not found
 */
router.get('/:integrationId', asyncHandler(getIntegration));

/**
 * @openapi
 * /projects/{projectId}/integrations:
 *   post:
 *     tags:
 *       - Integrations
 *     summary: Create a new integration
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               type:
 *                 type: string
 *               config:
 *                 type: object
 *             required:
 *               - name
 *               - type
 *               - config
 *     responses:
 *       201:
 *         description: Integration created
 *       400:
 *         description: Invalid input
 */
router.post('/', asyncHandler(createIntegration));

/**
 * @openapi
 * /projects/{projectId}/integrations/{integrationId}:
 *   put:
 *     tags:
 *       - Integrations
 *     summary: Update an integration
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: integrationId
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
 *               type:
 *                 type: string
 *               config:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Integration updated
 *       404:
 *         description: Integration not found
 */
router.put('/:integrationId', asyncHandler(updateIntegration));

/**
 * @openapi
 * /projects/{projectId}/integrations/{integrationId}:
 *   delete:
 *     tags:
 *       - Integrations
 *     summary: Delete an integration
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration deleted
 *       404:
 *         description: Integration not found
 */
router.delete('/:integrationId', asyncHandler(deleteIntegration));

/**
 * @openapi
 * /projects/{projectId}/integrations/{integrationId}/test:
 *   post:
 *     tags:
 *       - Integrations
 *     summary: Test an integration connection
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test connection successful
 *       404:
 *         description: Integration not found
 */
router.post('/:integrationId/test', asyncHandler(testIntegration));

export default router; 