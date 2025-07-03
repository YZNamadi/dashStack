import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';

export class SettingsController {
  static async getSetting(req: Request, res: Response): Promise<void> {
    const { key, userId, organizationId, projectId } = req.query;
    if (!key) {
      res.status(400).json({ error: 'Missing key' });
      return;
    }
    const setting = await SettingsService.getSetting(key as string, { userId: userId as string, organizationId: organizationId as string, projectId: projectId as string });
    if (!setting) {
      res.status(404).json({ error: 'Setting not found' });
      return;
    }
    res.json(setting);
  }

  static async setSetting(req: Request, res: Response): Promise<void> {
    const { key, value, userId, organizationId, projectId } = req.body;
    if (!key || value === undefined) {
      res.status(400).json({ error: 'Missing key or value' });
      return;
    }
    const setting = await SettingsService.setSetting(key, value, { userId, organizationId, projectId });
    res.json(setting);
  }

  static async deleteSetting(req: Request, res: Response): Promise<void> {
    const { key, userId, organizationId, projectId } = req.query;
    if (!key) {
      res.status(400).json({ error: 'Missing key' });
      return;
    }
    await SettingsService.deleteSetting(key as string, { userId: userId as string, organizationId: organizationId as string, projectId: projectId as string });
    res.json({ success: true });
  }

  static async listSettings(req: Request, res: Response): Promise<void> {
    const { userId, organizationId, projectId } = req.query;
    const settings = await SettingsService.listSettings({ userId: userId as string, organizationId: organizationId as string, projectId: projectId as string });
    res.json(settings);
  }
} 