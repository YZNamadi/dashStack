# DashStack

DashStack is an internal tooling platform with a Node.js/Express/TypeScript backend and a React/TypeScript frontend. It enables rapid development of custom dashboards, forms, and workflows with a visual page builder.

## Features

- **Visual Page Builder**: Drag-and-drop UI for building pages with components
- **Component Library**: Headings, text, buttons, inputs, selects, checkboxes, tables, forms, and more
- **Form System**: Create forms, assign fields, collect and submit data to workflows
- **Table Row Actions**: Trigger workflows by clicking table rows, passing row data
- **Workflow Integration**: Bind workflows to buttons, forms, and table actions
- **RBAC**: Role-based access control for users and projects
- **Datasource Integration**: Bind components to live data from datasources
- **Audit Logging**: Track user actions and changes
- **Authentication**: JWT-based login and protected routes
- **Undo/Redo**: History management for page editing
- **Live Preview**: Toggle preview mode for interactive testing

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database

### Setup
1. **Clone the repository**
2. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/` as needed
   - Set your database connection string and secrets
4. **Run database migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
5. **Start the backend**
   ```bash
   npm run dev
   ```
6. **Start the frontend**
   ```bash
   cd ../frontend
   npm run dev
   ```

## Usage
- Log in or register as a user
- Create projects, datasources, workflows, and pages
- Use the visual page builder to drag components onto the canvas
- Assign forms, workflows, and data bindings to components
- Use preview mode to test interactivity (form submission, table row actions, etc.)

## .gitignore
Sensitive files, build artifacts, and local environment files are excluded from version control:
- `.env`, `*.env`, `node_modules/`, `dist/`, `build/`, `bun.lockb`, log files, local DBs, etc.

## Contributing
Pull requests are welcome! Please open issues for bugs or feature requests.

