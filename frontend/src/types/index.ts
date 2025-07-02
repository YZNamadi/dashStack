export interface User {
  id: string;
  email: string;
  name: string;
  roles?: Role[];
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  title: string;
  content?: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Datasource {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  name: string;
  type: string;
  trigger: string;
  status: 'active' | 'inactive';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export interface AppState {
  currentProject: Project | null;
  projects: Project[];
  pages: Page[];
  datasources: Datasource[];
  workflows: Workflow[];
  setCurrentProject: (project: Project | null) => void;
  fetchProjects: () => Promise<void>;
  createProject: (data: { name: string; description?: string }) => Promise<void>;
  updateProject: (id: string, data: { name: string; description?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  fetchPages: (projectId: string) => Promise<void>;
  fetchDatasources: (projectId: string) => Promise<void>;
  fetchWorkflows: (projectId: string) => Promise<void>;
  createPage: (projectId: string, data: { title: string; layout: any }) => Promise<void>;
  updatePage: (id: string, data: { title?: string; content?: string; layout?: any }) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  createDatasource: (projectId: string, data: { name: string; type: string; config: any }) => Promise<void>;
  updateDatasource: (id: string, data: { name: string; type: string; config: any }) => Promise<void>;
  deleteDatasource: (id: string) => Promise<void>;
  testDatasourceConnection: (datasourceId: string) => Promise<any>;
  createWorkflow: (projectId: string, data: { name: string; type: string; trigger: string; code: string }) => Promise<void>;
  updateWorkflow: (id: string, data: { name: string; type: string; trigger: string; code: string }) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  runWorkflow: (workflowId: string) => Promise<any>;
  getRoles: () => Promise<any[]>;
  getPermissions: () => Promise<any[]>;
  createRole: (data: { name: string; description?: string; permissions?: string[] }) => Promise<any>;
  updateRole: (roleId: string, data: { name?: string; description?: string; permissions?: string[] }) => Promise<any>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRoleToUser: (data: { userId: string; roleId: string }) => Promise<void>;
  removeRoleFromUser: (data: { userId: string; roleId: string }) => Promise<void>;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  parentRoleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'pending';
  createdAt: string;
}
