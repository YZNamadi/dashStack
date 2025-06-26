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

app.get('/', (req, res) => {
  res.send('Hello from DashStack!');
});

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects/:projectId/datasources', datasourceRoutes);
app.use('/projects/:projectId/pages', pageRoutes);
app.use('/projects/:projectId/workflows', workflowRoutes);

export default app; 