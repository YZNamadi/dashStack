import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { RBACService } from '../services/rbac.service';
import { AuditService } from '../services/audit.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
    }

    try {
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
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Error creating user', error });
        }
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
    }

    try {
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
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error });
    }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Get effective permissions for all user roles
        const allPermissions = new Set<string>();
        for (const userRole of user.userRoles || []) {
            const rolePermissions = await RBACService.getEffectivePermissions(userRole.role.id);
            rolePermissions.forEach((perm: any) => {
                allPermissions.add(`${perm.resource}:${perm.action}`);
            });
        }

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            isActive: user.isActive,
            createdAt: user.createdAt,
            roles: (user.userRoles || []).map((ur: any) => ({
                id: ur.role.id,
                name: ur.role.name,
                description: ur.role.description,
            })),
            permissions: Array.from(allPermissions),
        };

        res.json(userData);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error });
    }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Log logout event
        await AuditService.logAuthEvent({
            userId: req.user?.userId,
            userName: req.user?.name ?? undefined,
            action: 'logout',
            success: true,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error logging out', error });
    }
}; 