import { create } from 'zustand';
import { AppState, Project, Page, Datasource, Workflow } from '../types';
import { apiClient } from '../lib/api';
import { toast } from '@/hooks/use-toast';

export const useAppStore = create<AppState>((set, get) => ({
  currentProject: null,
  projects: [],
  pages: [],
  datasources: [],
  workflows: [],

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
    if (project) {
      get().fetchPages(project.id);
      get().fetchDatasources(project.id);
      get().fetchWorkflows(project.id);
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await apiClient.getProjects();
      set({ projects });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch projects',
        variant: 'destructive',
      });
    }
  },

  createProject: async (data: { name: string; description?: string }) => {
    try {
      const project = await apiClient.createProject(data);
      set((state) => ({
        projects: [...state.projects, project],
        currentProject: project,
      }));
      toast({
        title: 'Project created',
        description: `${data.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      throw error;
    }
  },

  updateProject: async (id: string, data: { name: string; description?: string }) => {
    try {
      const updatedProject = await apiClient.updateProject(id, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
      }));
      toast({
        title: 'Project updated',
        description: 'Project has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    try {
      await apiClient.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }));
      toast({
        title: 'Project deleted',
        description: 'Project has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      throw error;
    }
  },

  fetchPages: async (projectId: string) => {
    try {
      const pages = await apiClient.getPages(projectId);
      set({ pages });
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  },

  fetchDatasources: async (projectId: string) => {
    try {
      const datasources = await apiClient.getDatasources(projectId);
      set({ datasources });
    } catch (error) {
      console.error('Failed to fetch datasources:', error);
    }
  },

  fetchWorkflows: async (projectId: string) => {
    try {
      const workflows = await apiClient.getWorkflows(projectId);
      set({ workflows });
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  },

  createPage: async (projectId: string, data: { title: string; layout: any }) => {
    try {
      const page = await apiClient.createPage(projectId, { name: data.title, layout: data.layout });
      set((state) => ({
        pages: [...state.pages, page],
      }));
      toast({
        title: 'Page created',
        description: `${data.title} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create page',
        variant: 'destructive',
      });
      throw error;
    }
  },

  updatePage: async (id: string, data: { title: string; content?: string }) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      const updatedPage = await apiClient.updatePage(currentProject.id, id, { name: data.title, content: data.content });
      set((state) => ({
        pages: state.pages.map((p) => (p.id === id ? updatedPage : p)),
      }));
      toast({
        title: 'Page updated',
        description: `${data.title} has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update page',
        variant: 'destructive',
      });
      throw error;
    }
  },

  deletePage: async (id: string) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      await apiClient.deletePage(currentProject.id, id);
      set((state) => ({
        pages: state.pages.filter((p) => p.id !== id),
      }));
      toast({
        title: 'Page deleted',
        description: 'Page has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive',
      });
      throw error;
    }
  },

  createDatasource: async (projectId: string, data: { name: string; type: string; config: any }) => {
    try {
      const datasource = await apiClient.createDatasource(projectId, data);
      set((state) => ({
        datasources: [...state.datasources, datasource],
      }));
      toast({
        title: 'Datasource created',
        description: `${data.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create datasource',
        variant: 'destructive',
      });
      throw error;
    }
  },

  updateDatasource: async (id: string, data: { name: string; type: string; config: any }) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      const updatedDatasource = await apiClient.updateDatasource(currentProject.id, id, data);
      set((state) => ({
        datasources: state.datasources.map((d) => (d.id === id ? updatedDatasource : d)),
      }));
      toast({
        title: 'Datasource updated',
        description: `${data.name} has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update datasource',
        variant: 'destructive',
      });
      throw error;
    }
  },

  deleteDatasource: async (id: string) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      await apiClient.deleteDatasource(currentProject.id, id);
      set((state) => ({
        datasources: state.datasources.filter((d) => d.id !== id),
      }));
      toast({
        title: 'Datasource deleted',
        description: 'Datasource has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete datasource',
        variant: 'destructive',
      });
      throw error;
    }
  },

  testDatasourceConnection: async (datasourceId: string) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      const result = await apiClient.runDatasourceQuery(currentProject.id, datasourceId, { test: true });
      toast({
        title: 'Connection successful',
        description: 'Datasource connection test passed.',
      });
      return result;
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: 'Datasource connection test failed.',
        variant: 'destructive',
      });
      throw error;
    }
  },

  createWorkflow: async (projectId: string, data: { name: string; type: string; trigger: string; code: string }) => {
    try {
      const workflow = await apiClient.createWorkflow(projectId, data);
      set((state) => ({
        workflows: [...state.workflows, workflow],
      }));
      toast({
        title: 'Workflow created',
        description: `${data.name} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create workflow',
        variant: 'destructive',
      });
      throw error;
    }
  },

  updateWorkflow: async (id: string, data: { name: string; type: string; trigger: string; code: string }) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      const updatedWorkflow = await apiClient.updateWorkflow(currentProject.id, id, data);
      set((state) => ({
        workflows: state.workflows.map((w) => (w.id === id ? updatedWorkflow : w)),
      }));
      toast({
        title: 'Workflow updated',
        description: `${data.name} has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update workflow',
        variant: 'destructive',
      });
      throw error;
    }
  },

  deleteWorkflow: async (id: string) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      await apiClient.deleteWorkflow(currentProject.id, id);
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
      }));
      toast({
        title: 'Workflow deleted',
        description: 'Workflow has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
      throw error;
    }
  },

  runWorkflow: async (workflowId: string) => {
    try {
      const currentProject = get().currentProject;
      if (!currentProject) throw new Error('No project selected');
      const result = await apiClient.runWorkflow(currentProject.id, workflowId, {});
      toast({
        title: 'Workflow executed',
        description: 'Workflow has been executed successfully.',
      });
      return result;
    } catch (error) {
      toast({
        title: 'Execution failed',
        description: 'Workflow execution failed.',
        variant: 'destructive',
      });
      throw error;
    }
  },

  // --- RBAC Methods ---
  getRoles: async () => {
    try {
      const roles = await apiClient.getRoles();
      return roles;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return [];
    }
  },

  getPermissions: async () => {
    try {
      const permissions = await apiClient.getPermissions();
      return permissions;
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      return [];
    }
  },

  createRole: async (data: { name: string; description?: string; permissions?: string[] }) => {
    try {
      const role = await apiClient.createRole(data);
      toast({
        title: 'Role created',
        description: `${data.name} has been created successfully.`,
      });
      return role;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive',
      });
      throw error;
    }
  },

  updateRole: async (roleId: string, data: { name?: string; description?: string; permissions?: string[] }) => {
    try {
      const role = await apiClient.updateRole(roleId, data);
      toast({
        title: 'Role updated',
        description: 'Role has been updated successfully.',
      });
      return role;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
      throw error;
    }
  },

  deleteRole: async (roleId: string) => {
    try {
      await apiClient.deleteRole(roleId);
      toast({
        title: 'Role deleted',
        description: 'Role has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive',
      });
      throw error;
    }
  },

  assignRoleToUser: async (data: { userId: string; roleId: string }) => {
    try {
      await apiClient.assignRoleToUser(data);
      toast({
        title: 'Role assigned',
        description: 'Role has been assigned to user successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
      throw error;
    }
  },

  removeRoleFromUser: async (data: { userId: string; roleId: string }) => {
    try {
      await apiClient.removeRoleFromUser(data);
      toast({
        title: 'Role removed',
        description: 'Role has been removed from user successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
      throw error;
    }
  },
}));
