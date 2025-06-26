import { Router } from 'express';
import { createDatasource, getDatasources, runDatasourceQuery } from '../controllers/datasource.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', createDatasource);
router.get('/', getDatasources);
router.post('/:datasourceId/run', runDatasourceQuery);


export default router; 