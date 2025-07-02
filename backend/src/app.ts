import express, { Application } from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app: Application = express();

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Enhanced CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

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
import integrationRoutes from './routes/integration.routes';
import ssoRoutes from './routes/auth.sso.routes';

app.get('/', (req, res) => {
  res.send('Hello from DashStack!');
});

app.use('/api/auth', authRoutes);
app.use('/api/auth', ssoRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/datasources', datasourceRoutes);
app.use('/api/projects/:projectId/pages', pageRoutes);
app.use('/api/projects/:projectId/workflows', workflowRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/projects/:projectId/integrations', integrationRoutes);

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const sdk = new NodeSDK({
    // You can add more config here
    // See OpenTelemetry docs for advanced setup
  });
  sdk.start();
}

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

export default app; 