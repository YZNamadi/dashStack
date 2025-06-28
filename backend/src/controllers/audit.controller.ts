import { Request, Response, RequestHandler } from 'express';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Get audit events with filtering
 */
export const getAuditEvents: RequestHandler = async (req: Request, res: Response): Promise<void> => {
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
    console.error('Error fetching audit events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit events',
    });
  }
};

/**
 * Get audit statistics
 */
export const getAuditStats: RequestHandler = async (req: Request, res: Response): Promise<void> => {
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
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
    });
  }
};

/**
 * Export audit events to CSV
 */
export const exportAuditEvents: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      userId,
      action,
      resource,
      severity,
      status,
      startDate,
      endDate,
    } = req.query;

    const filters = {
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      severity: severity as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const csvData = await AuditService.exportAuditEvents(filters);

    // Log the export event
    await AuditService.logDataAccessEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
      action: 'export',
      resource: 'audit',
      format: 'CSV',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details: { filters },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting audit events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit events',
    });
  }
};

/**
 * Clean up old audit events
 */
export const cleanupOldEvents: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { retentionDays = 90 } = req.body;

    const deletedCount = await AuditService.cleanupOldEvents(retentionDays);

    // Log the cleanup event
    await AuditService.logEvent({
      userId: req.user?.userId,
      userName: req.user?.name,
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
    console.error('Error cleaning up audit events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up audit events',
    });
  }
};

/**
 * Get audit event by ID
 */
export const getAuditEvent: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // This would require adding a method to AuditService
    // For now, we'll use Prisma directly
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

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
    console.error('Error fetching audit event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit event',
    });
  }
};

/**
 * Get recent audit events for dashboard
 */
export const getRecentEvents: RequestHandler = async (req: Request, res: Response): Promise<void> => {
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
    console.error('Error fetching recent audit events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent audit events',
    });
  }
};

/**
 * Get audit events by user
 */
export const getUserAuditEvents: RequestHandler = async (req: Request, res: Response): Promise<void> => {
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
    console.error('Error fetching user audit events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user audit events',
    });
  }
}; 