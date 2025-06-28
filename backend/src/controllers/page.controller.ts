import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Note: projectId is available from the router's mergeParams
export const createPage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { name } = req.body;
  const ownerId = req.user?.userId;

  try {
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
    res.status(500).json({ message: 'Error creating page', error });
  }
};

export const getPage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId, pageId } = req.params;
  const ownerId = req.user?.userId;

  try {
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
    res.status(500).json({ message: 'Error fetching page', error });
  }
};

export const updatePage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId, pageId } = req.params;
  const { name, layout } = req.body;
  const ownerId = req.user?.userId;

  try {
    // First, verify ownership
    const existingPage = await prisma.page.findFirst({
        where: {
            id: pageId,
            projectId: projectId,
            project: {
                ownerId: ownerId,
            },
        },
    });

    if (!existingPage) {
        res.status(404).json({ message: 'Page not found or you do not have access' });
        return;
    }

    const page = await prisma.page.update({
      where: { id: pageId },
      data: {
        name,
        layout,
      },
    });
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: 'Error updating page', error });
  }
}; 