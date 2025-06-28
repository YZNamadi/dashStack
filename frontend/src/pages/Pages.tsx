import { useAppStore } from '../store/appStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Edit, Trash2, ExternalLink, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CanvasBuilder, CanvasElement } from '@/components/ui/canvas-builder';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { apiClient } from '../lib/api';

// Sortable Component Wrapper
const SortableComponent = ({ component, isSelected, onSelect, onUpdate, onDelete, getComponentData, isComponentDataLoading, previewMode, runWorkflow, toast, currentProject }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded border cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'hover:border-blue-400'
      }`}
      onClick={() => onSelect(component)}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-slate-400 hover:text-slate-600"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-500 capitalize">{component.type}</span>
      </div>
      
      {component.type === 'heading' && (
        <h3 className={`font-semibold text-${component.color} text-${component.size}`}>
          {component.datasourceId && component.dataField 
            ? getComponentData(component.id)?.data?.[0]?.[component.dataField] || component.content
            : component.content
          }
        </h3>
      )}
      
      {component.type === 'text' && (
        <p className={`text-${component.color} text-${component.size}`}>
          {component.datasourceId && component.dataField 
            ? getComponentData(component.id)?.data?.[0]?.[component.dataField] || component.content
            : component.content
          }
        </p>
      )}
      
      {component.type === 'button' && (
        <button
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-${component.size}`}
          disabled={actionLoading}
          onClick={async (e) => {
            if (!component.workflowId) return;
            e.preventDefault();
            setActionLoading(true);
            setActionStatus(null);
            try {
              await apiClient.runWorkflow(currentProject.id, component.workflowId, {});
              setActionStatus('success');
              toast({ title: 'Workflow executed', description: 'The workflow ran successfully.' });
            } catch (error) {
              setActionStatus('error');
              toast({ title: 'Workflow failed', description: 'There was an error running the workflow.', variant: 'destructive' });
            } finally {
              setActionLoading(false);
              setTimeout(() => setActionStatus(null), 2000);
            }
          }}
        >
          {actionLoading ? (
            <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>Running...</span>
          ) : (
            <>{component.content}</>
          )}
        </button>
      )}
      
      {component.type === 'input' && (
        <input 
          type={component.inputType || 'text'} 
          placeholder={component.placeholder} 
          className="w-full border rounded px-3 py-2"
          readOnly={!previewMode}
          value={previewMode ? (component.formData || '') : ''}
          onChange={previewMode ? (e) => {
            // Update form data in parent component
            if (component.onFormFieldUpdate) {
              component.onFormFieldUpdate(component.id, e.target.value);
            }
          } : undefined}
        />
      )}
      
      {component.type === 'select' && (
        <select 
          className="w-full border rounded px-3 py-2 bg-white" 
          disabled={!previewMode}
          value={previewMode ? (component.formData || '') : ''}
          onChange={previewMode ? (e) => {
            if (component.onFormFieldUpdate) {
              component.onFormFieldUpdate(component.id, e.target.value);
            }
          } : undefined}
        >
          <option value="">{component.placeholder}</option>
          {component.options?.map((option: string, index: number) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      )}
      
      {component.type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={previewMode ? (component.formData || component.checked) : component.checked} 
            className="w-4 h-4"
            readOnly={!previewMode}
            onChange={previewMode ? (e) => {
              if (component.onFormFieldUpdate) {
                component.onFormFieldUpdate(component.id, e.target.checked);
              }
            } : undefined}
          />
          <span className="text-sm">{component.label}</span>
        </div>
      )}
      
      {component.type === 'table' && (
        <div className="overflow-x-auto">
          {isComponentDataLoading(component.id) ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-slate-500">Loading data...</span>
            </div>
          ) : (
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  {component.headers?.map((header: string, index: number) => (
                    <th key={index} className="border border-slate-300 px-3 py-2 text-left text-sm font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {component.datasourceId ? (
                  // Dynamic data from datasource
                  getComponentData(component.id)?.data?.map((row: any, rowIndex: number) => (
                    <tr 
                      key={rowIndex}
                      className={previewMode && component.rowActionWorkflowId ? 'cursor-pointer hover:bg-slate-100' : ''}
                      onClick={previewMode && component.rowActionWorkflowId ? async () => {
                        if (component.onTableRowClick) {
                          await component.onTableRowClick(component.id, rowIndex, component.rowActionWorkflowId);
                        }
                      } : undefined}
                    >
                      {component.headers?.map((header: string, cellIndex: number) => (
                        <td key={cellIndex} className="border border-slate-300 px-3 py-2 text-sm">
                          {cellIndex === 0 && component.tableRowLoading?.[`${component.id}-${rowIndex}`] ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            row[header] || row[cellIndex] || ''
                          )}
                        </td>
                      ))}
                    </tr>
                  )) || []
                ) : (
                  // Static data
                  component.rows?.map((row: string[], rowIndex: number) => (
                    <tr 
                      key={rowIndex}
                      className={previewMode && component.rowActionWorkflowId ? 'cursor-pointer hover:bg-slate-100' : ''}
                      onClick={previewMode && component.rowActionWorkflowId ? async () => {
                        if (component.onTableRowClick) {
                          await component.onTableRowClick(component.id, rowIndex, component.rowActionWorkflowId);
                        }
                      } : undefined}
                    >
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="border border-slate-300 px-3 py-2 text-sm">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {component.type === 'form' && (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
          <div className="text-center text-slate-500 mb-4">
            <div className="text-lg font-medium">Form Container</div>
            <div className="text-sm">ID: {component.formId || 'Not set'}</div>
            {component.submitWorkflowId && (
              <div className="text-xs mt-1">Submit workflow: {component.submitWorkflowId}</div>
            )}
          </div>
          
          {previewMode && component.submitWorkflowId && (
            <button
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              disabled={component.formSubmitting}
              onClick={async (e) => {
                e.preventDefault();
                if (!component.formId || !component.submitWorkflowId) return;
                
                if (component.onFormSubmit) {
                  await component.onFormSubmit(component.formId, component.submitWorkflowId);
                }
              }}
            >
              {component.formSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Submitting...
                </span>
              ) : (
                'Submit Form'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const Pages = () => {
  const { currentProject, pages, fetchPages, createPage, updatePage, deletePage, datasources, fetchDatasources, workflows: projectWorkflows, fetchWorkflows } = useAppStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [deletingPage, setDeletingPage] = useState<any>(null);
  const [viewingPage, setViewingPage] = useState<any>(null);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [history, setHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [componentData, setComponentData] = useState<Record<string, any>>({});
  const [dataLoading, setDataLoading] = useState<Record<string, boolean>>({});
  const [componentActions, setComponentActions] = useState<Record<string, any>>({});
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formSubmitting, setFormSubmitting] = useState<Record<string, boolean>>({});

  // Table row actions
  const [tableRowActions, setTableRowActions] = useState<Record<string, boolean>>({});

  // Sample components data - in a real app, this would come from the page layout
  const [pageComponents, setPageComponents] = useState<any[]>([
    {
      id: '1',
      type: 'heading',
      content: 'Welcome to Sample Page',
      size: 'lg',
      color: 'slate-800',
      alignment: 'left'
    },
    {
      id: '2',
      type: 'text',
      content: 'This is a sample text component. You can edit the content, styling, and other properties.',
      size: 'base',
      color: 'slate-700',
      alignment: 'left'
    },
    {
      id: '3',
      type: 'button',
      content: 'Sample Button',
      variant: 'primary',
      size: 'md'
    },
    {
      id: '4',
      type: 'input',
      placeholder: 'Sample input field',
      inputType: 'text'
    }
  ] as any[]);

  // Initialize history with initial state
  useEffect(() => {
    if (pageComponents.length > 0 && history.length === 0) {
      setHistory([[...pageComponents]]);
      setHistoryIndex(0);
    }
  }, [pageComponents, history.length]);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPageComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        addToHistory(newItems);
        return newItems;
      });
    }
  };

  // History management
  const addToHistory = (newComponents: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newComponents]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPageComponents([...history[newIndex]]);
      setSelectedComponent(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPageComponents([...history[newIndex]]);
      setSelectedComponent(null);
    }
  };

  // Component templates
  const componentTemplates = {
    contactForm: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Contact Us',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Get in touch with us. We\'d love to hear from you.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'input',
        placeholder: 'Your Name',
        inputType: 'text'
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'input',
        placeholder: 'Your Email',
        inputType: 'email'
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'input',
        placeholder: 'Your Message',
        inputType: 'text'
      },
      {
        id: (Date.now() + 5).toString(),
        type: 'button',
        content: 'Send Message',
        variant: 'primary',
        size: 'md'
      }
    ],
    userProfile: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'User Profile',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'table',
        headers: ['Field', 'Value'],
        rows: [
          ['Name', 'John Doe'],
          ['Email', 'john@example.com'],
          ['Role', 'Administrator'],
          ['Status', 'Active']
        ]
      }
    ],
    dashboard: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Dashboard',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Welcome to your dashboard. Here\'s an overview of your data.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'table',
        headers: ['Metric', 'Value', 'Change'],
        rows: [
          ['Total Users', '1,234', '+12%'],
          ['Revenue', '$45,678', '+8%'],
          ['Orders', '567', '+15%']
        ]
      }
    ]
  };

  const addTemplate = (templateName: string) => {
    const template = componentTemplates[templateName as keyof typeof componentTemplates];
    if (template) {
      const newComponents = [...pageComponents, ...template];
      setPageComponents(newComponents);
      addToHistory(newComponents);
      toast({
        title: 'Template added',
        description: `${templateName} template has been added to your page.`,
      });
    }
  };

  // Data binding and fetching
  const fetchComponentData = async (componentId: string, datasourceId: string, query?: any) => {
    if (!currentProject) return;
    
    setDataLoading(prev => ({ ...prev, [componentId]: true }));
    try {
      const result = await apiClient.runDatasourceQuery(currentProject.id, datasourceId, query || {});
      setComponentData(prev => ({ ...prev, [componentId]: result }));
    } catch (error) {
      console.error('Failed to fetch component data:', error);
      toast({
        title: 'Data fetch failed',
        description: 'Failed to load data for this component.',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(prev => ({ ...prev, [componentId]: false }));
    }
  };

  const getComponentData = (componentId: string) => {
    return componentData[componentId] || null;
  };

  const isComponentDataLoading = (componentId: string) => {
    return dataLoading[componentId] || false;
  };

  useEffect(() => {
    const loadPages = async () => {
      if (!currentProject) return;
      try {
        setLoading(true);
        await fetchPages(currentProject.id);
        await fetchDatasources(currentProject.id);
        await fetchWorkflows(currentProject.id);
        setWorkflows(projectWorkflows);
      } catch (error) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    loadPages();
  }, [currentProject, fetchPages, fetchDatasources, fetchWorkflows, projectWorkflows]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        setPreviewMode(!previewMode);
      }
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
      }
      if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    if (showViewDialog) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showViewDialog, previewMode, undo, redo]);

  const handleEdit = (page: any) => {
    setEditingPage(page);
    setShowEditDialog(true);
  };

  const handleDelete = (page: any) => {
    setDeletingPage(page);
    setShowDeleteDialog(true);
  };

  const handleViewPage = (page: any) => {
    setViewingPage(page);
    setShowViewDialog(true);
  };

  // Form handling and data collection
  const handleFormSubmit = async (formId: string, workflowId: string) => {
    if (!currentProject) return;
    
    setFormSubmitting(prev => ({ ...prev, [formId]: true }));
    try {
      // Collect form data from all input components in the form
      const formComponents = pageComponents.filter(c => c.formId === formId);
      const collectedData: Record<string, any> = {};
      
      formComponents.forEach(component => {
        if (component.type === 'input' && component.fieldName) {
          collectedData[component.fieldName] = formData[component.id] || '';
        }
      });

      await apiClient.runWorkflow(currentProject.id, workflowId, { formData: collectedData });
      toast({ 
        title: 'Form submitted', 
        description: 'Form data has been submitted successfully.' 
      });
      
      // Clear form data after successful submission
      const newFormData = { ...formData };
      formComponents.forEach(component => {
        if (component.type === 'input') {
          delete newFormData[component.id];
        }
      });
      setFormData(newFormData);
      
    } catch (error) {
      toast({ 
        title: 'Submission failed', 
        description: 'There was an error submitting the form.', 
        variant: 'destructive' 
      });
    } finally {
      setFormSubmitting(prev => ({ ...prev, [formId]: false }));
    }
  };

  const updateFormField = (componentId: string, value: string) => {
    setFormData(prev => ({ ...prev, [componentId]: value }));
  };

  // Table row actions
  const handleTableRowClick = async (componentId: string, rowIndex: number, workflowId: string) => {
    if (!currentProject) return;
    
    setTableRowActions(prev => ({ ...prev, [`${componentId}-${rowIndex}`]: true }));
    try {
      const rowData = getComponentData(componentId)?.data?.[rowIndex] || {};
      await apiClient.runWorkflow(currentProject.id, workflowId, { rowData });
      toast({ 
        title: 'Row action executed', 
        description: 'The row action ran successfully.' 
      });
    } catch (error) {
      toast({ 
        title: 'Row action failed', 
        description: 'There was an error running the row action.', 
        variant: 'destructive' 
      });
    } finally {
      setTableRowActions(prev => ({ ...prev, [`${componentId}-${rowIndex}`]: false }));
    }
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No project selected</h3>
        <p className="text-slate-600">
          Select a project to view and manage its pages
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pages</h1>
          <p className="text-slate-600 mt-1">
            Pages in {currentProject.name}
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {pages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <Card key={page.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-green-600" />
                  {page.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Created {new Date(page.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(page)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(page)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No pages yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first page for {currentProject.name}
          </p>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Page
          </Button>
        </div>
      )}

      {/* Page Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Page</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const title = formData.get('title') as string;
                const layout = { components: [] };
                await createPage(currentProject.id, { title, layout });
                setShowCreateDialog(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Page Title</label>
                <input name="title" required className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white">
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Edit Dialog */}
      {showEditDialog && editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Page</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const title = formData.get('title') as string;
                await updatePage(editingPage.id, { title });
                setShowEditDialog(false);
                setEditingPage(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Page Title</label>
                <input name="title" defaultValue={editingPage.title} required className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); setEditingPage(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white">
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Page</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete "{deletingPage.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setShowDeleteDialog(false); setDeletingPage(null); }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  await deletePage(deletingPage.id);
                  setShowDeleteDialog(false);
                  setDeletingPage(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Viewer Dialog */}
      {showViewDialog && viewingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{viewingPage.title}</h2>
                <div className="flex gap-2">
                  <Button 
                    variant={previewMode ? "default" : "outline"}
                    onClick={() => setPreviewMode(!previewMode)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    title="Toggle preview mode (Ctrl+P)"
                  >
                    {previewMode ? 'Edit Mode' : 'Preview Mode'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    title="Undo (Ctrl+Z)"
                  >
                    Undo
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    title="Redo (Ctrl+Y)"
                  >
                    Redo
                  </Button>
                  <Button 
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={async () => {
                      try {
                        await updatePage(viewingPage.id, { 
                          title: viewingPage.title, 
                          content: JSON.stringify(pageComponents)
                        });
                        toast({
                          title: 'Page saved',
                          description: 'Page layout has been saved successfully.',
                        });
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: 'Failed to save page layout.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Save Layout
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setShowViewDialog(false); setViewingPage(null); setSelectedComponent(null); setPreviewMode(false); }}
                  >
                    Close
                  </Button>
                </div>
              </div>
              
              {/* Component Library */}
              {!previewMode && (
                <div className="mb-4 p-4 bg-white rounded border">
                  <h3 className="font-medium text-slate-800 mb-3">Component Library</h3>
                  
                  {/* Templates Section */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Templates</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('contactForm')}
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        Contact Form
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('userProfile')}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        User Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('dashboard')}
                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      >
                        Dashboard
                      </Button>
                    </div>
                  </div>
                  
                  {/* Individual Components */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Components</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'heading',
                            content: 'New Heading',
                            size: 'lg',
                            color: 'slate-800',
                            alignment: 'left'
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Heading
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'text',
                            content: 'New text content',
                            size: 'base',
                            color: 'slate-700',
                            alignment: 'left'
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Text
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'button',
                            content: 'New Button',
                            variant: 'primary',
                            size: 'md'
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Button
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'input',
                            placeholder: 'Enter text...',
                            inputType: 'text'
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Input
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'select',
                            placeholder: 'Select an option...',
                            options: ['Option 1', 'Option 2', 'Option 3']
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Select
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'checkbox',
                            label: 'Check this option',
                            checked: false
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Checkbox
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'table',
                            headers: ['Name', 'Email', 'Role'],
                            rows: [
                              ['John Doe', 'john@example.com', 'Admin'],
                              ['Jane Smith', 'jane@example.com', 'User']
                            ]
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Table
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'form',
                            label: 'Form Container',
                            icon: 'F'
                          };
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Form Container
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Page Builder Canvas */}
              <div className={`border-2 border-dashed border-slate-300 rounded-lg p-6 min-h-[400px] ${previewMode ? 'bg-white' : 'bg-slate-50'}`}>
                {previewMode ? (
                  // Preview Mode - Clean rendering without editing controls
                  <div className="space-y-4">
                    {pageComponents.map((component) => (
                      <div key={component.id} className="bg-white p-4 rounded">
                        {component.type === 'heading' && (
                          <h3 className={`font-semibold text-${component.color} text-${component.size}`}>
                            {component.datasourceId && component.dataField 
                              ? getComponentData(component.id)?.data?.[0]?.[component.dataField] || component.content
                              : component.content
                            }
                          </h3>
                        )}
                        
                        {component.type === 'text' && (
                          <p className={`text-${component.color} text-${component.size}`}>
                            {component.datasourceId && component.dataField 
                              ? getComponentData(component.id)?.data?.[0]?.[component.dataField] || component.content
                              : component.content
                            }
                          </p>
                        )}
                        
                        {component.type === 'button' && (
                          <button
                            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-${component.size}`}
                            disabled={actionLoading}
                            onClick={async (e) => {
                              if (!component.workflowId) return;
                              e.preventDefault();
                              setActionLoading(true);
                              setActionStatus(null);
                              try {
                                await apiClient.runWorkflow(currentProject.id, component.workflowId, {});
                                setActionStatus('success');
                                toast({ title: 'Workflow executed', description: 'The workflow ran successfully.' });
                              } catch (error) {
                                setActionStatus('error');
                                toast({ title: 'Workflow failed', description: 'There was an error running the workflow.', variant: 'destructive' });
                              } finally {
                                setActionLoading(false);
                                setTimeout(() => setActionStatus(null), 2000);
                              }
                            }}
                          >
                            {actionLoading ? (
                              <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>Running...</span>
                            ) : (
                              <>{component.content}</>
                            )}
                          </button>
                        )}
                        
                        {component.type === 'input' && (
                          <input 
                            type={component.inputType || 'text'} 
                            placeholder={component.placeholder} 
                            className="w-full border rounded px-3 py-2"
                            readOnly={!previewMode}
                            value={previewMode ? (component.formData || '') : ''}
                            onChange={previewMode ? (e) => {
                              // Update form data in parent component
                              if (component.onFormFieldUpdate) {
                                component.onFormFieldUpdate(component.id, e.target.value);
                              }
                            } : undefined}
                          />
                        )}
                        
                        {component.type === 'select' && (
                          <select 
                            className="w-full border rounded px-3 py-2 bg-white" 
                            disabled={!previewMode}
                            value={previewMode ? (component.formData || '') : ''}
                            onChange={previewMode ? (e) => {
                              if (component.onFormFieldUpdate) {
                                component.onFormFieldUpdate(component.id, e.target.value);
                              }
                            } : undefined}
                          >
                            <option value="">{component.placeholder}</option>
                            {component.options?.map((option: string, index: number) => (
                              <option key={index} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        
                        {component.type === 'checkbox' && (
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={previewMode ? (component.formData || component.checked) : component.checked} 
                              className="w-4 h-4"
                              readOnly={!previewMode}
                              onChange={previewMode ? (e) => {
                                if (component.onFormFieldUpdate) {
                                  component.onFormFieldUpdate(component.id, e.target.checked);
                                }
                              } : undefined}
                            />
                            <span className="text-sm">{component.label}</span>
                          </div>
                        )}
                        
                        {component.type === 'table' && (
                          <div className="overflow-x-auto">
                            {isComponentDataLoading(component.id) ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-slate-500">Loading data...</span>
                              </div>
                            ) : (
                              <table className="w-full border-collapse border border-slate-300">
                                <thead>
                                  <tr className="bg-slate-50">
                                    {component.headers?.map((header: string, index: number) => (
                                      <th key={index} className="border border-slate-300 px-3 py-2 text-left text-sm font-medium">
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {component.datasourceId ? (
                                    // Dynamic data from datasource
                                    getComponentData(component.id)?.data?.map((row: any, rowIndex: number) => (
                                      <tr 
                                        key={rowIndex}
                                        className={previewMode && component.rowActionWorkflowId ? 'cursor-pointer hover:bg-slate-100' : ''}
                                        onClick={previewMode && component.rowActionWorkflowId ? async () => {
                                          if (component.onTableRowClick) {
                                            await component.onTableRowClick(component.id, rowIndex, component.rowActionWorkflowId);
                                          }
                                        } : undefined}
                                      >
                                        {component.headers?.map((header: string, cellIndex: number) => (
                                          <td key={cellIndex} className="border border-slate-300 px-3 py-2 text-sm">
                                            {row[header] || row[cellIndex] || ''}
                                          </td>
                                        ))}
                                      </tr>
                                    )) || []
                                  ) : (
                                    // Static data
                                    component.rows?.map((row: string[], rowIndex: number) => (
                                      <tr 
                                        key={rowIndex}
                                        className={previewMode && component.rowActionWorkflowId ? 'cursor-pointer hover:bg-slate-100' : ''}
                                        onClick={previewMode && component.rowActionWorkflowId ? async () => {
                                          if (component.onTableRowClick) {
                                            await component.onTableRowClick(component.id, rowIndex, component.rowActionWorkflowId);
                                          }
                                        } : undefined}
                                      >
                                        {row.map((cell: string, cellIndex: number) => (
                                          <td key={cellIndex} className="border border-slate-300 px-3 py-2 text-sm">
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Edit Mode - Full editing capabilities
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pageComponents.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {/* Dynamic Components */}
                        {pageComponents.map((component) => (
                          <SortableComponent
                            key={component.id}
                            component={{
                              ...component,
                              formData: formData[component.id],
                              formSubmitting: formSubmitting[component.formId || ''],
                              tableRowLoading: tableRowActions,
                              onFormFieldUpdate: updateFormField,
                              onFormSubmit: handleFormSubmit,
                              onTableRowClick: handleTableRowClick
                            }}
                            isSelected={selectedComponent?.id === component.id}
                            onSelect={setSelectedComponent}
                            onUpdate={(updatedComponent: any) => {
                              const newComponents = pageComponents.map(c => 
                                c.id === component.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                            onDelete={() => {
                              const newComponents = pageComponents.filter(c => c.id !== component.id);
                              setPageComponents(newComponents);
                              setSelectedComponent(null);
                              addToHistory(newComponents);
                            }}
                            getComponentData={getComponentData}
                            isComponentDataLoading={isComponentDataLoading}
                            previewMode={previewMode}
                            runWorkflow={async (workflowId: string) => {
                              if (!currentProject) return;
                              await apiClient.runWorkflow(currentProject.id, workflowId, {});
                            }}
                            toast={toast}
                            currentProject={currentProject}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                
                {/* Canvas Instructions */}
                <div className="mt-6 text-center text-slate-500">
                  <p>{previewMode ? 'Preview Mode - Interactive components' : 'Drag components to reorder • Click to edit properties'}</p>
                  {!previewMode && (
                    <p className="text-xs mt-1">
                      {pageComponents.length} component{pageComponents.length !== 1 ? 's' : ''} • Ctrl+P: Preview • Ctrl+Z: Undo • Ctrl+Y: Redo
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Properties Panel */}
            {!previewMode && (
              <div className="w-80 border-l border-slate-200 bg-slate-50 p-4 overflow-y-auto">
                <h3 className="font-semibold text-slate-800 mb-4">Properties</h3>
                
                {selectedComponent ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Component Type</Label>
                      <div className="text-sm text-slate-600 mt-1 capitalize">{selectedComponent.type}</div>
                    </div>
                    
                    {(selectedComponent.type === 'heading' || selectedComponent.type === 'text') && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Data Source</Label>
                          <Select 
                            value={selectedComponent.datasourceId || ''}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, datasourceId: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                              
                              // Fetch data if datasource is selected
                              if (value) {
                                fetchComponentData(selectedComponent.id, value);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a datasource" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Static Data</SelectItem>
                              {datasources.map((ds) => (
                                <SelectItem key={ds.id} value={ds.id}>
                                  {ds.name} ({ds.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedComponent.datasourceId && (
                          <div>
                            <Label className="text-sm font-medium">Data Loading</Label>
                            <div className="text-xs text-slate-500 mt-1">
                              {isComponentDataLoading(selectedComponent.id) ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  Loading data...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Data loaded
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <Label className="text-sm font-medium">Text Content</Label>
                          <Input 
                            value={selectedComponent.content} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, content: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Text Size</Label>
                          <Select 
                            value={selectedComponent.size}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, size: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                              <SelectItem value="xl">Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Text Color</Label>
                          <Select 
                            value={selectedComponent.color}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, color: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="slate-800">Dark Gray</SelectItem>
                              <SelectItem value="blue-600">Blue</SelectItem>
                              <SelectItem value="green-600">Green</SelectItem>
                              <SelectItem value="red-600">Red</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'button' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Button Text</Label>
                          <Input 
                            value={selectedComponent.content} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, content: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Button Size</Label>
                          <Select 
                            value={selectedComponent.size}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, size: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="md">Medium</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Action Section */}
                        <div className="pt-2">
                          <Label className="text-sm font-medium">Action</Label>
                          <Select
                            value={selectedComponent.workflowId || ''}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, workflowId: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c =>
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a workflow to run" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No Action</SelectItem>
                              {workflows.map((wf) => (
                                <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-slate-500 mt-1">
                            When clicked, this button will run the selected workflow.
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'input' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Placeholder</Label>
                          <Input 
                            value={selectedComponent.placeholder} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, placeholder: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Input Type</Label>
                          <Select 
                            value={selectedComponent.inputType || 'text'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, inputType: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="password">Password</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Form Integration */}
                        <div>
                          <Label className="text-sm font-medium">Form Container</Label>
                          <Select 
                            value={selectedComponent.formId || ''}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, formId: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a form container" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No Form</SelectItem>
                              <SelectItem value="contact-form">Contact Form</SelectItem>
                              <SelectItem value="user-form">User Form</SelectItem>
                              <SelectItem value="settings-form">Settings Form</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedComponent.formId && (
                          <div>
                            <Label className="text-sm font-medium">Field Name</Label>
                            <Input 
                              value={selectedComponent.fieldName || ''} 
                              className="mt-1"
                              placeholder="e.g., name, email, message"
                              onChange={(e) => {
                                const updatedComponent = { ...selectedComponent, fieldName: e.target.value };
                                setSelectedComponent(updatedComponent);
                                const newComponents = pageComponents.map(c => 
                                  c.id === selectedComponent.id ? updatedComponent : c
                                );
                                setPageComponents(newComponents);
                                addToHistory(newComponents);
                              }}
                            />
                            <div className="text-xs text-slate-500 mt-1">
                              This field will be included in form submissions.
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    {selectedComponent.type === 'select' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Placeholder</Label>
                          <Input 
                            value={selectedComponent.placeholder} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, placeholder: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Options (comma-separated)</Label>
                          <Input 
                            value={selectedComponent.options?.join(', ') || ''} 
                            className="mt-1"
                            onChange={(e) => {
                              const options = e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt);
                              const updatedComponent = { ...selectedComponent, options };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'checkbox' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Label</Label>
                          <Input 
                            value={selectedComponent.label} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, label: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Default State</Label>
                          <Select 
                            value={selectedComponent.checked ? 'checked' : 'unchecked'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, checked: value === 'checked' };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checked">Checked</SelectItem>
                              <SelectItem value="unchecked">Unchecked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'table' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Data Source</Label>
                          <Select 
                            value={selectedComponent.datasourceId || ''}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, datasourceId: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                              
                              // Fetch data if datasource is selected
                              if (value) {
                                fetchComponentData(selectedComponent.id, value);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a datasource" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Static Data</SelectItem>
                              {datasources.map((ds) => (
                                <SelectItem key={ds.id} value={ds.id}>
                                  {ds.name} ({ds.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedComponent.datasourceId && (
                          <div>
                            <Label className="text-sm font-medium">Data Loading</Label>
                            <div className="text-xs text-slate-500 mt-1">
                              {isComponentDataLoading(selectedComponent.id) ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  Loading data...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Data loaded
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <Label className="text-sm font-medium">Headers (comma-separated)</Label>
                          <Input 
                            value={selectedComponent.headers?.join(', ') || ''} 
                            className="mt-1"
                            onChange={(e) => {
                              const headers = e.target.value.split(',').map(header => header.trim()).filter(header => header);
                              const updatedComponent = { ...selectedComponent, headers };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                        </div>
                        
                        {!selectedComponent.datasourceId && (
                          <div>
                            <Label className="text-sm font-medium">Sample Data</Label>
                            <div className="text-xs text-slate-500 mt-1 mb-2">
                              Format: Row1Col1,Row1Col2|Row2Col1,Row2Col2
                            </div>
                            <Input 
                              value={selectedComponent.rows?.map(row => row.join(',')).join('|') || ''} 
                              className="mt-1"
                              onChange={(e) => {
                                const rows = e.target.value.split('|').map(row => 
                                  row.split(',').map(cell => cell.trim()).filter(cell => cell)
                                ).filter(row => row.length > 0);
                                const updatedComponent = { ...selectedComponent, rows };
                                setSelectedComponent(updatedComponent);
                                const newComponents = pageComponents.map(c => 
                                  c.id === selectedComponent.id ? updatedComponent : c
                                );
                                setPageComponents(newComponents);
                                addToHistory(newComponents);
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                    
                    {selectedComponent.type === 'form' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Form ID</Label>
                          <Input 
                            value={selectedComponent.formId || ''} 
                            className="mt-1"
                            placeholder="e.g., contact-form"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, formId: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Unique identifier for this form. Input components can reference this ID.
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Submit Workflow</Label>
                          <Select 
                            value={selectedComponent.submitWorkflowId || ''}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, submitWorkflowId: value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a workflow to run on submit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No workflow</SelectItem>
                              {workflows.map(workflow => (
                                <SelectItem key={workflow.id} value={workflow.id}>
                                  {workflow.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-slate-500 mt-1">
                            Workflow to execute when form is submitted.
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Table Row Actions */}
                    <div className="pt-2 border-t border-slate-200">
                      <Label className="text-sm font-medium">Row Action</Label>
                      <Select 
                        value={selectedComponent.rowActionWorkflowId || ''}
                        onValueChange={(value) => {
                          const updatedComponent = { ...selectedComponent, rowActionWorkflowId: value };
                          setSelectedComponent(updatedComponent);
                          const newComponents = pageComponents.map(c => 
                            c.id === selectedComponent.id ? updatedComponent : c
                          );
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a workflow for row clicks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Row Action</SelectItem>
                          {workflows.map((wf) => (
                            <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-slate-500 mt-1">
                        Workflow to execute when a table row is clicked in preview mode.
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            const duplicatedComponent = {
                              ...selectedComponent,
                              id: Date.now().toString(),
                              content: selectedComponent.content ? `${selectedComponent.content} (Copy)` : selectedComponent.content,
                              placeholder: selectedComponent.placeholder ? `${selectedComponent.placeholder} (Copy)` : selectedComponent.placeholder
                            };
                            const newComponents = [...pageComponents, duplicatedComponent];
                            setPageComponents(newComponents);
                            setSelectedComponent(duplicatedComponent);
                            toast({
                              title: 'Component duplicated',
                              description: 'Component has been duplicated successfully.',
                            });
                            addToHistory(newComponents);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            const newComponents = pageComponents.filter(c => c.id !== selectedComponent.id);
                            setPageComponents(newComponents);
                            setSelectedComponent(null);
                            toast({
                              title: 'Component deleted',
                              description: 'Component has been deleted successfully.',
                            });
                            addToHistory(newComponents);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <p>Select a component to edit its properties</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
