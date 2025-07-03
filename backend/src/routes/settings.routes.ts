import express from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authMiddleware, rbacMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

router.get('/', rbacMiddleware(['setting:read']), SettingsController.listSettings);
router.get('/item', rbacMiddleware(['setting:read']), SettingsController.getSetting);
router.post('/', rbacMiddleware(['setting:update']), SettingsController.setSetting);
router.delete('/', rbacMiddleware(['setting:delete']), SettingsController.deleteSetting);

export default router; 