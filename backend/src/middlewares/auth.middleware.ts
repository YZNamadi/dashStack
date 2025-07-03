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

// In-memory brute-force protection for login (upgrade to Redis for production)
const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const bruteForceLoginMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const ip = String(req.ip || (req.connection && (req.connection as any).remoteAddress) || 'unknown');
  const now = Date.now();
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, lastAttempt: now };
  }
  const attempt = loginAttempts[ip];
  // Reset count if window has passed
  if (now - attempt.lastAttempt > WINDOW_MS) {
    attempt.count = 0;
    attempt.lastAttempt = now;
  }
  attempt.lastAttempt = now;
  if (attempt.count >= MAX_ATTEMPTS) {
    res.status(429).json({ message: 'Too many failed login attempts. Please try again later.' });
    return;
  }
  // Attach a helper to increment on failure
  (req as any).incrementLoginAttempt = () => { attempt.count += 1; };
  next();
}; 