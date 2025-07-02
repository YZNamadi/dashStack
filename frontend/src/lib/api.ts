import type { 
  User, Project, Page, Datasource, Workflow, Role, Permission, AuditEvent 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// --- TypeScript Types ---
export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  name?: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface CreatePageRequest {
  name: string;
  layout?: any;
}

export interface UpdatePageRequest {
  name?: string;
  layout?: any;
  content?: string;
}

export interface CreateDatasourceRequest {
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface UpdateDatasourceRequest {
  name?: string;
  type?: string;
  config?: Record<string, any>;
}

export interface CreateWorkflowRequest {
  name: string;
  type: string;
  trigger: string;
  code: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  type?: string;
  trigger?: string;
  code?: string;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

export interface RemoveRoleRequest {
  userId: string;
  roleId: string;
}

export interface CheckPermissionRequest {
  userId: string;
  permission: string;
}

// --- API Client ---
class APIClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('dashstack_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };
    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // --- Auth ---
  login(data: LoginRequest) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  register(data: RegisterRequest) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  getMe() {
    return this.request<User>('/auth/me');
  }

  // --- Projects ---
  getProjects() {
    return this.request<Project[]>('/projects');
  }
  createProject(data: CreateProjectRequest) {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  updateProject(id: string, data: UpdateProjectRequest) {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  deleteProject(id: string) {
    return this.request<void>(`/projects/${id}`, { method: 'DELETE' });
  }

  // --- Pages ---
  getPages(projectId: string) {
    return this.request<Page[]>(`/projects/${projectId}/pages`);
  }
  createPage(projectId: string, data: CreatePageRequest) {
    return this.request<Page>(`/projects/${projectId}/pages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  updatePage(projectId: string, pageId: string, data: UpdatePageRequest) {
    return this.request<Page>(`/projects/${projectId}/pages/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  deletePage(projectId: string, pageId: string) {
    return this.request<void>(`/projects/${projectId}/pages/${pageId}`, { method: 'DELETE' });
  }

  // --- Datasources ---
  getDatasources(projectId: string) {
    return this.request<Datasource[]>(`/projects/${projectId}/datasources`);
  }
  createDatasource(projectId: string, data: CreateDatasourceRequest) {
    return this.request<Datasource>(`/projects/${projectId}/datasources`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  updateDatasource(projectId: string, datasourceId: string, data: UpdateDatasourceRequest) {
    return this.request<Datasource>(`/projects/${projectId}/datasources/${datasourceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  deleteDatasource(projectId: string, datasourceId: string) {
    return this.request<void>(`/projects/${projectId}/datasources/${datasourceId}`, { method: 'DELETE' });
  }
  runDatasourceQuery(projectId: string, datasourceId: string, query: any) {
    return this.request<any>(`/projects/${projectId}/datasources/${datasourceId}/run`, {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }
  testDatasourceConnection(projectId: string, data: { type: string; config: any }) {
    return this.request<any>(`/projects/${projectId}/datasources/test-connection`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  getDatasourceSchema(projectId: string, datasourceId: string) {
    return this.request<any>(`/projects/${projectId}/datasources/${datasourceId}/schema`);
  }

  // --- Workflows ---
  getWorkflows(projectId: string) {
    return this.request<Workflow[]>(`/projects/${projectId}/workflows`);
  }
  createWorkflow(projectId: string, data: CreateWorkflowRequest) {
    return this.request<Workflow>(`/projects/${projectId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  updateWorkflow(projectId: string, workflowId: string, data: UpdateWorkflowRequest) {
    return this.request<Workflow>(`/projects/${projectId}/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  deleteWorkflow(projectId: string, workflowId: string) {
    return this.request<void>(`/projects/${projectId}/workflows/${workflowId}`, { method: 'DELETE' });
  }
  runWorkflow(projectId: string, workflowId: string, input: any) {
    return this.request<any>(`/projects/${projectId}/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }
  getWorkflowLogs(projectId: string, workflowId: string) {
    return this.request<any[]>(`/projects/${projectId}/workflows/${workflowId}/logs`);
  }
  scheduleWorkflow(projectId: string, workflowId: string, cronExpression: string) {
    return this.request<void>(`/projects/${projectId}/workflows/${workflowId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ cronExpression }),
    });
  }

  // --- RBAC ---
  getRoles() {
    return this.request<Role[]>(`/rbac/roles`);
  }
  getPermissions() {
    return this.request<Permission[]>(`/rbac/permissions`);
  }
  createRole(data: { name: string; description?: string; permissions?: string[]; parentRoleId?: string }) {
    return this.request<Role>(`/rbac/roles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  updateRole(roleId: string, data: { name?: string; description?: string; permissions?: string[]; parentRoleId?: string }) {
    return this.request<Role>(`/rbac/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  deleteRole(roleId: string) {
    return this.request<void>(`/rbac/roles/${roleId}`, { method: 'DELETE' });
  }
  assignRoleToUser(data: { userId: string; roleId: string; resourceId?: string }) {
    return this.request<void>(`/rbac/assign-role`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  removeRoleFromUser(data: { userId: string; roleId: string; resourceId?: string }) {
    return this.request<void>(`/rbac/remove-role`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  getUserRoles(userId: string) {
    return this.request<{ user: User; roles: Role[]; permissions: string[] }>(`/rbac/user/${userId}`);
  }
  checkPermission(data: { userId: string; permission: string; resourceId?: string }) {
    return this.request<{ hasPermission: boolean }>(`/rbac/check-permission`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Audit ---
  getAuditEvents(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ events: AuditEvent[]; total: number }>(`/audit/events?${query}`);
  }
  getAuditStats(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/audit/stats${query ? `?${query}` : ''}`);
  }
  async exportAuditEvents(params: Record<string, any> = {}): Promise<Blob> {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/audit/export?${query}`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
      },
    };
    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.blob();
  }

  // --- Integrations ---
  getIntegrations(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/integrations`);
  }
  createIntegration(projectId: string, data: { name: string; type: string; config: any }) {
    return this.request<any>(`/projects/${projectId}/integrations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  updateIntegration(projectId: string, integrationId: string, data: { name?: string; type?: string; config?: any; status?: string }) {
    return this.request<any>(`/projects/${projectId}/integrations/${integrationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  deleteIntegration(projectId: string, integrationId: string) {
    return this.request<void>(`/projects/${projectId}/integrations/${integrationId}`, { method: 'DELETE' });
  }
  testIntegration(projectId: string, integrationId: string) {
    return this.request<any>(`/projects/${projectId}/integrations/${integrationId}/test`, { method: 'POST' });
  }
}

export const apiClient = new APIClient();
