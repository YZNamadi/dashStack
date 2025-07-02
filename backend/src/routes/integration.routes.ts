import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { getIntegrations, getIntegration, createIntegration, updateIntegration, deleteIntegration, testIntegration } from '../controllers/integration.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', asyncHandler(getIntegrations));
router.get('/:integrationId', asyncHandler(getIntegration));
router.post('/', asyncHandler(createIntegration));
router.put('/:integrationId', asyncHandler(updateIntegration));
router.delete('/:integrationId', asyncHandler(deleteIntegration));
router.post('/:integrationId/test', asyncHandler(testIntegration));

export default router; 