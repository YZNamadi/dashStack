import { Request, Response, NextFunction } from 'express';
import { createConnection } from 'mysql2/promise';
import { Client } from 'pg';
import axios from 'axios';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Enhanced datasource types
export interface DatasourceConfig {
  connectionString?: string;
  baseUrl?: string;
  authHeaders?: Record<string, string>;
  defaultHeaders?: Record<string, string>;
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number;
  ssl?: boolean;
  graphqlEndpoint?: string;
  introspectionQuery?: string;
}

export const createDatasource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { type, config, name } = req.body;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    // Validate datasource configuration
    if (!validateDatasourceConfig(type, config)) {
      res.status(400).json({ message: 'Invalid datasource configuration' });
      return;
    }

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
    next(error);
  }
};

export const testDatasourceConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, config } = req.body;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

    if (!validateDatasourceConfig(type, config)) {
      res.status(400).json({ message: 'Invalid datasource configuration' });
      return;
    }

    let testResult: any;

    switch (type) {
      case 'MySQL':
        const mysqlConfig = config as { connectionString: string };
        const mysqlConnection = await createConnection(mysqlConfig.connectionString);
        await mysqlConnection.execute('SELECT 1');
        await mysqlConnection.end();
        testResult = { success: true, message: 'MySQL connection successful' };
        break;

      case 'PostgreSQL':
        const pgConfig = config as { connectionString: string };
        const pgClient = new Client({ connectionString: pgConfig.connectionString });
        await pgClient.connect();
        await pgClient.query('SELECT 1');
        await pgClient.end();
        testResult = { success: true, message: 'PostgreSQL connection successful' };
        break;

      case 'REST':
        const restConfig = config as { baseUrl: string; authHeaders?: Record<string, string> };
        const response = await axios.get(restConfig.baseUrl, {
          headers: restConfig.authHeaders,
          timeout: 5000,
        });
        testResult = { success: true, message: 'REST API connection successful', status: response.status };
        break;

      case 'GraphQL':
        const graphqlConfig = config as { graphqlEndpoint: string; authHeaders?: Record<string, string> };
        const introspectionQuery = {
          query: `
            query IntrospectionQuery {
              __schema {
                queryType { name }
                mutationType { name }
                subscriptionType { name }
                types {
                  ...FullType
                }
              }
            }
            fragment FullType on __Type {
              kind
              name
              description
              fields(includeDeprecated: true) {
                name
                description
                args {
                  ...InputValue
                }
                type {
                  ...TypeRef
                }
                isDeprecated
                deprecationReason
              }
            }
            fragment InputValue on __InputValue {
              name
              description
              type { ...TypeRef }
              defaultValue
            }
            fragment TypeRef on __Type {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          `
        };
        
        const graphqlResponse = await axios.post(graphqlConfig.graphqlEndpoint, introspectionQuery, {
          headers: {
            'Content-Type': 'application/json',
            ...graphqlConfig.authHeaders,
          },
          timeout: 10000,
        });
        
        testResult = { 
          success: true, 
          message: 'GraphQL connection successful',
          schema: graphqlResponse.data.data.__schema 
        };
        break;

      default:
        res.status(400).json({ message: `Unsupported datasource type: ${type}` });
        return;
    }

    res.json(testResult);
  } catch (error: any) {
    next(error);
  }
};

