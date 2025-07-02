import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getIntegrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const integrations = await prisma.integration.findMany({ where: { projectId } });
    res.json(integrations);
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
    res.json(integration);
  } catch (error) {
    next(error);
  }
};

export const createIntegration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { name, type, config } = req.body;
    const integration = await prisma.integration.create({
      data: { projectId, name, type, config, status: 'Disconnected' },
    });
    res.status(201).json(integration);
  } catch (error) {
    next(error);
  }
};

export const updateIntegration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, integrationId } = req.params;
    const { name, type, config, status } = req.body;
    const integration = await prisma.integration.update({
      where: { id: integrationId },
      data: { name, type, config, status },
    });
    res.json(integration);
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