import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    if (!name || !ownerId) {
      res.status(400).json({ message: 'Name and owner ID are required' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        ownerId,
      },
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    const projects = await prisma.project.findMany({
      where: { ownerId },
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    const project = await prisma.project.findFirst({
      where: { id, ownerId },
      include: { pages: true, datasources: true, workflows: true },
    });

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const renameProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const project = await prisma.project.findFirst({
        where: { id, ownerId },
    });

    if (!project) {
        res.status(404).json({ message: 'Project not found or not owned by user' });
        return;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { name },
    });
    
    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    const project = await prisma.project.deleteMany({
      where: { id, ownerId },
    });
    if (project.count === 0) {
      res.status(404).json({ message: 'Project not found or not owned by user' });
      return;
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
}; 