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
  getQueueStats
} from '../controllers/workflow.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

// Apply auth middleware to all workflow routes
router.use(authMiddleware);

// CRUD operations
router.post('/', asyncHandler(createWorkflow));
router.get('/', asyncHandler(getWorkflows));
router.get('/:workflowId', asyncHandler(getWorkflow));
router.put('/:workflowId', asyncHandler(updateWorkflow));
router.delete('/:workflowId', asyncHandler(deleteWorkflow));

// Execution and triggers
router.post('/:workflowId/execute', asyncHandler(runWorkflow));
router.post('/:workflowId/run', asyncHandler(runWorkflow));
router.post('/:workflowId/schedule', asyncHandler(scheduleWorkflow));
router.post('/:workflowId/webhook', asyncHandler(createWebhookTrigger));
router.post('/webhook/:webhookId/trigger', asyncHandler(triggerWebhook));
router.delete('/:workflowId/trigger', asyncHandler(stopWorkflowTrigger));

// History and logs
router.get('/:workflowId/logs', asyncHandler(getWorkflowLogs));
router.get('/stats', asyncHandler(getWorkflowStats));
router.get('/queue/stats', asyncHandler(getQueueStats));

export default router; 