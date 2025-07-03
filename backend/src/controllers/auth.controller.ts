import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { RBACService } from '../services/rbac.service';
import { AuditService } from '../services/audit.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        // Assign default role (Developer) to new user
        const defaultRole = await prisma.role.findFirst({
            where: { name: 'Developer' },
        });

        if (defaultRole) {
            await RBACService.assignRoleToUser(user.id, defaultRole.id);
        }

        // Log the registration event
        await AuditService.logAuthEvent({
            userId: user.id,
            userName: user.name ?? undefined,
            action: 'register',
            success: true,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        });

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            res.status(409).json({ message: 'Email already exists' });
        } else {
            next(error);
        }
    }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user) {
            // Log failed login attempt
            await AuditService.logAuthEvent({
                action: 'login',
                success: false,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                details: { reason: 'User not found' },
            });

            if ((req as any).incrementLoginAttempt) (req as any).incrementLoginAttempt();
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // Log failed login attempt
            await AuditService.logAuthEvent({
                userId: user.id,
                userName: user.name ?? undefined,
                action: 'login',
                success: false,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                details: { reason: 'Invalid password' },
            });

            if ((req as any).incrementLoginAttempt) (req as any).incrementLoginAttempt();
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Get user roles for JWT
        const roles = (user.userRoles || []).map((ur: any) => ur.role.name);

        const token = jwt.sign({
            userId: user.id,
            roles,
            email: user.email,
        }, JWT_SECRET, { expiresIn: '1d' });

        // Log successful login
        await AuditService.logAuthEvent({
            userId: user.id,
            userName: user.name ?? undefined,
            action: 'login',
            success: true,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as AuthenticatedRequest).user;
        if (!user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!dbUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Remove sensitive information
        const { password, ...userWithoutPassword } = dbUser;
        res.json(userWithoutPassword);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as AuthenticatedRequest).user;
        // Log logout event
        await AuditService.logAuthEvent({
            userId: user?.userId,
            userName: user?.name ?? undefined,
            action: 'logout',
            success: true,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
}; 