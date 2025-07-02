import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import { useToast, toast } from '../hooks/use-toast';
import { useCollaboration } from '../hooks/use-collaboration';
import { Chart } from '../components/ui/chart';
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  GripVertical,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Copy,
  Palette
} from 'lucide-react';
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
import type {
  Component,
  ComponentType,
  Page,
  Project,
  Datasource,
  Workflow,
  HistoryEntry,
  FormData,
  ComponentData,
  UserRole,
} from '../types/components';
import { VersionHistory } from '../components/ui/version-history';

// Sortable Component Wrapper
type SortableComponentProps = {
  component: Component;
  isSelected: boolean;
  onSelect: (component: Component) => void;
  onUpdate: (component: Component) => void;
  onDelete: () => void;
  getComponentData: (componentId: string) => ComponentData | null;
  isComponentDataLoading: (componentId: string) => boolean;
  previewMode: boolean;
  runWorkflow: (workflowId: string) => Promise<void>;
  toast: typeof toast;
  currentProject: Project;
};
const SortableComponent = (props: SortableComponentProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.component.id });

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
        props.isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'hover:border-blue-400'
      }`}
      onClick={() => props.onSelect(props.component)}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-slate-400 hover:text-slate-600"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-500 capitalize">{props.component.type}</span>
      </div>
      
      {props.component.type === 'heading' && (
        <h3 className={`font-semibold text-${props.component.color} text-${props.component.size}`}>
          {props.component.datasourceId && props.component.dataField 
            ? props.getComponentData(props.component.id)?.data?.[0]?.[props.component.dataField] || props.component.content
            : props.component.content
          }
        </h3>
      )}
      
      {props.component.type === 'text' && (
        <p className={`text-${props.component.color} text-${props.component.size}`}>
          {props.component.datasourceId && props.component.dataField 
            ? props.getComponentData(props.component.id)?.data?.[0]?.[props.component.dataField] || props.component.content
            : props.component.content
          }
        </p>
      )}
      
      {props.component.type === 'button' && (
        <button
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-${props.component.size}`}
          disabled={actionLoading}
          onClick={async (e) => {
            if (!props.component.workflowId) return;
            e.preventDefault();
            setActionLoading(true);
            setActionStatus(null);
            try {
              await props.runWorkflow(props.currentProject.id);
              setActionStatus('success');
              props.toast({ title: 'Workflow executed', description: 'The workflow ran successfully.' });
            } catch (error) {
              setActionStatus('error');
              props.toast({ title: 'Workflow failed', description: 'There was an error running the workflow.', variant: 'destructive' });
            } finally {
              setActionLoading(false);
              setTimeout(() => setActionStatus(null), 2000);
            }
          }}
        >
          {actionLoading ? (
            <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>Running...</span>
          ) : (
            <>{props.component.content}</>
          )}
        </button>
      )}
      
      {props.component.type === 'input' && (
        <input 
          type={props.component.inputType || 'text'} 
          placeholder={props.component.placeholder} 
          className="w-full border rounded px-3 py-2"
          readOnly={!props.previewMode}
          value={props.previewMode ? (props.component.formData || '') : ''}
          onChange={props.previewMode ? (e) => {
            // Update form data in parent component
            if (props.component.onFormFieldUpdate) {
              props.component.onFormFieldUpdate(props.component.id, e.target.value);
            }
          } : undefined}
        />
      )}
      
      {props.component.type === 'select' && (
        <select 
          className="w-full border rounded px-3 py-2 bg-white" 
          disabled={!props.previewMode}
          value={props.previewMode ? (props.component.formData || '') : ''}
          onChange={props.previewMode ? (e) => {
            if (props.component.onFormFieldUpdate) {
              props.component.onFormFieldUpdate(props.component.id, e.target.value);
            }
          } : undefined}
        >
          <option value="">{props.component.placeholder}</option>
          {props.component.options?.map((option: string, index: number) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      )}
      
      {props.component.type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={props.previewMode ? (props.component.formData || props.component.checked) : props.component.checked} 
            className="w-4 h-4"
            readOnly={!props.previewMode}
            onChange={props.previewMode ? (e) => {
              if (props.component.onFormFieldUpdate) {
                props.component.onFormFieldUpdate(props.component.id, e.target.checked);
              }
            } : undefined}
          />
          <span className="text-sm">{props.component.label}</span>
        </div>
      )}
      
      {props.component.type === 'table' && (
        <div className="overflow-x-auto">
          {props.isComponentDataLoading(props.component.id) ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-slate-500">Loading data...</span>
            </div>
          ) : (
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-50">
                  {props.component.headers?.map((header: string, index: number) => (
                    <th key={index} className="border border-slate-300 px-3 py-2 text-left text-sm font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {props.component.datasourceId ? (
                  // Dynamic data from datasource
                  props.getComponentData(props.component.id)?.data?.map((row: any, rowIndex: number) => (
                    <tr 
                      key={rowIndex}
                      className={props.previewMode && props.component.rowActionWorkflowId ? 'cursor-pointer hover:bg-slate-100' : ''}
                      onClick={props.previewMode && props.component.rowActionWorkflowId ? async () => {
                        if (props.component.onTableRowClick) {
                          await props.component.onTableRowClick(props.component.id, rowIndex, props.component.rowActionWorkflowId);
                        }
                      } : undefined}
                    >
                      {props.component.headers?.map((header: string, cellIndex: number) => (
                        <td key={cellIndex} className="border border-slate-300 px-3 py-2 text-sm">
                          {cellIndex === 0 && props.component.tableRowLoading?.[`${props.component.id}-${rowIndex}`] ? (
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
                  props.component.rows?.map((row: string[], rowIndex: number) => (
                    <tr 
                      key={rowIndex}
                      className={props.previewMode && props.component.rowActionWorkflowId ? 'cursor-pointer hover:bg-slate-100' : ''}
                      onClick={props.previewMode && props.component.rowActionWorkflowId ? async () => {
                        if (props.component.onTableRowClick) {
                          await props.component.onTableRowClick(props.component.id, rowIndex, props.component.rowActionWorkflowId);
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
      
      {props.component.type === 'form' && (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
          <div className="text-center text-slate-500 mb-4">
            <div className="text-lg font-medium">Form Container</div>
            <div className="text-sm">ID: {props.component.formId || 'Not set'}</div>
            {props.component.submitWorkflowId && (
              <div className="text-xs mt-1">Submit workflow: {props.component.submitWorkflowId}</div>
            )}
          </div>
          
          {props.previewMode && props.component.submitWorkflowId && (
            <button
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              disabled={props.component.formSubmitting}
              onClick={async (e) => {
                e.preventDefault();
                if (!props.component.formId || !props.component.submitWorkflowId) return;
                
                if (props.component.onFormSubmit) {
                  await props.component.onFormSubmit(props.component.formId, props.component.submitWorkflowId);
                }
              }}
            >
              {props.component.formSubmitting ? (
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
      
      {(props.component.type === 'bar-chart' || props.component.type === 'line-chart' || props.component.type === 'pie-chart') && (
        <div className="w-full h-64 border border-slate-200 rounded-lg p-4">
          {props.isComponentDataLoading(props.component.id) ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-slate-500">Loading chart data...</span>
            </div>
          ) : (
            <Chart
              type={props.component.type === 'bar-chart' ? 'bar' : props.component.type === 'line-chart' ? 'line' : 'pie'}
              data={props.component.datasourceId ? props.getComponentData(props.component.id)?.data || [] : props.component.staticData || []}
              title={props.component.title}
              xAxisKey={props.component.xAxisKey}
              dataKey={props.component.dataKey}
              height={200}
            />
          )}
        </div>
      )}
      
      {props.component.type === 'file-upload' && (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
          <div className="text-center">
            <div className="text-4xl mb-2">📁</div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">{props.component.title || 'File Upload'}</h3>
            <p className="text-sm text-slate-600 mb-4">{props.component.description || 'Drag and drop files here or click to browse'}</p>
            
            {props.previewMode ? (
              <div className="space-y-4">
                <input
                  type="file"
                  multiple={props.component.multiple}
                  accept={props.component.acceptTypes}
                  className="hidden"
                  id={`file-upload-${props.component.id}`}
                  onChange={(e) => {
                    if (props.component.onFileUpload) {
                      props.component.onFileUpload(props.component.id, e.target.files);
                    }
                  }}
                />
                <label
                  htmlFor={`file-upload-${props.component.id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  Choose Files
                </label>
                
                {props.component.uploadedFiles && props.component.uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-slate-800 mb-2">Uploaded Files:</h4>
                    <div className="space-y-2">
                      {props.component.uploadedFiles.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-green-600">✓ Uploaded</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">File upload component - configure in properties</div>
            )}
          </div>
        </div>
      )}
      
      {props.component.type === 'image-gallery' && (
        <div className="border border-slate-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">{props.component.title || 'Image Gallery'}</h3>
          
          {props.previewMode ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {props.component.images?.map((image: any, index: number) => (
                <div key={index} className="relative group cursor-pointer">
                  <img
                    src={image.url}
                    alt={image.alt || `Image ${index + 1}`}
                    className="w-full h-32 object-cover rounded border hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (props.component.onImageClick) {
                        props.component.onImageClick(props.component.id, index, image);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm">View</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">🖼️</div>
              <p>Image gallery component - add images in properties</p>
            </div>
          )}
        </div>
      )}
      
      {props.component.type === 'document-viewer' && (
        <div className="border border-slate-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">{props.component.title || 'Document Viewer'}</h3>
          
          {props.previewMode && props.component.documentUrl ? (
            <div className="bg-slate-50 rounded border p-4">
              {props.component.documentType === 'pdf' ? (
                <iframe
                  src={props.component.documentUrl}
                  className="w-full h-96 border-0"
                  title="Document Viewer"
                />
              ) : props.component.documentType === 'image' ? (
                <img
                  src={props.component.documentUrl}
                  alt="Document"
                  className="w-full max-h-96 object-contain"
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-slate-600 mb-4">{props.component.documentName || 'Document'}</p>
                  <a
                    href={props.component.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">📄</div>
              <p>Document viewer component - configure document in properties</p>
            </div>
          )}
        </div>
      )}
      
      {props.component.type === 'video-player' && (
        <div className="border border-slate-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">{props.component.title || 'Video Player'}</h3>
          
          {props.previewMode && props.component.videoUrl ? (
            <div className="bg-black rounded overflow-hidden">
              <video
                controls
                className="w-full h-64 object-contain"
                poster={props.component.posterUrl}
                src={props.component.videoUrl}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">🎥</div>
              <p>Video player component - configure video in properties</p>
            </div>
          )}
        </div>
      )}
      
      {props.component.type === 'permission-manager' && (
        <div className="border border-slate-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-4">{props.component.title || 'Permission Manager'}</h3>
          
          {props.previewMode ? (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <p>Permission management interface - configure in properties</p>
                <p className="mt-2">This component allows users to manage roles and permissions.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">🔐</div>
              <p>Permission manager - configure permissions in properties</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Pages = () => {
  const { currentProject, pages, fetchPages, createPage, updatePage, deletePage, datasources, fetchDatasources, workflows: projectWorkflows, fetchWorkflows } = useAppStore();
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [deletingPage, setDeletingPage] = useState<Page | null>(null);
  const [viewingPage, setViewingPage] = useState<Page | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [history, setHistory] = useState<Component[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [componentData, setComponentData] = useState<Record<string, ComponentData>>({});
  const [dataLoading, setDataLoading] = useState<Record<string, boolean>>({});
  const [componentActions, setComponentActions] = useState<Record<string, any>>({});
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [formSubmitting, setFormSubmitting] = useState<Record<string, boolean>>({});
  // Table row actions
  const [tableRowActions, setTableRowActions] = useState<Record<string, boolean>>({});
  // File upload handling
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [fileUploading, setFileUploading] = useState<Record<string, boolean>>({});
  
  // Collaboration state
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [cursorPositions, setCursorPositions] = useState<Record<string, { x: number; y: number; userId: string }>>({});
  const [collaborationComments, setCollaborationComments] = useState<any[]>([]);
  
  // Collaboration hook
  const collaboration = useCollaboration({
    roomId: viewingPage?.id || 'default',
    currentUser: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      color: '#3B82F6'
    } : { id: 'anonymous', name: 'Anonymous', email: '', color: '#6B7280' },
    jwt: token || '',
    onPageUpdate: (data) => {
      if (data.userId !== user?.id) {
        setPageComponents(data.components);
        addToHistory(data.components);
        toast({
          title: 'Page updated',
          description: `${data.userId} made changes to the page.`,
        });
      }
    },
    onCursorMove: (data) => {
      if (data.userId !== user?.id) {
        setCursorPositions(prev => ({
          ...prev,
          [data.userId]: { x: data.x, y: data.y, userId: data.userId }
        }));
      }
    },
    onCommentAdd: (data) => {
      setCollaborationComments(prev => [...prev, data]);
      toast({
        title: 'New comment',
        description: `${data.userId}: ${data.comment}`,
      });
    }
  });
  
  // Components data
  const [pageComponents, setPageComponents] = useState<Component[]>([
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
  ]);

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
  const addToHistory = (newComponents: Component[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newComponents]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Send page update via collaboration
    if (collaborationEnabled && collaboration.isConnected) {
      collaboration.sendPageUpdate(newComponents);
    }
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
        type: 'bar-chart',
        title: 'Monthly Sales',
        staticData: [
          { name: 'Jan', value: 400 },
          { name: 'Feb', value: 300 },
          { name: 'Mar', value: 600 },
          { name: 'Apr', value: 800 },
          { name: 'May', value: 500 },
          { name: 'Jun', value: 700 }
        ],
        xAxisKey: 'name',
        dataKey: 'value'
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'line-chart',
        title: 'Revenue Trend',
        staticData: [
          { name: 'Q1', value: 1200 },
          { name: 'Q2', value: 1800 },
          { name: 'Q3', value: 1600 },
          { name: 'Q4', value: 2200 }
        ],
        xAxisKey: 'name',
        dataKey: 'value'
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'pie-chart',
        title: 'Market Share',
        staticData: [
          { name: 'Product A', value: 35 },
          { name: 'Product B', value: 25 },
          { name: 'Product C', value: 20 },
          { name: 'Product D', value: 20 }
        ],
        xAxisKey: 'name',
        dataKey: 'value'
      }
    ],
    analytics: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Analytics Dashboard',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'bar-chart',
        title: 'User Activity',
        staticData: [
          { name: 'Mon', value: 120 },
          { name: 'Tue', value: 150 },
          { name: 'Wed', value: 180 },
          { name: 'Thu', value: 200 },
          { name: 'Fri', value: 170 },
          { name: 'Sat', value: 140 },
          { name: 'Sun', value: 100 }
        ],
        xAxisKey: 'name',
        dataKey: 'value'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'line-chart',
        title: 'Conversion Rate',
        staticData: [
          { name: 'Week 1', value: 2.5 },
          { name: 'Week 2', value: 3.2 },
          { name: 'Week 3', value: 2.8 },
          { name: 'Week 4', value: 4.1 }
        ],
        xAxisKey: 'name',
        dataKey: 'value'
      }
    ],
    mediaLibrary: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Media Library',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'file-upload',
        title: 'Upload Files',
        description: 'Upload documents, images, and other files',
        multiple: true,
        acceptTypes: '.pdf,.doc,.docx,.jpg,.png,.mp4'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'image-gallery',
        title: 'Photo Gallery',
        images: [
          { url: 'https://picsum.photos/300/200?random=1', alt: 'Sample Image 1' },
          { url: 'https://picsum.photos/300/200?random=2', alt: 'Sample Image 2' },
          { url: 'https://picsum.photos/300/200?random=3', alt: 'Sample Image 3' },
          { url: 'https://picsum.photos/300/200?random=4', alt: 'Sample Image 4' }
        ]
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'document-viewer',
        title: 'Document Viewer',
        documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        documentType: 'pdf',
        documentName: 'Sample Document'
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'video-player',
        title: 'Video Player',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        videoType: 'video/mp4'
      },
      {
        id: (Date.now() + 5).toString(),
        type: 'file-manager',
        title: 'File Manager',
        files: [
          { name: 'document.pdf', type: 'document', size: '1.2MB', modified: '2024-01-15' },
          { name: 'presentation.pptx', type: 'document', size: '2.5MB', modified: '2024-01-14' },
          { name: 'image.jpg', type: 'image', size: '800KB', modified: '2024-01-13' },
          { name: 'video.mp4', type: 'video', size: '15MB', modified: '2024-01-12' }
        ]
      }
    ],
    contentManagement: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Content Management',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Manage your digital assets and content in one place.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'file-upload',
        title: 'Upload Content',
        description: 'Upload new content files',
        multiple: false,
        acceptTypes: '.pdf,.doc,.docx,.jpg,.png,.gif,.mp4,.mov'
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'file-manager',
        title: 'Content Library',
        files: [
          { name: 'brand-guidelines.pdf', type: 'document', size: '3.1MB', modified: '2024-01-10' },
          { name: 'logo.png', type: 'image', size: '150KB', modified: '2024-01-09' },
          { name: 'product-demo.mp4', type: 'video', size: '25MB', modified: '2024-01-08' },
          { name: 'style-guide.docx', type: 'document', size: '1.8MB', modified: '2024-01-07' }
        ]
      }
    ],
    designSystem: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Design System',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'A comprehensive design system with consistent styling and theming.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'theme-selector',
        title: 'Theme Selection',
        selectedTheme: 'default',
        themes: [
          { name: 'Default', primaryColor: '#3b82f6', description: 'Default theme' },
          { name: 'Dark', primaryColor: '#1f2937', description: 'Dark theme' },
          { name: 'Light', primaryColor: '#f3f4f6', description: 'Light theme' },
          { name: 'Blue', primaryColor: '#1d4ed8', description: 'Blue theme' },
          { name: 'Green', primaryColor: '#059669', description: 'Green theme' }
        ]
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'style-preset',
        title: 'Style Presets',
        selectedPreset: 'modern',
        presets: [
          { name: 'Modern', description: 'Modern design system' },
          { name: 'Classic', description: 'Classic styling' },
          { name: 'Minimal', description: 'Minimal design' },
          { name: 'Bold', description: 'Bold and vibrant' }
        ]
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'css-editor',
        title: 'Custom CSS',
        cssCode: '/* Add your custom styles here */\n.custom-component {\n  border-radius: 8px;\n  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n}'
      }
    ],
    modernUI: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Modern UI Components',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'gradient-background',
        title: 'Hero Section',
        gradientType: 'linear',
        gradientDirection: 'to right',
        gradientColors: ['#667eea', '#764ba2']
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'responsive-container',
        title: 'Content Container',
        maxWidth: '1200px',
        currentBreakpoint: 'desktop'
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'animation-container',
        title: 'Animated Element',
        animationType: 'pulse',
        animationDuration: '2s'
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'button',
        content: 'Modern Button',
        variant: 'primary',
        size: 'lg'
      }
    ],
    creativeLayout: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Creative Layout',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'gradient-background',
        title: 'Creative Background',
        gradientType: 'radial',
        gradientColors: ['#ff6b6b', '#4ecdc4', '#45b7d1']
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'animation-container',
        title: 'Floating Element',
        animationType: 'bounce',
        animationDuration: '3s'
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'responsive-container',
        title: 'Adaptive Layout',
        maxWidth: '100%',
        currentBreakpoint: 'desktop'
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'css-editor',
        title: 'Creative Styles',
        cssCode: '/* Creative styling */\n.creative-element {\n  backdrop-filter: blur(10px);\n  background: rgba(255, 255, 255, 0.1);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n}'
      }
    ]
  };

  // Collaboration templates
  const collaborationTemplates = {
    teamCollaboration: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Team Collaboration Hub',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Work together with your team in real-time. See who\'s online, share feedback, and track changes.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'user-presence',
        title: 'Team Members Online',
        showAvatars: true,
        updateInterval: 30,
        onlineUsers: [
          { name: 'Alice Johnson', status: 'Editing' },
          { name: 'Bob Smith', status: 'Viewing' },
          { name: 'Carol Davis', status: 'Commenting' }
        ]
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'collaboration-indicator',
        title: 'Live Collaboration Status',
        showActivityFeed: true,
        activityHistoryLength: 15,
        activeUsers: 3,
        recentActivity: [
          { user: 'Alice', action: 'edited the header', timestamp: '2 min ago' },
          { user: 'Bob', action: 'added a comment', timestamp: '5 min ago' },
          { user: 'Carol', action: 'shared the page', timestamp: '10 min ago' }
        ]
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'comment-system',
        title: 'Team Discussion',
        allowAnonymous: false,
        requireModeration: true,
        maxComments: 100,
        comments: [
          { author: 'Alice Johnson', content: 'Great work on the layout!', timestamp: 'Just now' },
          { author: 'Bob Smith', content: 'Should we add more charts?', timestamp: '5 min ago' },
          { author: 'Carol Davis', content: 'I like the current design', timestamp: '10 min ago' }
        ]
      }
    ],
    projectReview: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Project Review & Feedback',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Review project progress and provide feedback with your team.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'version-history',
        title: 'Project Versions',
        autoSave: true,
        maxVersions: 20,
        currentVersion: 'v1.2',
        versions: [
          { id: 'v1.2', name: 'Version 1.2', author: 'Alice Johnson', timestamp: 'Just now', description: 'Added new features' },
          { id: 'v1.1', name: 'Version 1.1', author: 'Bob Smith', timestamp: '2 hours ago', description: 'Fixed bugs' },
          { id: 'v1.0', name: 'Version 1.0', author: 'Carol Davis', timestamp: '1 day ago', description: 'Initial release' }
        ]
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'comment-system',
        title: 'Review Comments',
        allowAnonymous: false,
        requireModeration: false,
        maxComments: 50,
        comments: [
          { author: 'Alice Johnson', content: 'The new features look great!', timestamp: 'Just now' },
          { author: 'Bob Smith', content: 'We should test this more thoroughly', timestamp: '1 hour ago' },
          { author: 'Carol Davis', content: 'Ready for production', timestamp: '2 hours ago' }
        ]
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'activity-feed',
        title: 'Project Activity',
        maxActivities: 25,
        refreshInterval: 60,
        activityTypes: ['edit', 'comment', 'share'],
        activities: [
          { user: 'Alice', action: 'updated the project', type: 'edit', timestamp: 'Just now' },
          { user: 'Bob', action: 'commented on version 1.2', type: 'comment', timestamp: '5 min ago' },
          { user: 'Carol', action: 'shared with stakeholders', type: 'share', timestamp: '15 min ago' }
        ]
      }
    ],
    liveWorkspace: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Live Collaborative Workspace',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Real-time collaboration with live cursors, presence indicators, and instant feedback.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'live-cursor',
        title: 'Live Cursor Tracking',
        updateFrequency: 100,
        showUserNames: true,
        showCursors: true,
        cursorPositions: [
          { user: 'Alice', x: 25, y: 30, timestamp: 'now' },
          { user: 'Bob', x: 60, y: 45, timestamp: 'now' },
          { user: 'Carol', x: 80, y: 20, timestamp: 'now' }
        ]
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'user-presence',
        title: 'Active Collaborators',
        showAvatars: true,
        updateInterval: 15,
        onlineUsers: [
          { name: 'Alice Johnson', status: 'Active' },
          { name: 'Bob Smith', status: 'Active' },
          { name: 'Carol Davis', status: 'Active' },
          { name: 'David Wilson', status: 'Away' }
        ]
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'collaboration-indicator',
        title: 'Workspace Status',
        showActivityFeed: true,
        activityHistoryLength: 20,
        activeUsers: 4,
        recentActivity: [
          { user: 'Alice', action: 'moved cursor to section 1', timestamp: 'now' },
          { user: 'Bob', action: 'started editing', timestamp: '30 sec ago' },
          { user: 'Carol', action: 'joined workspace', timestamp: '1 min ago' }
        ]
      }
    ],
    accessControl: [
      {
        id: Date.now().toString(),
        type: 'heading',
        content: 'Access Control & Permissions',
        size: 'xl',
        color: 'slate-800',
        alignment: 'left'
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Manage user access and collaboration permissions for your project.',
        size: 'base',
        color: 'slate-600',
        alignment: 'left'
      },
      {
        id: (Date.now() + 2).toString(),
        type: 'permission-manager',
        title: 'User Permissions',
        defaultRole: 'viewer' as UserRole,
        allowPublicAccess: false,
        requireApproval: true,
        permissions: [
          { user: 'Alice Johnson', email: 'alice@company.com', role: 'owner' },
          { user: 'Bob Smith', email: 'bob@company.com', role: 'editor' },
          { user: 'Carol Davis', email: 'carol@company.com', role: 'viewer' },
          { user: 'David Wilson', email: 'david@company.com', role: 'none' }
        ]
      },
      {
        id: (Date.now() + 3).toString(),
        type: 'activity-feed',
        title: 'Access Log',
        maxActivities: 30,
        refreshInterval: 120,
        activityTypes: ['login', 'edit', 'share'],
        activities: [
          { user: 'Alice', action: 'granted editor access to Bob', type: 'edit', timestamp: 'Just now' },
          { user: 'Bob', action: 'logged in', type: 'login', timestamp: '5 min ago' },
          { user: 'Carol', action: 'shared with external team', type: 'share', timestamp: '1 hour ago' }
        ]
      },
      {
        id: (Date.now() + 4).toString(),
        type: 'user-presence',
        title: 'Active Users',
        showAvatars: true,
        updateInterval: 60,
        onlineUsers: [
          { name: 'Alice Johnson', status: 'Managing' },
          { name: 'Bob Smith', status: 'Editing' },
          { name: 'Carol Davis', status: 'Viewing' }
        ]
      }
    ]
  };

  const addTemplate = (templateName: string) => {
    const template = componentTemplates[templateName as keyof typeof componentTemplates] || 
                    collaborationTemplates[templateName as keyof typeof collaborationTemplates];
    if (template) {
      const newComponents = [...pageComponents, ...template] as Component[];
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
        setWorkflows(projectWorkflows as any);
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

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setShowEditDialog(true);
  };

  const handleDelete = (page: Page) => {
    setDeletingPage(page);
    setShowDeleteDialog(true);
  };

  const handleViewPage = (page: Page) => {
    setViewingPage(page);
    setShowViewDialog(true);
    
    // Load page layout from backend
    if (page.layout && page.layout.components) {
      setPageComponents(page.layout.components);
      setHistory([page.layout.components]);
      setHistoryIndex(0);
    } else {
      // Initialize with empty components if no layout exists
      setPageComponents([]);
      setHistory([[]]);
      setHistoryIndex(0);
    }
  };

  // Save page layout to backend
  const savePageLayout = async () => {
    if (!viewingPage) return;
    
    try {
      await updatePage(viewingPage.id, { 
        layout: { components: pageComponents } 
      });
      toast({
        title: 'Page saved',
        description: 'Page layout has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'There was an error saving the page layout.',
        variant: 'destructive'
      });
    }
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

  const componentLibrary = [
    { type: 'heading', label: 'Heading', icon: 'H' },
    { type: 'text', label: 'Text', icon: 'T' },
    { type: 'button', label: 'Button', icon: 'B' },
    { type: 'input', label: 'Input', icon: 'I' },
    { type: 'select', label: 'Select', icon: 'S' },
    { type: 'checkbox', label: 'Checkbox', icon: 'C' },
    { type: 'table', label: 'Table', icon: 'T' },
    { type: 'form', label: 'Form Container', icon: 'F' },
    { type: 'bar-chart', label: 'Bar Chart', icon: '📊' },
    { type: 'line-chart', label: 'Line Chart', icon: '📈' },
    { type: 'pie-chart', label: 'Pie Chart', icon: '🥧' },
    { type: 'file-upload', label: 'File Upload', icon: '📁' },
    { type: 'image-gallery', label: 'Image Gallery', icon: '🖼️' },
    { type: 'document-viewer', label: 'Document Viewer', icon: '📄' },
    { type: 'video-player', label: 'Video Player', icon: '🎥' },
    { type: 'file-manager', label: 'File Manager', icon: '🗂️' },
    { type: 'css-editor', label: 'CSS Editor', icon: '🎨' },
    { type: 'theme-selector', label: 'Theme Selector', icon: '🎭' },
    { type: 'responsive-container', label: 'Responsive Container', icon: '📱' },
    { type: 'style-preset', label: 'Style Preset', icon: '✨' },
    { type: 'gradient-background', label: 'Gradient Background', icon: '🌈' },
    { type: 'animation-container', label: 'Animation Container', icon: '🎬' },
    { type: 'user-presence', label: 'User Presence', icon: '👥' },
    { type: 'comment-system', label: 'Comment System', icon: '💬' },
    { type: 'version-history', label: 'Version History', icon: '📝' },
    { type: 'collaboration-indicator', label: 'Collaboration Indicator', icon: '🤝' },
    { type: 'live-cursor', label: 'Live Cursor', icon: '🖱️' },
    { type: 'activity-feed', label: 'Activity Feed', icon: '📋' },
    { type: 'permission-manager', label: 'Permission Manager', icon: '🔐' },
  ];

  // Handle file uploads
  const handleFileUpload = async (componentId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setFileUploading(prev => ({ ...prev, [componentId]: true }));
    
    try {
      // Convert FileList to array
      const fileArray = Array.from(files);
      
      // In a real app, you would upload to your backend here
      // For now, we'll just store them locally
      setUploadedFiles(prev => ({ ...prev, [componentId]: fileArray }));
      
      toast({
        title: 'Files uploaded',
        description: `${fileArray.length} file(s) uploaded successfully.`,
      });
      
      // Update the component with uploaded files info
      const component = pageComponents.find(c => c.id === componentId);
      if (component) {
        const updatedComponent = {
          ...component,
          uploadedFiles: fileArray.map(file => ({
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            type: file.type
          }))
        };
        
        const newComponents = pageComponents.map(c => 
          c.id === componentId ? updatedComponent as Component : c
        );
        setPageComponents(newComponents);
        addToHistory(newComponents);
      }
      
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading the files.',
        variant: 'destructive',
      });
    } finally {
      setFileUploading(prev => ({ ...prev, [componentId]: false }));
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:p-6 p-2 overflow-y-auto bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">{viewingPage.title}</h2>
                  <div className="flex items-center gap-2">
                    {/* Collaboration Status */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${collaboration.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-slate-600">
                        {collaboration.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    
                    {/* Collaboration Toggle */}
                    <Button
                      size="sm"
                      variant={collaborationEnabled ? "default" : "outline"}
                      onClick={() => setCollaborationEnabled(!collaborationEnabled)}
                      className={collaborationEnabled ? "bg-green-600 text-white hover:bg-green-700" : ""}
                      disabled={!collaboration.isConnected}
                    >
                      {collaborationEnabled ? 'Collaboration On' : 'Collaboration Off'}
                    </Button>
                  </div>
                </div>
                
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
                        await savePageLayout();
                      } catch (error) {
                        toast({
                          title: 'Save failed',
                          description: 'There was an error saving the page layout.',
                          variant: 'destructive'
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
                <div className="mb-4 p-4 bg-white rounded-lg shadow border flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4 w-full flex-shrink-0">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('analytics')}
                        className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                      >
                        Analytics
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('mediaLibrary')}
                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      >
                        Media Library
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('contentManagement')}
                        className="bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                      >
                        Content Management
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('designSystem')}
                        className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      >
                        Design System
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('modernUI')}
                        className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                      >
                        Modern UI
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('creativeLayout')}
                        className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                      >
                        Creative Layout
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('teamCollaboration')}
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        Team Collaboration
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('projectReview')}
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        Project Review
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('liveWorkspace')}
                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      >
                        Live Workspace
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTemplate('accessControl')}
                        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      >
                        Access Control
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
                            } as Component;
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
                            } as Component;
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
                            } as Component;
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
                            } as Component;
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
                            } as Component;
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
                            } as Component;
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
                            } as Component;
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
                              formId: 'form-' + Date.now(),
                              submitWorkflowId: ''
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Form Container
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'bar-chart',
                            title: 'Bar Chart',
                            staticData: [
                              { name: 'Jan', value: 400 },
                              { name: 'Feb', value: 300 },
                              { name: 'Mar', value: 600 }
                            ],
                            xAxisKey: 'name',
                            dataKey: 'value'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        📊 Bar Chart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'line-chart',
                            title: 'Line Chart',
                            staticData: [
                              { name: 'Q1', value: 1200 },
                              { name: 'Q2', value: 1800 },
                              { name: 'Q3', value: 1600 }
                            ],
                            xAxisKey: 'name',
                            dataKey: 'value'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        📈 Line Chart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'pie-chart',
                            title: 'Pie Chart',
                            staticData: [
                              { name: 'Product A', value: 35 },
                              { name: 'Product B', value: 25 },
                              { name: 'Product C', value: 20 }
                            ],
                            xAxisKey: 'name',
                            dataKey: 'value'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🥧 Pie Chart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'file-upload',
                              title: 'File Upload',
                              description: 'Drag and drop files here or click to browse',
                              multiple: false,
                              acceptTypes: '*'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        📁 File Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'image-gallery',
                              title: 'Image Gallery',
                              images: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🖼️ Image Gallery
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'document-viewer',
                              title: 'Document Viewer',
                              documentUrl: '',
                              documentType: 'pdf',
                              documentName: ''
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        📄 Document Viewer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'video-player',
                              title: 'Video Player',
                              videoUrl: '',
                              videoType: 'video/mp4'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🎥 Video Player
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'file-manager',
                              title: 'File Manager',
                              files: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🗂️ File Manager
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'css-editor',
                              title: 'CSS Editor',
                              cssCode: '/* Add your custom styles here */'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🎨 CSS Editor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'theme-selector',
                              title: 'Theme Selector',
                              selectedTheme: 'default',
                              themes: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🎭 Theme Selector
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'responsive-container',
                              title: 'Responsive Container',
                              maxWidth: '100%',
                              currentBreakpoint: 'desktop'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        📱 Responsive Container
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'style-preset',
                              title: 'Style Preset',
                              selectedPreset: 'modern',
                              presets: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        ✨ Style Preset
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'gradient-background',
                              title: 'Gradient Background',
                              gradientType: 'linear',
                              gradientColors: ['#667eea', '#764ba2']
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🌈 Gradient Background
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'animation-container',
                              title: 'Animation Container',
                              animationType: 'none',
                              animationDuration: '1s'
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🎬 Animation Container
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'user-presence',
                              title: 'User Presence',
                              showAvatars: true,
                              updateInterval: 30,
                              onlineUsers: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        👥 User Presence
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'comment-system',
                              title: 'Comment System',
                              allowAnonymous: false,
                              requireModeration: false,
                              maxComments: 50,
                              comments: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        💬 Comment System
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'version-history',
                              title: 'Version History',
                              autoSave: true,
                              maxVersions: 20,
                              currentVersion: 'v1.0',
                              versions: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        📝 Version History
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'collaboration-indicator',
                              title: 'Collaboration Indicator',
                              showActivityFeed: true,
                              activityHistoryLength: 15,
                              activeUsers: 0,
                              recentActivity: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🤝 Collaboration Indicator
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'live-cursor',
                              title: 'Live Cursor',
                              updateFrequency: 100,
                              showUserNames: true,
                              showCursors: true,
                              cursorPositions: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🖱️ Live Cursor
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'activity-feed',
                              title: 'Activity Feed',
                              maxActivities: 25,
                              refreshInterval: 60,
                              activityTypes: [],
                              activities: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        📋 Activity Feed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newComponent = {
                            id: Date.now().toString(),
                            type: 'permission-manager',
                              title: 'Permission Manager',
                              defaultRole: 'viewer',
                              allowPublicAccess: false,
                              requireApproval: false,
                              permissions: []
                            } as Component;
                          const newComponents = [...pageComponents, newComponent];
                          setPageComponents(newComponents);
                          addToHistory(newComponents);
                          setSelectedComponent(newComponent);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        🔐 Permission Manager
                      </Button>
                    </div>
                  </div>
                  </div>
                  <div className="md:w-3/4 w-full flex-1">
                    {/* Page Builder Canvas */}
                    <div 
                      className={`border-2 border-dashed border-slate-300 rounded-lg p-6 min-h-[400px] bg-white shadow-inner relative transition-all duration-200 ${previewMode ? '' : 'hover:shadow-lg'}`}
                      onMouseMove={(e) => {
                        if (collaborationEnabled && collaboration.isConnected) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const y = e.clientY - rect.top;
                          collaboration.sendCursorMove(x, y);
                        }
                      }}
                    >
                      {/* Live Cursors Overlay */}
                      {collaborationEnabled && Object.keys(cursorPositions).length > 0 && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                          {Object.entries(cursorPositions).map(([userId, position]) => (
                            <div
                              key={userId}
                              className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                              style={{
                                left: position.x,
                                top: position.y,
                              }}
                            >
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {userId}
                              </div>
                            </div>
                          ))}
                </div>
              )}
              
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
                                    formData: String(formData[component.id] || ''),
                              formSubmitting: formSubmitting[component.formId || ''],
                              tableRowLoading: tableRowActions,
                              uploadedFiles: uploadedFiles[component.id] || [],
                              fileUploading: fileUploading[component.id] || false,
                              onFormFieldUpdate: updateFormField,
                              onFormSubmit: handleFormSubmit,
                              onTableRowClick: handleTableRowClick,
                              onFileUpload: handleFileUpload
                                  } as Component}
                            isSelected={selectedComponent?.id === component.id}
                            onSelect={setSelectedComponent}
                            onUpdate={(updatedComponent: any) => {
                              const newComponents = pageComponents.map(c => 
                                      c.id === component.id ? updatedComponent as Component : c
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
                    </div>
                  </div>
                </div>
              )}
              {previewMode && (
                <div className="space-y-4">
                  {/* ... existing code ... */}
                </div>
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
            {/* Properties Panel */}
            {!previewMode && (
              <div className="w-full md:w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto shadow-lg flex-shrink-0">
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                              const updatedComponent = { ...selectedComponent, size: value as any };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                              const updatedComponent = { ...selectedComponent, color: value as any };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                              const updatedComponent = { ...selectedComponent, size: value as any };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                              const updatedComponent = { ...selectedComponent, inputType: value as any };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                  c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                                c.id === selectedComponent.id ? updatedComponent as Component : c
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
                              Format: name,value|name2,value2 (JSON array format)
                            </div>
                            <textarea 
                              value={selectedComponent.rows?.map(row => row.join(',')).join('|') || ''} 
                              className="w-full border rounded px-3 py-2 text-xs font-mono h-24"
                              placeholder='[{"name": "Jan", "value": 100}, {"name": "Feb", "value": 200}]'
                              onChange={(e) => {
                                try {
                                  const data = JSON.parse(e.target.value);
                                  const updatedComponent = { ...selectedComponent, rows: data };
                                  setSelectedComponent(updatedComponent);
                                  const newComponents = pageComponents.map(c => 
                                    c.id === selectedComponent.id ? updatedComponent : c
                                  );
                                  setPageComponents(newComponents);
                                  addToHistory(newComponents);
                                } catch (error) {
                                  // Invalid JSON, don't update
                                }
                              }}
                            />
                            <div className="text-xs text-slate-500 mt-1">
                              Enter valid JSON array with objects containing name and value fields.
                            </div>
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
                    
                    {selectedComponent.type === 'file-upload' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'File Upload'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Description</Label>
                          <Input 
                            value={selectedComponent.description || 'Drag and drop files here or click to browse'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, description: e.target.value };
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
                          <Label className="text-sm font-medium">Multiple Files</Label>
                          <Select 
                            value={selectedComponent.multiple ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, multiple: value === 'true' };
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
                              <SelectItem value="true">Allow Multiple</SelectItem>
                              <SelectItem value="false">Single File</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Accepted File Types</Label>
                          <Input 
                            value={selectedComponent.acceptTypes || '*'} 
                            className="mt-1"
                            placeholder="e.g., .pdf,.doc,.jpg,.png"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, acceptTypes: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Comma-separated file extensions or MIME types
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'image-gallery' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Image Gallery'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Images (JSON)</Label>
                          <textarea 
                            value={JSON.stringify(selectedComponent.images || [], null, 2)} 
                            className="w-full border rounded px-3 py-2 text-xs font-mono h-32 mt-1"
                            placeholder='[{"url": "https://example.com/image1.jpg", "alt": "Image 1"}]'
                            onChange={(e) => {
                              try {
                                const images = JSON.parse(e.target.value);
                                const updatedComponent = { ...selectedComponent, images };
                                setSelectedComponent(updatedComponent);
                                const newComponents = pageComponents.map(c => 
                                  c.id === selectedComponent.id ? updatedComponent : c
                                );
                                setPageComponents(newComponents);
                                addToHistory(newComponents);
                              } catch (error) {
                                // Invalid JSON, don't update
                              }
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Array of objects with url and alt properties
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'document-viewer' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Document Viewer'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Document URL</Label>
                          <Input 
                            value={selectedComponent.documentUrl || ''} 
                            className="mt-1"
                            placeholder="https://example.com/document.pdf"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, documentUrl: e.target.value };
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
                          <Label className="text-sm font-medium">Document Type</Label>
                          <Select 
                            value={selectedComponent.documentType || 'pdf'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, documentType: value as any };
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
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Document Name</Label>
                          <Input 
                            value={selectedComponent.documentName || ''} 
                            className="mt-1"
                            placeholder="Document Name"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, documentName: e.target.value };
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
                    
                    {selectedComponent.type === 'video-player' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Video Player'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Video URL</Label>
                          <Input 
                            value={selectedComponent.videoUrl || ''} 
                            className="mt-1"
                            placeholder="https://example.com/video.mp4"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, videoUrl: e.target.value };
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
                          <Label className="text-sm font-medium">Video Type</Label>
                          <Select 
                            value={selectedComponent.videoType || 'video/mp4'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, videoType: value as any };
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
                              <SelectItem value="video/mp4">MP4</SelectItem>
                              <SelectItem value="video/webm">WebM</SelectItem>
                              <SelectItem value="video/ogg">OGG</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Poster URL (Optional)</Label>
                          <Input 
                            value={selectedComponent.posterUrl || ''} 
                            className="mt-1"
                            placeholder="https://example.com/poster.jpg"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, posterUrl: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Thumbnail image to show before video plays
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'file-manager' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'File Manager'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Files (JSON)</Label>
                          <textarea 
                            value={JSON.stringify(selectedComponent.files || [], null, 2)} 
                            className="w-full border rounded px-3 py-2 text-xs font-mono h-32 mt-1"
                            placeholder='[{"name": "document.pdf", "type": "document", "size": "1.2MB", "modified": "2024-01-15"}]'
                            onChange={(e) => {
                              try {
                                const files = JSON.parse(e.target.value);
                                const updatedComponent = { ...selectedComponent, files };
                                setSelectedComponent(updatedComponent);
                                const newComponents = pageComponents.map(c => 
                                  c.id === selectedComponent.id ? updatedComponent : c
                                );
                                setPageComponents(newComponents);
                                addToHistory(newComponents);
                              } catch (error) {
                                // Invalid JSON, don't update
                              }
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Array of file objects with name, type, size, and modified properties
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'css-editor' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'CSS Editor'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">CSS Code</Label>
                          <textarea 
                            value={selectedComponent.cssCode || ''} 
                            className="w-full border rounded px-3 py-2 text-xs font-mono h-32 mt-1"
                            placeholder="/* Enter your custom CSS here */"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, cssCode: e.target.value };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            CSS will be applied to this component and its children
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'theme-selector' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Theme Selector'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Selected Theme</Label>
                          <Select 
                            value={selectedComponent.selectedTheme || 'default'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, selectedTheme: value };
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
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'responsive-container' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Responsive Container'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Max Width</Label>
                          <Input 
                            value={selectedComponent.maxWidth || '100%'} 
                            className="mt-1"
                            placeholder="e.g., 1200px, 100%"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, maxWidth: e.target.value };
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
                          <Label className="text-sm font-medium">Current Breakpoint</Label>
                          <Select 
                            value={selectedComponent.currentBreakpoint || 'desktop'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, currentBreakpoint: value as any };
                              setSelectedComponent(updatedComponent as Component);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent as Component : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mobile">Mobile</SelectItem>
                              <SelectItem value="tablet">Tablet</SelectItem>
                              <SelectItem value="desktop">Desktop</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'gradient-background' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Gradient Background'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Gradient Type</Label>
                          <Select 
                            value={selectedComponent.gradientType || 'linear'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, gradientType: value as any };
                              setSelectedComponent(updatedComponent as Component);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent as Component : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="linear">Linear</SelectItem>
                              <SelectItem value="radial">Radial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Gradient Colors</Label>
                          <Input 
                            value={selectedComponent.gradientColors?.join(', ') || '#667eea, #764ba2'} 
                            className="mt-1"
                            placeholder="e.g., #667eea, #764ba2"
                            onChange={(e) => {
                              const colors = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                              const updatedComponent = { ...selectedComponent, gradientColors: colors };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Comma-separated color values (hex, rgb, or named colors)
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'animation-container' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Animation Container'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Animation Type</Label>
                          <Select 
                            value={selectedComponent.animationType || 'none'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, animationType: value as any };
                              setSelectedComponent(updatedComponent as Component);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent as Component : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="pulse">Pulse</SelectItem>
                              <SelectItem value="bounce">Bounce</SelectItem>
                              <SelectItem value="spin">Spin</SelectItem>
                              <SelectItem value="fade">Fade</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Animation Duration</Label>
                          <Input 
                            value={selectedComponent.animationDuration || '1s'} 
                            className="mt-1"
                            placeholder="e.g., 1s, 2s, 500ms"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, animationDuration: e.target.value };
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
                    
                    {selectedComponent.type === 'user-presence' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'User Presence'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Show User Avatars</Label>
                          <Select 
                            value={selectedComponent.showAvatars ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, showAvatars: value === 'true' };
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
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Update Interval (seconds)</Label>
                          <Input 
                            type="number"
                            value={selectedComponent.updateInterval || 30} 
                            className="mt-1"
                            min="5"
                            max="300"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, updateInterval: parseInt(e.target.value) };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            How often to refresh user presence data
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'comment-system' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Comment System'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Allow Anonymous Comments</Label>
                          <Select 
                            value={selectedComponent.allowAnonymous ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, allowAnonymous: value === 'true' };
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
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Moderation Required</Label>
                          <Select 
                            value={selectedComponent.requireModeration ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, requireModeration: value === 'true' };
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
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Max Comments Displayed</Label>
                          <Input 
                            type="number"
                            value={selectedComponent.maxComments || 50} 
                            className="mt-1"
                            min="5"
                            max="200"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, maxComments: parseInt(e.target.value) };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Maximum number of comments to display
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'version-history' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Version History'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Auto Save</Label>
                          <Select 
                            value={selectedComponent.autoSave ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, autoSave: value === 'true' };
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
                              <SelectItem value="true">Enabled</SelectItem>
                              <SelectItem value="false">Disabled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Max Versions</Label>
                          <Input 
                            type="number"
                            value={selectedComponent.maxVersions || 20} 
                            className="mt-1"
                            min="5"
                            max="100"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, maxVersions: parseInt(e.target.value) };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Maximum number of versions to keep
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'collaboration-indicator' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Collaboration Indicator'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Show Activity Feed</Label>
                          <Select 
                            value={selectedComponent.showActivityFeed ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, showActivityFeed: value === 'true' };
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
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Activity History Length</Label>
                          <Input 
                            type="number"
                            value={selectedComponent.activityHistoryLength || 15} 
                            className="mt-1"
                            min="5"
                            max="50"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, activityHistoryLength: parseInt(e.target.value) };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Number of recent activities to display
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'live-cursor' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Live Cursor'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Update Frequency (ms)</Label>
                          <Input 
                            type="number"
                            value={selectedComponent.updateFrequency || 100} 
                            className="mt-1"
                            min="50"
                            max="1000"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, updateFrequency: parseInt(e.target.value) };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            How often to update cursor positions
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Show User Names</Label>
                          <Select 
                            value={selectedComponent.showUserNames ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, showUserNames: value === 'true' };
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
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'activity-feed' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Activity Feed'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Max Activities</Label>
                          <Input 
                            type="number"
                            value={selectedComponent.maxActivities || 25} 
                            className="mt-1"
                            min="5"
                            max="100"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, maxActivities: parseInt(e.target.value) };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            Maximum number of activities to display
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Refresh Interval (seconds)</Label>
                          <Input 
                            type="number"
                            value={selectedComponent.refreshInterval || 60} 
                            className="mt-1"
                            min="10"
                            max="300"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, refreshInterval: parseInt(e.target.value) };
                              setSelectedComponent(updatedComponent);
                              const newComponents = pageComponents.map(c => 
                                c.id === selectedComponent.id ? updatedComponent : c
                              );
                              setPageComponents(newComponents);
                              addToHistory(newComponents);
                            }}
                          />
                          <div className="text-xs text-slate-500 mt-1">
                            How often to refresh the activity feed
                          </div>
                        </div>
                      </>
                    )}
                    
                    {selectedComponent.type === 'permission-manager' && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input 
                            value={selectedComponent.title || 'Permission Manager'} 
                            className="mt-1"
                            onChange={(e) => {
                              const updatedComponent = { ...selectedComponent, title: e.target.value };
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
                          <Label className="text-sm font-medium">Default Role</Label>
                          <Select 
                            value={selectedComponent.defaultRole || 'viewer' as UserRole}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, defaultRole: value as UserRole };
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
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="none">No Access</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Allow Public Access</Label>
                          <Select 
                            value={selectedComponent.allowPublicAccess ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, allowPublicAccess: value === 'true' };
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
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Require Approval</Label>
                          <Select 
                            value={selectedComponent.requireApproval ? 'true' : 'false'}
                            onValueChange={(value) => {
                              const updatedComponent = { ...selectedComponent, requireApproval: value === 'true' };
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
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    {/* Component Actions */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const duplicatedComponent = {
                              ...selectedComponent,
                              id: Date.now().toString()
                            };
                            const newComponents = [...pageComponents, duplicatedComponent];
                            setPageComponents(newComponents);
                            addToHistory(newComponents);
                            setSelectedComponent(duplicatedComponent);
                            toast({
                              title: 'Component duplicated',
                              description: 'The component has been duplicated successfully.',
                            });
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newComponents = pageComponents.filter(c => c.id !== selectedComponent.id);
                            setPageComponents(newComponents);
                            setSelectedComponent(null);
                            addToHistory(newComponents);
                            toast({
                              title: 'Component deleted',
                              description: 'The component has been removed from the page.',
                            });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Palette className="w-8 h-8 mx-auto mb-2" />
                    <p>Select a component to edit its properties</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {(viewingPage || editingPage) && (
        <div className="mb-6">
          <VersionHistory pageId={(viewingPage || editingPage)?.id} />
        </div>
      )}
    </div>
  );
};
