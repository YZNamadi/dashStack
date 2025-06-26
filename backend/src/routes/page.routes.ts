import { Router } from 'express';
import { createPage, getPage, updatePage } from '../controllers/page.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', createPage);
router.get('/:pageId', getPage);
router.put('/:pageId', updatePage);

export default router; 