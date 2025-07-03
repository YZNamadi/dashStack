import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AuditService } from '../services/audit.service';
import archiver from 'archiver';
import { GroupService } from '../services/group.service';
import { RBACService } from '../services/rbac.service';

export const createOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { name, description } = req.body;
    const org = await prisma.organization.create({
      data: { name, description },
    });
    // Add creator as admin member
    await prisma.organizationMembership.create({
      data: { userId: user.userId, organizationId: org.id, role: 'admin' },
    });
    await AuditService.logCRUDEvent({
      userId: user.userId,
      userName: user.name,
      action: 'create',
      resource: 'organization',
      resourceId: org.id,
      resourceName: org.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.status(201).json(org);
  } catch (error) {
    next(error);
  }
};

export const getOrganizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const orgs = await prisma.organization.findMany({
      where: {
        users: { some: { userId: user.userId } },
      },
    });
    res.json(orgs);
  } catch (error) {
    next(error);
  }
};

export const getOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { orgId } = req.params;
    const org = await prisma.organization.findFirst({
      where: {
        id: orgId,
        users: { some: { userId: user.userId } },
      },
    });
    if (!org) {
      res.status(404).json({ message: 'Organization not found or access denied' });
      return;
    }
    res.json(org);
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { orgId } = req.params;
    const { name, description } = req.body;
    // Only admin can update
    const membership = await prisma.organizationMembership.findFirst({ where: { userId: user.userId, organizationId: orgId, role: 'admin' } });
    if (!membership) {
      res.status(403).json({ message: 'Only org admin can update organization' });
      return;
    }
    const org = await prisma.organization.update({ where: { id: orgId }, data: { name, description } });
    await AuditService.logCRUDEvent({
      userId: user.userId,
      userName: user.name,
      action: 'update',
      resource: 'organization',
      resourceId: org.id,
      resourceName: org.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json(org);
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { orgId } = req.params;
    // Only admin can delete
    const membership = await prisma.organizationMembership.findFirst({ where: { userId: user.userId, organizationId: orgId, role: 'admin' } });
    if (!membership) {
      res.status(403).json({ message: 'Only org admin can delete organization' });
      return;
    }
    await prisma.organization.delete({ where: { id: orgId } });
    await AuditService.logCRUDEvent({
      userId: user.userId,
      userName: user.name,
      action: 'delete',
      resource: 'organization',
      resourceId: orgId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({ message: 'Organization deleted' });
  } catch (error) {
    next(error);
  }
};

export const addOrgMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { orgId } = req.params;
    const { userId, role } = req.body;
    // Only admin can add
    const membership = await prisma.organizationMembership.findFirst({ where: { userId: user.userId, organizationId: orgId, role: 'admin' } });
    if (!membership) {
      res.status(403).json({ message: 'Only org admin can add members' });
      return;
    }
    const member = await prisma.organizationMembership.create({ data: { userId, organizationId: orgId, role } });
    await AuditService.logCRUDEvent({
      userId: user.userId,
      userName: user.name,
      action: 'create',
      resource: 'organization',
      resourceId: orgId,
      details: { addedUserId: userId, role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

export const removeOrgMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { orgId, userId } = req.params;
    // Only admin can remove
    const membership = await prisma.organizationMembership.findFirst({ where: { userId: user.userId, organizationId: orgId, role: 'admin' } });
    if (!membership) {
      res.status(403).json({ message: 'Only org admin can remove members' });
      return;
    }
    await prisma.organizationMembership.deleteMany({ where: { userId, organizationId: orgId } });
    await AuditService.logCRUDEvent({
      userId: user.userId,
      userName: user.name,
      action: 'delete',
      resource: 'organization',
      resourceId: orgId,
      details: { removedUserId: userId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({ message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

export const listOrgMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const { orgId } = req.params;
    // Only org members can list
    const membership = await prisma.organizationMembership.findFirst({ where: { userId: user.userId, organizationId: orgId } });
    if (!membership) {
      res.status(403).json({ message: 'Only org members can view members' });
      return;
    }
    const members = await prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(members);
  } catch (error) {
    next(error);
  }
};

/**
 * Export full compliance package (audit logs, org info, users, groups, integrations, workflows, etc.) as a ZIP file
 */
export const exportCompliancePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="compliance-package.zip"');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err: Error) => next(err));
    archive.pipe(res);

    // Audit logs
    const auditEvents = await AuditService.exportAuditEvents({});
    archive.append(JSON.stringify(auditEvents, null, 2), { name: 'audit-events.json' });

    // Organizations
    const orgs = await prisma.organization.findMany();
    archive.append(JSON.stringify(orgs, null, 2), { name: 'organizations.json' });

    // Groups
    const groups = await GroupService.getGroups();
    archive.append(JSON.stringify(groups, null, 2), { name: 'groups.json' });

    // Users & RBAC
    const users = await prisma.user.findMany();
    const usersWithRoles = await Promise.all(users.map((u: any) => RBACService.getUserWithRoles(u.id)));
    archive.append(JSON.stringify(usersWithRoles, null, 2), { name: 'users.json' });

    // Integrations
    const integrations = await prisma.integration.findMany();
    archive.append(JSON.stringify(integrations, null, 2), { name: 'integrations.json' });

    // Workflows
    const workflows = await prisma.workflow.findMany();
    archive.append(JSON.stringify(workflows, null, 2), { name: 'workflows.json' });

    await archive.finalize();
  } catch (err) {
    next(err);
  }
}; 