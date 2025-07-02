import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', authMiddleware, asyncHandler(getMe));
router.post('/logout', authMiddleware, asyncHandler(logout));

export default router; 