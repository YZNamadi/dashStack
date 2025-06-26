# DashStack - Internal Tooling Platform for African Teams

DashStack is a Superblocks-like internal tooling platform designed specifically for Nigerian and African teams. It enables developers and operations teams to rapidly build dashboards, admin panels, approval flows, and support UIs using a mix of low-code frontend and programmable backends.

## 🚀 Current Status - MVP v0.1

### ✅ Completed Features

**Backend (Node.js/Express/TypeScript)**
- ✅ JWT Authentication with role-based access control
- ✅ Project management (CRUD operations)
- ✅ Database schema with Prisma (PostgreSQL)
- ✅ Datasource management (MySQL, PostgreSQL, REST APIs)
- ✅ Workflow engine (Python & JavaScript execution)
- ✅ Page management with layout storage
- ✅ CORS enabled for frontend communication

**Frontend (React/TypeScript/Vite)**
- ✅ User authentication (login/logout)
- ✅ Protected routes
- ✅ Drag-and-drop canvas builder
- ✅ Component library (Table, Button, Input, Text)
- ✅ Tabbed interface (Canvas, Data Sources, Workflows)
- ✅ Datasource management UI
- ✅ Workflow management UI
- ✅ Component props and workflow execution

**Core Architecture**
- ✅ PostgreSQL database with Prisma ORM
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Developer, Viewer)
- ✅ Modular component system
- ✅ Workflow execution engine

## 🛠 Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Workflow Engine**: Python/JavaScript execution via child_process
- **Build Tools**: Vite (Frontend), TypeScript (Backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Python 3.8+ (for workflow execution)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Create and configure your .env file
npx prisma migrate dev  # Set up database
npm run dev  # Start development server
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Start development server
```

### Environment Variables (Backend)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dashstack"
JWT_SECRET="your-secret-key"
PORT=3000
```

## 📊 Core Features

### 1. Visual Canvas Builder
- Drag-and-drop interface for building dashboards
- Component library with Table, Button, Input, and Text components
- Real-time positioning and layout management

### 2. Data Source Management
- **MySQL/PostgreSQL**: Direct database connections
- **REST APIs**: Custom headers, authentication, parameters
- **Python/JavaScript**: Code-based data sources (planned)

### 3. Workflow Engine
- **Python Workflows**: Execute Python code with input/output
- **JavaScript Workflows**: Execute Node.js code
- **Triggers**: Manual, Cron, API endpoints
- **Logging**: Execution history and error tracking

### 4. Component System
- **Table**: Display data from datasources
- **Button**: Trigger workflows or actions
- **Input**: Capture user input
- **Text**: Display static content

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Projects
- `POST /projects` - Create project
- `GET /projects` - List projects
- `GET /projects/:id` - Get project details

### Datasources
- `POST /projects/:projectId/datasources` - Create datasource
- `GET /projects/:projectId/datasources` - List datasources
- `POST /datasources/:id/run` - Execute datasource query

### Workflows
- `POST /projects/:projectId/workflows` - Create workflow
- `GET /projects/:projectId/workflows` - List workflows
- `POST /workflows/:id/run` - Execute workflow
- `GET /workflows/:id/logs` - Get workflow logs

### Pages
- `POST /projects/:projectId/pages` - Create page
- `GET /pages/:id` - Get page layout
- `PUT /pages/:id` - Update page layout

## 🎯 Use Cases

### KYC Review Dashboard
1. Add MySQL datasource with KYC table
2. Create Table component bound to `SELECT * FROM kyc WHERE status = 'pending'`
3. Create Button component with Python workflow for approval
4. Workflow updates database and sends webhook notifications

### Support Ticket Management
1. Connect REST API datasource to support system
2. Build dashboard with ticket list and status updates
3. Create workflows for ticket assignment and escalation

### Fraud Monitoring
1. Connect to transaction database
2. Build real-time monitoring dashboard
3. Create automated workflows for fraud detection

## 🚧 Next Steps (v0.2)

### High Priority
- [ ] Project selection and management UI
- [ ] Component property editor (bind datasources, configure workflows)
- [ ] Real-time data updates (WebSocket)
- [ ] Workflow scheduling with BullMQ
- [ ] Error handling and notifications

### Medium Priority
- [ ] Chart components (Bar, Line, Pie)
- [ ] Form components with validation
- [ ] Modal and dialog components
- [ ] File upload support
- [ ] Export/import project configurations

### Low Priority
- [ ] User management and team collaboration
- [ ] Audit logs and activity tracking
- [ ] API rate limiting and security
- [ ] Performance monitoring
- [ ] Mobile responsive design

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Canvas        │    │  Workflow       │    │   Users         │
│   Builder       │    │  Engine         │    │   Projects      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │  Datasources    │    │   Pages         │
│   (Table, etc.) │    │  (MySQL, REST)  │    │   Workflows     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🤝 Contributing

This is an MVP focused on core functionality. The goal is to create a solid foundation that can be extended for enterprise use.

### Development Guidelines
- Backend-first approach for data integrity
- TypeScript for type safety
- Modular component architecture
- Comprehensive error handling
- Security-first design

## 📄 License

This project is designed for African startups and teams. Please reach out for licensing and deployment support.

## 🎯 Roadmap

### Phase 1 (Current) - MVP
- ✅ Core canvas builder
- ✅ Basic datasource integration
- ✅ Workflow engine
- ✅ Authentication system

### Phase 2 - Production Ready
- [ ] Enterprise features (SSO, audit logs)
- [ ] Advanced workflow scheduling
- [ ] Real-time collaboration
- [ ] Performance optimization

### Phase 3 - Scale
- [ ] Multi-tenant architecture
- [ ] Marketplace for templates
- [ ] Advanced analytics
- [ ] Mobile applications

---

**Built for African teams, by African developers. 🚀** 