import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Parser as Json2csvParser } from 'json2csv';
import prisma from '../utils/prisma';

/**
 * Get audit events with filtering
 */
export const getAuditEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      userId,
      action,
      resource,
      severity,
      status,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = req.query;

    const filters = {
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      severity: severity as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const { events, total } = await AuditService.getAuditEvents(filters);

    res.json({
      success: true,
      events,
      total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const stats = await AuditService.getAuditStats(filters);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export audit events to CSV or JSON
 */
export const exportAuditEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { format = 'csv', userId, action, resource, startDate, endDate } = req.query;
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }
    const events = await prisma.auditEvent.findMany({ where });
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(events, null, 2));
    } else {
      const fields = ['id', 'timestamp', 'userId', 'userName', 'action', 'resource', 'resourceId', 'details', 'ipAddress', 'userAgent', 'severity', 'status'];
      const parser = new Json2csvParser({ fields });
      const csv = parser.parse(events);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send(csv);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Clean up old audit events
 */
export const cleanupOldEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { retentionDays = 90 } = req.body;

    const deletedCount = await AuditService.cleanupOldEvents(retentionDays);

    // Log the cleanup event
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'cleanup',
      resource: 'audit',
      details: {
        retentionDays,
        deletedCount,
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
    });

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old audit events`,
      deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit event by ID
 */
export const getAuditEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await prisma.auditEvent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Audit event not found',
      });
      return;
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent audit events for dashboard
 */
export const getRecentEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const { events } = await AuditService.getAuditEvents({
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit events by user
 */
export const getUserAuditEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { events, total } = await AuditService.getAuditEvents({
      userId,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      events,
      total,
      userId,
    });
  } catch (error) {
    next(error);
  }
};

export const getResourceAuditEvents = async (req: Request, res: Response): Promise<void> => {
  // Implementation of getResourceAuditEvents function
}; 