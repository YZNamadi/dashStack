import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  runWorkflow,
  scheduleWorkflow,
  createWebhookTrigger,
  triggerWebhook,
  stopWorkflowTrigger,
  getWorkflowLogs,
  getWorkflowStats,
  getQueueStats,
  getWorkflowVersions,
  getWorkflowVersion,
  revertWorkflowVersion
} from '../controllers/workflow.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

// Apply auth middleware to all workflow routes
router.use(authMiddleware);

/**
 * @openapi
 * /projects/{projectId}/workflows:
 *   post:
 *     tags:
 *       - Workflows
 *     summary: Create a new workflow
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
 *               trigger:
 *                 type: string
 *               type:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *             required:
 *               - name
 *               - trigger
 *               - type
 *               - code
 *     responses:
 *       201:
 *         description: Workflow created
 *       400:
 *         description: Invalid input
 */
router.post('/', asyncHandler(createWorkflow));

/**
 * @openapi
 * /projects/{projectId}/workflows:
 *   get:
 *     tags:
 *       - Workflows
 *     summary: Get all workflows for a project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of workflows
 */
router.get('/', asyncHandler(getWorkflows));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}:
 *   get:
 *     tags:
 *       - Workflows
 *     summary: Get a workflow by ID
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow details
 *       404:
 *         description: Workflow not found
 */
router.get('/:workflowId', asyncHandler(getWorkflow));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}:
 *   put:
 *     tags:
 *       - Workflows
 *     summary: Update a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
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
 *               trigger:
 *                 type: string
 *               type:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *             required:
 *               - name
 *               - trigger
 *               - type
 *               - code
 *     responses:
 *       200:
 *         description: Workflow updated
 *       404:
 *         description: Workflow not found
 */
router.put('/:workflowId', asyncHandler(updateWorkflow));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}:
 *   delete:
 *     tags:
 *       - Workflows
 *     summary: Delete a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow deleted
 *       404:
 *         description: Workflow not found
 */
router.delete('/:workflowId', asyncHandler(deleteWorkflow));

// Execution and triggers
/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/execute:
 *   post:
 *     tags:
 *       - Workflows
 *     summary: Execute a workflow (alias for run)
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Workflow executed
 *       404:
 *         description: Workflow not found
 */
router.post('/:workflowId/execute', asyncHandler(runWorkflow));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/run:
 *   post:
 *     tags:
 *       - Workflows
 *     summary: Run a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Workflow run
 *       404:
 *         description: Workflow not found
 */
router.post('/:workflowId/run', asyncHandler(runWorkflow));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/schedule:
 *   post:
 *     tags:
 *       - Workflows
 *     summary: Schedule a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
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
 *               cron:
 *                 type: string
 *             required:
 *               - cron
 *     responses:
 *       200:
 *         description: Workflow scheduled
 *       404:
 *         description: Workflow not found
 */
router.post('/:workflowId/schedule', asyncHandler(scheduleWorkflow));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/webhook:
 *   post:
 *     tags:
 *       - Workflows
 *     summary: Create a webhook trigger for a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
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
 *               url:
 *                 type: string
 *             required:
 *               - url
 *     responses:
 *       201:
 *         description: Webhook trigger created
 *       404:
 *         description: Workflow not found
 */
router.post('/:workflowId/webhook', asyncHandler(createWebhookTrigger));

/**
 * @openapi
 * /projects/{projectId}/workflows/webhook/{webhookId}/trigger:
 *   post:
 *     tags:
 *       - Workflows
 *     summary: Trigger a workflow via webhook
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Workflow triggered
 *       404:
 *         description: Webhook not found
 */
router.post('/webhook/:webhookId/trigger', asyncHandler(triggerWebhook));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/trigger:
 *   delete:
 *     tags:
 *       - Workflows
 *     summary: Stop a workflow trigger
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow trigger stopped
 *       404:
 *         description: Workflow not found
 */
router.delete('/:workflowId/trigger', asyncHandler(stopWorkflowTrigger));

// History and logs
/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/logs:
 *   get:
 *     tags:
 *       - Workflows
 *     summary: Get logs for a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow logs
 *       404:
 *         description: Workflow not found
 */
router.get('/:workflowId/logs', asyncHandler(getWorkflowLogs));

/**
 * @openapi
 * /projects/{projectId}/workflows/stats:
 *   get:
 *     tags:
 *       - Workflows
 *     summary: Get workflow statistics
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow statistics
 */
router.get('/stats', asyncHandler(getWorkflowStats));

/**
 * @openapi
 * /projects/{projectId}/workflows/queue/stats:
 *   get:
 *     tags:
 *       - Workflows
 *     summary: Get workflow queue statistics
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow queue statistics
 */
router.get('/queue/stats', asyncHandler(getQueueStats));

// Versioning endpoints
/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/versions:
 *   get:
 *     tags:
 *       - Workflows
 *     summary: Get all versions of a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of workflow versions
 *       404:
 *         description: Workflow not found
 */
router.get('/:workflowId/versions', asyncHandler(getWorkflowVersions));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/versions/{versionId}:
 *   get:
 *     tags:
 *       - Workflows
 *     summary: Get a specific version of a workflow
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow version details
 *       404:
 *         description: Workflow or version not found
 */
router.get('/:workflowId/versions/:versionId', asyncHandler(getWorkflowVersion));

/**
 * @openapi
 * /projects/{projectId}/workflows/{workflowId}/versions/{versionId}/revert:
 *   post:
 *     tags:
 *       - Workflows
 *     summary: Revert a workflow to a previous version
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow reverted
 *       404:
 *         description: Workflow or version not found
 */
router.post('/:workflowId/versions/:versionId/revert', asyncHandler(revertWorkflowVersion));

export default router; 