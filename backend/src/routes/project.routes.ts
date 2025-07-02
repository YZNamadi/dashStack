import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { createProject, getProjects, getProjectById, renameProject, deleteProject } from '../controllers/project.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import pageRoutes from './page.routes';
import datasourceRoutes from './datasource.routes';
import workflowRoutes from './workflow.routes';

const router = Router();

router.post('/', authMiddleware, asyncHandler(createProject));
router.get('/', authMiddleware, asyncHandler(getProjects));
router.get('/:id', authMiddleware, asyncHandler(getProjectById));
router.put('/:id', authMiddleware, asyncHandler(renameProject));
router.delete('/:id', authMiddleware, asyncHandler(deleteProject));

router.use('/:projectId/pages', authMiddleware, pageRoutes);
router.use('/:projectId/datasources', authMiddleware, datasourceRoutes);
router.use('/:projectId/workflows', authMiddleware, workflowRoutes);

export default router; 