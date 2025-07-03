import { Request, Response, NextFunction } from 'express';
import { GroupService } from '../services/group.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, organizationId } = req.body;
    if (!organizationId) {
      res.status(400).json({ message: 'organizationId is required' });
      return;
    }
    const group = await GroupService.createGroup({ name, description, organizationId });
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logCRUDEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'create',
      resource: 'group',
      resourceId: group.id,
      resourceName: group.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.status(201).json(group);
  } catch (error) { next(error); }
};

export const getGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groups = await GroupService.getGroups();
    res.json(groups);
  } catch (error) { next(error); }
};

export const getGroupById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const group = await GroupService.getGroupById(id);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }
    res.json(group);
  } catch (error) { next(error); }
};

export const updateGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const group = await GroupService.updateGroup(id, { name, description });
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logCRUDEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'update',
      resource: 'group',
      resourceId: group.id,
      resourceName: group.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json(group);
  } catch (error) { next(error); }
};

export const deleteGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await GroupService.deleteGroup(id);
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logCRUDEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'delete',
      resource: 'group',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({ message: 'Group deleted' });
  } catch (error) { next(error); }
};

// Membership
export const addUserToGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const membership = await GroupService.addUserToGroup(groupId, userId);
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'add_user',
      resource: 'group',
      resourceId: groupId,
      details: { addedUserId: userId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
    });
    res.status(201).json(membership);
  } catch (error) { next(error); }
};

export const removeUserFromGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, userId } = req.params;
    await GroupService.removeUserFromGroup(groupId, userId);
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'remove_user',
      resource: 'group',
      resourceId: groupId,
      details: { removedUserId: userId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
    });
    res.json({ message: 'User removed from group' });
  } catch (error) { next(error); }
};

export const listGroupUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const users = await GroupService.listGroupUsers(groupId);
    res.json(users);
  } catch (error) { next(error); }
};

// Group Roles
export const assignRoleToGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { roleId, organizationId } = req.body;
    if (!organizationId) {
      res.status(400).json({ message: 'organizationId is required' });
      return;
    }
    const groupRole = await GroupService.assignRoleToGroup(groupId, roleId, organizationId);
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'assign_role',
      resource: 'group',
      resourceId: groupId,
      details: { assignedRoleId: roleId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
    });
    res.status(201).json(groupRole);
  } catch (error) { next(error); }
};

export const removeRoleFromGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, roleId } = req.params;
    const { organizationId } = req.query;
    if (!organizationId || typeof organizationId !== 'string') {
      res.status(400).json({ message: 'organizationId is required as a query parameter' });
      return;
    }
    await GroupService.removeRoleFromGroup(groupId, roleId, organizationId);
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'remove_role',
      resource: 'group',
      resourceId: groupId,
      details: { removedRoleId: roleId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
    });
    res.json({ message: 'Role removed from group' });
  } catch (error) { next(error); }
};

export const listGroupRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const roles = await GroupService.listGroupRoles(groupId);
    res.json(roles);
  } catch (error) { next(error); }
}; 