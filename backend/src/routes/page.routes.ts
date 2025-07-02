import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { createPage, getPage, updatePage, getPageVersions, revertPageVersion } from '../controllers/page.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, asyncHandler(createPage));
router.get('/:pageId', authMiddleware, asyncHandler(getPage));
router.put('/:pageId', authMiddleware, asyncHandler(updatePage));
router.get('/:pageId/versions', authMiddleware, asyncHandler(getPageVersions));
router.post('/:pageId/versions/:versionId/revert', authMiddleware, asyncHandler(revertPageVersion));

export default router; 