# DashStack - Enterprise Internal Tooling Platform

A comprehensive internal tooling platform with visual page builder, drag-and-drop components, advanced RBAC, SSO integration, audit logging, and enterprise-grade features.

## 🚀 Features

### Core Features
- **Visual Page Builder** - Drag-and-drop interface with real-time collaboration
- **Component Library** - Rich set of pre-built components (forms, charts, tables, etc.)
- **Workflow Automation** - Visual workflow builder with triggers and actions
- **Data Integration** - Connect to databases, APIs, and external services
- **Version Control** - Track changes and revert to previous versions

### Enterprise Features
- **Advanced RBAC** - Resource-level permissions and role management
- **SSO Integration** - Google OAuth 2.0 with automatic user provisioning
- **Audit Logging** - Comprehensive activity tracking with export capabilities
- **Observability** - Sentry error tracking and OpenTelemetry monitoring
- **Security** - Rate limiting, security headers, and CORS protection
- **Collaboration** - Real-time cursors, presence indicators, and comments

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL/MySQL
- **JWT** authentication
- **Passport.js** for SSO
- **BullMQ** for job queues
- **Socket.io** for real-time features

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Zustand** for state management
- **React Query** for data fetching
- **DND Kit** for drag-and-drop

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL or MySQL
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DashStack
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Database Setup
```bash
# Copy environment file
cp .env.example .env

# Update database configuration in .env
DATABASE_URL="postgresql://user:password@localhost:5432/dashstack"

# Run migrations
npx prisma migrate dev
npx prisma generate
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Environment Configuration

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dashstack"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Google SSO (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Observability (Optional)
SENTRY_DSN="your-sentry-dsn"
OTEL_EXPORTER_OTLP_ENDPOINT="your-otel-endpoint"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:5173"
```

#### Frontend (.env)
```env
VITE_API_URL="http://localhost:3000/api"
VITE_SENTRY_DSN="your-sentry-dsn"
```

### 6. Start Development Servers
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

## 🔐 SSO Configuration

### Google OAuth 2.0 Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable OAuth 2.0 API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)

4. **Update Environment Variables**
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

## 📊 Observability Setup

### Sentry Integration

1. **Create Sentry Project**
   - Go to [Sentry.io](https://sentry.io/)
   - Create a new project for Node.js (backend) and React (frontend)

2. **Get DSN**
   - Copy the DSN from your Sentry project settings

3. **Configure Environment Variables**
   ```env
   # Backend
   SENTRY_DSN="https://your-dsn@sentry.io/project-id"
   
   # Frontend
   VITE_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
   ```

### OpenTelemetry Setup

1. **Set up OpenTelemetry Collector**
   - Install and configure an OTEL collector
   - Set the endpoint in your environment

2. **Configure Environment Variable**
   ```env
   OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
   ```

## 🔒 Security Features

### Rate Limiting
- API endpoints are rate-limited to 100 requests per 15 minutes per IP
- Configurable limits for different endpoints

### Security Headers
- Helmet.js provides comprehensive security headers
- Content Security Policy (CSP) configured
- CORS protection with configurable origins

### Authentication
- JWT-based authentication
- Secure password hashing with bcrypt
- Session management with express-session

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Initiate Google SSO
- `GET /api/auth/google/callback` - Google SSO callback

### Project Management
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Page Builder
- `GET /api/projects/:id/pages` - List pages
- `POST /api/projects/:id/pages` - Create page
- `PUT /api/projects/:id/pages/:pageId` - Update page
- `GET /api/projects/:id/pages/:pageId/versions` - Get version history
- `POST /api/projects/:id/pages/:pageId/versions/:versionId/revert` - Revert version

### Audit Logs
- `GET /api/audit/events` - Get audit events with filters
- `GET /api/audit/export` - Export audit logs (CSV/JSON)
- `GET /api/audit/stats` - Get audit statistics

## 🧪 Testing

### Test Scripts & Files
- All test scripts (such as `test-endpoints.js`, files in `tests/`, and files with `.test.ts`, `.test.js`, or `.test.tsx` extensions) are now ignored by git via `.gitignore` in both backend and frontend.
- These files are for local development and are not pushed to the repository.

### Running Backend Endpoint Tests
To manually test all backend API endpoints:
```bash
cd backend
node test-endpoints.js
```
This will run a suite of integration tests against your local backend server and print results to the console.

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the audit logs for debugging

## 🔄 Changelog

### v1.0.0
- Initial release with core features
- Visual page builder
- Basic RBAC
- SSO integration
- Audit logging
- Enterprise security features 