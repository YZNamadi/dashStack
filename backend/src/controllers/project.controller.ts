import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  const ownerId = req.user?.userId;

  if (!name || !ownerId) {
    res.status(400).json({ message: 'Name and owner ID are required' });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        ownerId,
      },
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ownerId = req.user?.userId;

  try {
    const projects = await prisma.project.findMany({
      where: { ownerId },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const ownerId = req.user?.userId;

  try {
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
    res.status(500).json({ message: 'Error fetching project', error });
  }
};

export const renameProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name } = req.body;
  const ownerId = req.user?.userId;

  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  try {
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
    res.status(500).json({ message: 'Error renaming project', error });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const ownerId = req.user?.userId;

  try {
    const project = await prisma.project.deleteMany({
      where: { id, ownerId },
    });
    if (project.count === 0) {
      res.status(404).json({ message: 'Project not found or not owned by user' });
      return;
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error });
  }
}; 