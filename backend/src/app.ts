import express, { Application } from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

const app: Application = express();

const isProduction = process.env.NODE_ENV === 'production';

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: isProduction
        ? ["'self'", "https://fonts.googleapis.com"]
        : ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: isProduction
        ? ["'self'"]
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// General API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
import groupRoutes from './routes/group.routes';
import orgRoutes from './routes/org.routes';
import settingsRoutes from './routes/settings.routes';

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
app.use('/api/groups', groupRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Observability Exporters ---
const otelExporters = [];

// Datadog OTel Exporter
if (process.env.DATADOG_OTLP_ENDPOINT && process.env.DATADOG_API_KEY) {
  otelExporters.push(
    new OTLPTraceExporter({
      url: process.env.DATADOG_OTLP_ENDPOINT,
      headers: { 'DD-API-KEY': process.env.DATADOG_API_KEY },
    })
  );
  // Docs: https://docs.datadoghq.com/tracing/trace_collection/open_telemetry/?tab=nodejs
}

// New Relic OTel Exporter
if (process.env.NEWRELIC_OTLP_ENDPOINT && process.env.NEWRELIC_LICENSE_KEY) {
  otelExporters.push(
    new OTLPTraceExporter({
      url: process.env.NEWRELIC_OTLP_ENDPOINT,
      headers: { 'api-key': process.env.NEWRELIC_LICENSE_KEY },
    })
  );
  // Docs: https://docs.newrelic.com/docs/more-integrations/open-source-telemetry-integrations/opentelemetry/opentelemetry-nodejs/
}

// Sumo Logic OTel Exporter (logs/traces)
if (process.env.SUMOLOGIC_OTLP_ENDPOINT) {
  otelExporters.push(
    new OTLPTraceExporter({
      url: process.env.SUMOLOGIC_OTLP_ENDPOINT,
    })
  );
  // Docs: https://help.sumologic.com/docs/send-data/opentelemetry/
}

if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || otelExporters.length > 0) {
  const provider = new NodeTracerProvider();
  for (const exporter of otelExporters) {
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  }
  provider.register();
  registerInstrumentations({});
}

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  console.log('Sentry initialized');
  app.use(Sentry.Handlers.requestHandler());
}

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

export default app; 