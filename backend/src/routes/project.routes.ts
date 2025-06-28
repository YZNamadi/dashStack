import { Router } from 'express';
import { createProject, getProjects, getProjectById, renameProject, deleteProject } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import pageRoutes from './page.routes';
import datasourceRoutes from './datasource.routes';
import workflowRoutes from './workflow.routes';

const router = Router();

router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', renameProject);
router.delete('/:id', deleteProject);

router.use('/:projectId/pages', pageRoutes);
router.use('/:projectId/datasources', datasourceRoutes);
router.use('/:projectId/workflows', workflowRoutes);

export default router; 