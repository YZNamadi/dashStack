import { Router } from 'express';
import { createProject, getProjects, getProjectById } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import pageRoutes from './page.routes';
import datasourceRoutes from './datasource.routes';

const router = Router();

router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);

router.use('/:projectId/pages', pageRoutes);
router.use('/:projectId/datasources', datasourceRoutes);

export default router; 