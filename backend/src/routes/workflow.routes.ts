import { Router } from 'express';
import { 
  createWorkflow, 
  getWorkflows, 
  runWorkflow, 
  scheduleWorkflow, 
  getWorkflowLogs,
  deleteWorkflow
} from '../controllers/workflow.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', createWorkflow);
router.get('/', getWorkflows);
router.post('/:workflowId/run', runWorkflow);
router.post('/:workflowId/schedule', scheduleWorkflow);
router.get('/:workflowId/logs', getWorkflowLogs);
router.delete('/:workflowId', deleteWorkflow);

export default router; 