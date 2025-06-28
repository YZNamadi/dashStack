import { PrismaClient, AuditEvent } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditEventData {
  userId?: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failure' | 'warning';
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async logEvent(data: AuditEventData): Promise<AuditEvent> {
    try {
      const event = await prisma.auditEvent.create({
        data: {
          userId: data.userId,
          userName: data.userName,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          severity: data.severity || 'low',
          status: data.status || 'success',
        },
      });

      console.log(`Audit event logged: ${data.action} on ${data.resource} by ${data.userName || 'unknown'}`);
      return event;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(data: {
    userId?: string;
    userName?: string;
    action: 'login' | 'logout' | 'register' | 'password_reset' | 'password_change';
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<AuditEvent> {
    return this.logEvent({
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      resource: 'auth',
      details: {
        success: data.success,
        ...data.details,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.success ? 'low' : 'medium',
      status: data.success ? 'success' : 'failure',
    });
  }

  /**
   * Log CRUD operations
   */
  static async logCRUDEvent(data: {
    userId?: string;
    userName?: string;
    action: 'create' | 'read' | 'update' | 'delete';
    resource: string;
    resourceId?: string;
    resourceName?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<AuditEvent> {
    return this.logEvent({
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: {
        resourceName: data.resourceName,
        ...data.details,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.action === 'delete' ? 'high' : 'low',
      status: 'success',
    });
  }

  /**
   * Log permission changes
   */
  static async logPermissionEvent(data: {
    userId?: string;
    userName?: string;
    action: 'role_assigned' | 'role_removed' | 'permission_granted' | 'permission_revoked';
    resource: string;
    resourceId?: string;
    targetUserId?: string;
    targetUserName?: string;
    roleName?: string;
    permissionName?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<AuditEvent> {
    return this.logEvent({
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: {
        targetUserId: data.targetUserId,
        targetUserName: data.targetUserName,
        roleName: data.roleName,
        permissionName: data.permissionName,
        ...data.details,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: 'high',
      status: 'success',
    });
  }

  /**
   * Log workflow execution events
   */
  static async logWorkflowEvent(data: {
    userId?: string;
    userName?: string;
    action: 'execute' | 'schedule' | 'cancel' | 'pause' | 'resume';
    workflowId: string;
    workflowName?: string;
    executionId?: string;
    status: 'success' | 'failure' | 'warning';
    executionTime?: number;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<AuditEvent> {
    return this.logEvent({
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      resource: 'workflow',
      resourceId: data.workflowId,
      details: {
        workflowName: data.workflowName,
        executionId: data.executionId,
        executionTime: data.executionTime,
        errorMessage: data.errorMessage,
        ...data.details,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: data.status === 'failure' ? 'medium' : 'low',
      status: data.status,
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccessEvent(data: {
    userId?: string;
    userName?: string;
    action: 'export' | 'import' | 'query' | 'download';
    resource: string;
    resourceId?: string;
    resourceName?: string;
    dataSize?: number;
    recordCount?: number;
    format?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
  }): Promise<AuditEvent> {
    return this.logEvent({
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      details: {
        resourceName: data.resourceName,
        dataSize: data.dataSize,
        recordCount: data.recordCount,
        format: data.format,
        ...data.details,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      severity: 'medium',
      status: 'success',
    });
  }

  /**
   * Get audit events with filtering
   */
  static async getAuditEvents(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: AuditEvent[]; total: number }> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return { events, total };
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(filters: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byResource: Record<string, number>;
    byAction: Record<string, number>;
  }> {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const events = await prisma.auditEvent.findMany({
      where,
      select: {
        severity: true,
        status: true,
        resource: true,
        action: true,
      },
    });

    const stats = {
      total: events.length,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byResource: {} as Record<string, number>,
      byAction: {} as Record<string, number>,
    };

    events.forEach(event => {
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
      stats.byResource[event.resource] = (stats.byResource[event.resource] || 0) + 1;
      stats.byAction[event.action] = (stats.byAction[event.action] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export audit events to CSV
   */
  static async exportAuditEvents(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<string> {
    const { events } = await this.getAuditEvents({ ...filters, limit: 10000 });

    const csvHeaders = [
      'Timestamp',
      'User ID',
      'User Name',
      'Action',
      'Resource',
      'Resource ID',
      'Severity',
      'Status',
      'IP Address',
      'User Agent',
      'Details',
    ];

    const csvRows = events.map(event => [
      event.timestamp.toISOString(),
      event.userId || '',
      event.userName || '',
      event.action,
      event.resource,
      event.resourceId || '',
      event.severity,
      event.status,
      event.ipAddress || '',
      event.userAgent || '',
      JSON.stringify(event.details || {}),
    ]);

    return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  }

  /**
   * Clean up old audit events (retention policy)
   */
  static async cleanupOldEvents(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditEvent.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} audit events older than ${retentionDays} days`);
    return result.count;
  }
} 