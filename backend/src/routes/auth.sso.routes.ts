import express from 'express';
import ssoController from '../controllers/auth.sso.controller';

const router = express.Router();

router.use('/', ssoController);

export default router; 