export const getDatasourceSchema = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, datasourceId } = req.params;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

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

    let schema: any;

    switch (datasource.type) {
      case 'MySQL':
        const mysqlConfig = datasource.config as { connectionString: string };
        const mysqlConnection = await createConnection(mysqlConfig.connectionString);
        const [tables] = await mysqlConnection.execute(`
          SELECT 
            TABLE_NAME as table_name,
            TABLE_COMMENT as table_comment
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = DATABASE()
        `);
        
        const tableSchemas = [];
        for (const table of tables as any[]) {
          const [columns] = await mysqlConnection.execute(`
            SELECT 
              COLUMN_NAME as column_name,
              DATA_TYPE as data_type,
              IS_NULLABLE as is_nullable,
              COLUMN_DEFAULT as column_default,
              COLUMN_COMMENT as column_comment
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
          `, [table.table_name]);
          
          tableSchemas.push({
            table: table.table_name,
            comment: table.table_comment || '',
            columns: columns
          });
        }
        
        await mysqlConnection.end();
        schema = { tables: tableSchemas };
        break;

      case 'PostgreSQL':
        const pgConfig = datasource.config as { connectionString: string };
        const pgClient = new Client({ connectionString: pgConfig.connectionString });
        await pgClient.connect();
        
        const tablesResult = await pgClient.query(`
          SELECT 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        
        const pgTableSchemas = [];
        for (const table of tablesResult.rows) {
          const columnsResult = await pgClient.query(`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = $1
          `, [table.table_name]);
          
          pgTableSchemas.push({
            table: table.table_name,
            columns: columnsResult.rows,
          });
        }
        
        await pgClient.end();
        schema = { tables: pgTableSchemas };
        break;

      case 'GraphQL':
        if ((datasource as any)?.schemaCache) {
          schema = (datasource as any).schemaCache;
        } else {
          const graphqlConfig = datasource.config as { graphqlEndpoint: string; authHeaders?: Record<string, string> };
          const introspectionQuery = {
            query: `
              query IntrospectionQuery {
                __schema {
                  queryType { name }
                  mutationType { name }
                  subscriptionType { name }
                  types {
                    ...FullType
                  }
                }
              }
              fragment FullType on __Type {
                kind
                name
                description
                fields(includeDeprecated: true) {
                  name
                  description
                  args {
                    ...InputValue
                  }
                  type {
                    ...TypeRef
                  }
                  isDeprecated
                  deprecationReason
                }
              }
              fragment InputValue on __InputValue {
                name
                description
                type { ...TypeRef }
                defaultValue
              }
              fragment TypeRef on __Type {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            `
          };
          
          const graphqlResponse = await axios.post(graphqlConfig.graphqlEndpoint, introspectionQuery, {
            headers: {
              'Content-Type': 'application/json',
              ...graphqlConfig.authHeaders,
            },
            timeout: 10000,
          });
          
          schema = graphqlResponse.data.data.__schema;

          // Cache the schema
          await (prisma.datasource as any).update({
            where: { id: datasourceId },
            data: { schemaCache: schema || {} },
          });
        }
        break;

      default:
        res.status(400).json({ message: `Schema introspection not supported for type: ${datasource.type}` });
        return;
    }

    res.json(schema);
  } catch (error: any) {
    next(error);
  }
};

export const getDatasources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const ownerId = (req as AuthenticatedRequest).user?.userId;
  
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
    next(error);
  }
};

// Validation function for datasource configurations
const validateDatasourceConfig = (type: string, config: any): boolean => {
  switch (type) {
    case 'MySQL':
    case 'PostgreSQL':
      return config && config.connectionString && typeof config.connectionString === 'string';
    
    case 'REST':
      return config && config.baseUrl && typeof config.baseUrl === 'string';
    
    case 'GraphQL':
      return config && config.graphqlEndpoint && typeof config.graphqlEndpoint === 'string';
    
    default:
      return false;
  }
};

export const runDatasourceQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, datasourceId } = req.params;
    const { query, method = 'GET', body, headers = {}, variables } = req.body;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

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
          timeout: 10000,
        };

        const response = await axios(requestConfig);
        result = response.data;
        break;

      case 'GraphQL':
        const graphqlConfig = datasource.config as { 
          graphqlEndpoint: string; 
          authHeaders?: Record<string, string>;
        };
        
        const graphqlRequest = {
          query,
          variables: variables || {},
        };

        const graphqlResponse = await axios.post(graphqlConfig.graphqlEndpoint, graphqlRequest, {
          headers: {
            'Content-Type': 'application/json',
            ...graphqlConfig.authHeaders,
          },
          timeout: 15000,
        });

        if (graphqlResponse.data.errors) {
          res.status(400).json({ 
            message: 'GraphQL query errors', 
            errors: graphqlResponse.data.errors 
          });
          return;
        }

        result = graphqlResponse.data.data;
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
    console.error('Datasource query error:', error);
    next(error);
  }
};

export const deleteDatasource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, datasourceId } = req.params;
    const ownerId = (req as AuthenticatedRequest).user?.userId;

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
    next(error);
  }
};

export const updateDatasource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, datasourceId } = req.params;
      const { name, config, type } = req.body;
      const ownerId = (req as AuthenticatedRequest).user?.userId;
      
      if (!name || !config || !type) {
          res.status(400).json({ message: 'Name, config, and type are required' });
          return;
      }
  
      const datasource = await prisma.datasource.findFirst({
          where: {
              id: datasourceId,
              projectId: projectId,
              project: {
                  ownerId: ownerId,
              }
          }
      });
  
      if (!datasource) {
          res.status(404).json({ message: 'Datasource not found or you do not have access' });
          return;
      }
  
      const updatedDatasource = await prisma.datasource.update({
          where: { id: datasourceId },
          data: { name, config, type }
      });
  
      res.json(updatedDatasource);
    } catch (error) {
      next(error);
    }
  }; 