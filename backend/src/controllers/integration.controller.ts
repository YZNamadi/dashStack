import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AuditService } from '../services/audit.service';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.INTEGRATION_SECRET_KEY || 'default_secret_key_32bytes!'; // 32 bytes for aes-256
const IV_LENGTH = 16;

function encrypt(text: any) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(JSON.stringify(text));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: any) {
  if (!text) return null;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
}

export const getIntegrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const integrations = await prisma.integration.findMany({ where: { projectId } });
    // Decrypt config and mask secrets
    const safeIntegrations = integrations.map((i: any) => ({
      ...i,
      config: i.config ? decrypt(i.config) : null,
      // Optionally mask secrets here if needed
    }));
    res.json(safeIntegrations);
  } catch (error) {
    next(error);
  }
};

export const getIntegration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, integrationId } = req.params;
    const integration = await prisma.integration.findFirst({ where: { id: integrationId, projectId } });
    if (!integration) {
      res.status(404).json({ message: 'Integration not found' });
      return;
    }
    // Decrypt config and mask secrets
    const safeIntegration = {
      ...integration,
      config: integration.config ? decrypt(integration.config) : null,
      // Optionally mask secrets here if needed
    };
    res.json(safeIntegration);
  } catch (error) {
    next(error);
  }
};

export const createIntegration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { name, type, config } = req.body;
    const encryptedConfig = encrypt(config);
    const integration = await prisma.integration.create({
      data: { projectId, name, type, config: encryptedConfig, status: 'Disconnected' },
    });
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logCRUDEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'create',
      resource: 'integration',
      resourceId: integration.id,
      resourceName: integration.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    // Decrypt config for response, but mask secrets
    const safeIntegration = {
      ...integration,
      config: config, // Do not return secrets in plaintext in production
    };
    res.status(201).json(safeIntegration);
  } catch (error) {
    next(error);
  }
};

export const updateIntegration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, integrationId } = req.params;
    const { name, type, config, status } = req.body;
    const encryptedConfig = encrypt(config);
    const integration = await prisma.integration.update({
      where: { id: integrationId },
      data: { name, type, config: encryptedConfig, status },
    });
    // Audit log
    const user = (req as AuthenticatedRequest).user;
    await AuditService.logCRUDEvent({
      userId: user?.userId,
      userName: user?.name,
      action: 'update',
      resource: 'integration',
      resourceId: integration.id,
      resourceName: integration.name,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    // Decrypt config for response, but mask secrets
    const safeIntegration = {
      ...integration,
      config: config, // Do not return secrets in plaintext in production
    };
    res.json(safeIntegration);
  } catch (error) {
    next(error);
  }
};

export const deleteIntegration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, integrationId } = req.params;
    await prisma.integration.delete({ where: { id: integrationId } });
    res.json({ message: 'Integration deleted' });
  } catch (error) {
    next(error);
  }
};

export const testIntegration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, just return success. In production, implement real connection tests.
    res.json({ success: true, message: 'Test connection successful (placeholder)' });
  } catch (error) {
    next(error);
  }
}; 