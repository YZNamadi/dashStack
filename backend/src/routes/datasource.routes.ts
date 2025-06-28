import { Router } from 'express';
import { createDatasource, getDatasources, runDatasourceQuery, deleteDatasource } from '../controllers/datasource.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', createDatasource);
router.get('/', getDatasources);
router.post('/:datasourceId/run', runDatasourceQuery);
router.delete('/:datasourceId', deleteDatasource);

export default router; 