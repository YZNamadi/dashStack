import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export type SettingScope = {
  userId?: string;
  organizationId?: string;
  projectId?: string;
};

export class SettingsService {
  static async getSetting(key: string, scope: SettingScope) {
    return prisma.setting.findFirst({
      where: {
        key,
        userId: scope.userId ?? null,
        organizationId: scope.organizationId ?? null,
        projectId: scope.projectId ?? null,
      },
    });
  }

  static async setSetting(key: string, value: any, scope: SettingScope) {
    const existing = await prisma.setting.findFirst({
      where: {
        key,
        userId: scope.userId ?? null,
        organizationId: scope.organizationId ?? null,
        projectId: scope.projectId ?? null,
      },
    });
    if (existing) {
      return prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      return prisma.setting.create({
        data: {
          key,
          value,
          userId: scope.userId ?? null,
          organizationId: scope.organizationId ?? null,
          projectId: scope.projectId ?? null,
        },
      });
    }
  }

  static async deleteSetting(key: string, scope: SettingScope) {
    const existing = await prisma.setting.findFirst({
      where: {
        key,
        userId: scope.userId ?? null,
        organizationId: scope.organizationId ?? null,
        projectId: scope.projectId ?? null,
      },
    });
    if (existing) {
      return prisma.setting.delete({ where: { id: existing.id } });
    }
    return null;
  }

  static async listSettings(scope: SettingScope) {
    return prisma.setting.findMany({
      where: {
        userId: scope.userId ?? null,
        organizationId: scope.organizationId ?? null,
        projectId: scope.projectId ?? null,
      },
    });
  }
} 