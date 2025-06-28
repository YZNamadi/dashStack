import { Response } from 'express';
import { createConnection } from 'mysql2/promise';
import { Client } from 'pg';
import axios from 'axios';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const createDatasource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { type, config, name } = req.body;
  const ownerId = req.user?.userId;

  try {
    // Verify project ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
    if (!project) {
        res.status(404).json({ message: 'Project not found or you do not have access' });
        return;
    }

    const datasource = await prisma.datasource.create({
      data: {
        projectId,
        name,
        type,
        config,
      },
    });
    res.status(201).json(datasource);
  } catch (error) {
    res.status(500).json({ message: 'Error creating datasource', error });
  }
};

export const getDatasources = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { projectId } = req.params;
    const ownerId = req.user?.userId;
  
    try {
      // Verify project ownership
      const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
      if (!project) {
          res.status(404).json({ message: 'Project not found or you do not have access' });
          return;
      }
      const datasources = await prisma.datasource.findMany({
        where: { projectId },
      });
      res.json(datasources);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching datasources', error });
    }
  };

export const runDatasourceQuery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { projectId, datasourceId } = req.params;
    const { query, method = 'GET', body, headers = {} } = req.body;
    const ownerId = req.user?.userId;

    try {
        const datasource = await prisma.datasource.findFirst({ 
            where: { 
                id: datasourceId,
                projectId: projectId,
                project: {
                    ownerId: ownerId,
                },
            },
        });
        if (!datasource) {
            res.status(404).json({ message: 'Datasource not found or you do not have access' });
            return;
        }

        let result: any;

        switch (datasource.type) {
            case 'MySQL':
                const mysqlConfig = datasource.config as { connectionString: string };
                const mysqlConnection = await createConnection(mysqlConfig.connectionString);
                const [mysqlRows] = await mysqlConnection.execute(query);
                await mysqlConnection.end();
                result = mysqlRows;
                break;

            case 'PostgreSQL':
                const pgConfig = datasource.config as { connectionString: string };
                const pgClient = new Client({ connectionString: pgConfig.connectionString });
                await pgClient.connect();
                const pgResult = await pgClient.query(query);
                await pgClient.end();
                result = pgResult.rows;
                break;

            case 'REST':
                const restConfig = datasource.config as { 
                    baseUrl: string; 
                    authHeaders?: Record<string, string>;
                    defaultHeaders?: Record<string, string>;
                };
                
                const requestConfig = {
                    method: method.toUpperCase(),
                    url: `${restConfig.baseUrl}${query}`,
                    headers: {
                        ...restConfig.defaultHeaders,
                        ...restConfig.authHeaders,
                        ...headers,
                    },
                    ...(body && { data: body }),
                };

                const response = await axios(requestConfig);
                result = response.data;
                break;

            case 'Python':
            case 'JS':
                // For Python/JS datasources, we'll use the workflow engine
                res.status(501).json({ message: 'Python/JS datasources not yet implemented' });
                return;

            default:
                res.status(400).json({ message: `Unsupported datasource type: ${datasource.type}` });
                return;
        }

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: 'Error running query', error: error.message });
    }
};

export const deleteDatasource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId, datasourceId } = req.params;
  const ownerId = req.user?.userId;

  try {
    const datasource = await prisma.datasource.findFirst({ 
        where: {
            id: datasourceId,
            projectId: projectId,
            project: {
                ownerId: ownerId,
            },
        },
    });
    if (!datasource) {
      res.status(404).json({ message: 'Datasource not found or you do not have access' });
      return;
    }

    await prisma.datasource.delete({ where: { id: datasourceId } });
    res.json({ message: 'Datasource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting datasource', error });
  }
}; 