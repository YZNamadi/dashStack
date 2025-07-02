import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { RBACService } from '../services/rbac.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: { 
    userId: string; 
    roles: string[];
    email: string;
    name?: string;
  };
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { 
            userId: string; 
            roles: string[];
            email: string;
            name?: string;
        };
        (req as AuthenticatedRequest).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const rbacMiddleware = (permissions: string[]): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthenticatedRequest;
        const userId = authReq.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        try {
            for (const permission of permissions) {
                const [resource, action] = permission.split(':');
                const hasPermission = await RBACService.hasPermission(userId, resource, action);
                if (hasPermission) {
                    return next();
                }
            }
            res.status(403).json({ message: 'Forbidden: You do not have the required permission' });
        } catch (error) {
            next(error);
        }
    };
}; 