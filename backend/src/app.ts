import express, { Application } from 'express';
import cors from 'cors';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import datasourceRoutes from './routes/datasource.routes';
import pageRoutes from './routes/page.routes';
import workflowRoutes from './routes/workflow.routes';
import rbacRoutes from './routes/rbac.routes';
import auditRoutes from './routes/audit.routes';

app.get('/', (req, res) => {
  res.send('Hello from DashStack!');
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/datasources', datasourceRoutes);
app.use('/api/projects/:projectId/pages', pageRoutes);
app.use('/api/projects/:projectId/workflows', workflowRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/audit', auditRoutes);

export default app; 