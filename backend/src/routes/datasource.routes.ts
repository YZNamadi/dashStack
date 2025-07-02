import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { createDatasource, getDatasources, runDatasourceQuery, deleteDatasource, testDatasourceConnection, getDatasourceSchema, updateDatasource } from '../controllers/datasource.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, asyncHandler(createDatasource));
router.get('/', authMiddleware, asyncHandler(getDatasources));
router.put('/:datasourceId', authMiddleware, asyncHandler(updateDatasource));
router.post('/:datasourceId/run', authMiddleware, asyncHandler(runDatasourceQuery));
router.delete('/:datasourceId', authMiddleware, asyncHandler(deleteDatasource));

// New advanced datasource routes
router.post('/test-connection', authMiddleware, asyncHandler(testDatasourceConnection));
router.get('/:datasourceId/schema', authMiddleware, asyncHandler(getDatasourceSchema));

export default router; 