import prisma from '../utils/prisma';

export class GroupService {
  static async createGroup(data: { name: string; description?: string; organizationId: string }) {
    return prisma.group.create({ data });
  }
  static async getGroups() {
    return prisma.group.findMany();
  }
  static async getGroupById(id: string) {
    return prisma.group.findUnique({ where: { id }, include: { memberships: true, groupRoles: true } });
  }
  static async updateGroup(id: string, data: { name?: string; description?: string }) {
    return prisma.group.update({ where: { id }, data });
  }
  static async deleteGroup(id: string) {
    return prisma.group.delete({ where: { id } });
  }
  // Membership
  static async addUserToGroup(groupId: string, userId: string) {
    return prisma.groupMembership.create({ data: { groupId, userId } });
  }
  static async removeUserFromGroup(groupId: string, userId: string) {
    return prisma.groupMembership.delete({ where: { userId_groupId: { userId, groupId } } });
  }
  static async listGroupUsers(groupId: string) {
    return prisma.groupMembership.findMany({ where: { groupId }, include: { user: true } });
  }
  // Group Roles
  static async assignRoleToGroup(groupId: string, roleId: string, organizationId: string) {
    return prisma.groupRole.create({ data: { groupId, roleId, organizationId } });
  }
  static async removeRoleFromGroup(groupId: string, roleId: string, organizationId: string) {
    return prisma.groupRole.delete({ where: { groupId_roleId_organizationId: { groupId, roleId, organizationId } } });
  }
  static async listGroupRoles(groupId: string) {
    return prisma.groupRole.findMany({ where: { groupId }, include: { role: true } });
  }
} 