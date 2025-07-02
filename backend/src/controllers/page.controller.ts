import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Note: projectId is available from the router's mergeParams
export const createPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    // Verify project ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
    if (!project) {
      res.status(404).json({ message: 'Project not found or you do not have access' });
      return;
    }

    const page = await prisma.page.create({
      data: {
        name,
        projectId,
        layout: {}, // Default empty layout
      },
    });
    res.status(201).json(page);
  } catch (error) {
    next(error);
  }
};

export const getPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, pageId } = req.params;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    const page = await prisma.page.findFirst({
      where: {
        id: pageId,
        projectId: projectId,
        project: {
          ownerId: ownerId,
        },
      },
    });

    if (!page) {
      res.status(404).json({ message: 'Page not found or you do not have access' });
      return;
    }
    // Optional: Add ownership check here too if needed, though access is already gated by project
    res.json(page);
  } catch (error) {
    next(error);
  }
};

export const updatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, pageId } = req.params;
    const { name, layout } = req.body;
    const userId = (req as AuthenticatedRequest).user?.userId;
    // Fetch current page
    const page = await prisma.page.findFirst({ where: { id: pageId, projectId } });
    if (!page) {
      res.status(404).json({ message: 'Page not found' });
      return;
    }
    // Save current version
    const latestVersion = await prisma.pageVersion.findFirst({
      where: { pageId },
      orderBy: { version: 'desc' },
    });
    
    // Ensure we have valid JSON for content
    const currentLayout = page.layout || {};
    
    await prisma.pageVersion.create({
      data: {
        pageId,
        version: latestVersion ? latestVersion.version + 1 : 1,
        content: currentLayout,
        createdById: userId as string,
      },
    });
    
    // Update page with new layout
    const newLayout = layout || {};
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: { 
        name, 
        layout: newLayout 
      },
    });
    res.json(updatedPage);
  } catch (error) {
    next(error);
  }
};

export const getPageVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageId } = req.params;
    const versions = await prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { version: 'desc' },
    });
    res.json(versions);
  } catch (error) {
    next(error);
  }
};

export const revertPageVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageId, versionId } = req.params;
    const version = await prisma.pageVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: { layout: version.content as any || {} },
    });
    res.json(updatedPage);
  } catch (error) {
    next(error);
  }
}; 