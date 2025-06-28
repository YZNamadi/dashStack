import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  FileText, 
  Database, 
  Workflow, 
  Plus,
  TrendingUp,
  Activity,
  Shield,
  User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProjectCreateDialog } from '../components/ProjectCreateDialog';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { 
    currentProject, 
    projects, 
    pages, 
    datasources, 
    workflows,
    fetchProjects 
  } = useAppStore();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        await fetchProjects();
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [fetchProjects]);

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pages',
      value: pages.length,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Datasources',
      value: datasources.length,
      icon: Database,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Workflows',
      value: workflows.length,
      icon: Workflow,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-slate-600 mt-1">
              {currentProject 
                ? `Working on ${currentProject.name}` 
                : 'Select a project to get started'
              }
            </p>
            {/* User Roles & Permissions */}
            {user?.roles && user.roles.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Roles:</span>
                {user.roles.map((role: any) => (
                  <Badge key={role.id} variant="secondary" className="text-xs">
                    {role.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowCreateProject(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="flex items-center text-xs text-slate-600 mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Active
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Recent Projects
              </CardTitle>
              <CardDescription>
                Your most recently created projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900">{project.name}</h4>
                        <p className="text-sm text-slate-600">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No projects yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateProject(true)}
                    className="mt-2"
                  >
                    Create your first project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Workflow className="w-5 h-5 mr-2 text-green-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks to get you started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => setShowCreateProject(true)}
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Create a new project
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  disabled={!currentProject}
                >
                  <FileText className="w-4 h-4 mr-3" />
                  Add a page
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  disabled={!currentProject}
                >
                  <Database className="w-4 h-4 mr-3" />
                  Connect datasource
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  disabled={!currentProject}
                >
                  <Workflow className="w-4 h-4 mr-3" />
                  Create workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Permissions */}
        {user?.permissions && user.permissions.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-purple-600" />
                Your Permissions
              </CardTitle>
              <CardDescription>
                Permissions granted to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((permission: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ProjectCreateDialog 
        open={showCreateProject} 
        onOpenChange={setShowCreateProject} 
      />
    </>
  );
};
