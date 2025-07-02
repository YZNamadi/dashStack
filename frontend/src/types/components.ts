// Base component interface
export interface BaseComponent {
  id: string;
  type: ComponentType;
  title?: string;
  [key: string]: any; // For dynamic properties
}

// Component type union
export type ComponentType = 
  | 'heading'
  | 'text'
  | 'button'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'table'
  | 'form'
  | 'bar-chart'
  | 'line-chart'
  | 'pie-chart'
  | 'file-upload'
  | 'image-gallery'
  | 'document-viewer'
  | 'video-player'
  | 'file-manager'
  | 'css-editor'
  | 'theme-selector'
  | 'responsive-container'
  | 'style-preset'
  | 'gradient-background'
  | 'animation-container'
  | 'user-presence'
  | 'comment-system'
  | 'version-history'
  | 'collaboration-indicator'
  | 'live-cursor'
  | 'activity-feed'
  | 'permission-manager';

// Text size options
export type TextSize = 'sm' | 'base' | 'lg' | 'xl';

// Text color options
export type TextColor = 'slate-800' | 'slate-700' | 'slate-600' | 'blue-600' | 'green-600' | 'red-600';

// Button variant options
export type ButtonVariant = 'primary' | 'outline' | 'secondary';

// Button size options
export type ButtonSize = 'sm' | 'md' | 'lg';

// Input type options
export type InputType = 'text' | 'email' | 'password' | 'number';

// Document type options
export type DocumentType = 'pdf' | 'image' | 'document';

// Video type options
export type VideoType = 'video/mp4' | 'video/webm' | 'video/ogg';

// Gradient type options
export type GradientType = 'linear' | 'radial';

// Animation type options
export type AnimationType = 'none' | 'pulse' | 'bounce' | 'spin' | 'fade';

// User role options
export type UserRole = 'owner' | 'editor' | 'viewer' | 'none';

// Activity type options
export type ActivityType = 'edit' | 'comment' | 'share' | 'login';

// Specific component interfaces
export interface HeadingComponent extends BaseComponent {
  type: 'heading';
  content: string;
  size: TextSize;
  color: TextColor;
  alignment?: 'left' | 'center' | 'right';
  datasourceId?: string;
  dataField?: string;
}

export interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
  size: TextSize;
  color: TextColor;
  alignment?: 'left' | 'center' | 'right';
  datasourceId?: string;
  dataField?: string;
}

export interface ButtonComponent extends BaseComponent {
  type: 'button';
  content: string;
  variant: ButtonVariant;
  size: ButtonSize;
  workflowId?: string;
}

export interface InputComponent extends BaseComponent {
  type: 'input';
  placeholder: string;
  inputType: InputType;
  formId?: string;
  fieldName?: string;
  formData?: string;
}

export interface SelectComponent extends BaseComponent {
  type: 'select';
  placeholder: string;
  options: string[];
  formId?: string;
  fieldName?: string;
  formData?: string;
}

export interface CheckboxComponent extends BaseComponent {
  type: 'checkbox';
  label: string;
  checked: boolean;
  formId?: string;
  fieldName?: string;
  formData?: boolean;
}

export interface TableComponent extends BaseComponent {
  type: 'table';
  headers: string[];
  rows?: string[][];
  datasourceId?: string;
  rowActionWorkflowId?: string;
}

export interface FormComponent extends BaseComponent {
  type: 'form';
  formId: string;
  submitWorkflowId?: string;
  formSubmitting?: boolean;
}

export interface ChartComponent extends BaseComponent {
  type: 'bar-chart' | 'line-chart' | 'pie-chart';
  title: string;
  staticData?: any[];
  datasourceId?: string;
  xAxisKey: string;
  dataKey: string;
}

export interface FileUploadComponent extends BaseComponent {
  type: 'file-upload';
  title: string;
  description: string;
  multiple: boolean;
  acceptTypes: string;
  uploadedFiles?: File[];
}

export interface ImageGalleryComponent extends BaseComponent {
  type: 'image-gallery';
  title: string;
  images: Array<{
    url: string;
    alt: string;
  }>;
}

export interface DocumentViewerComponent extends BaseComponent {
  type: 'document-viewer';
  title: string;
  documentUrl: string;
  documentType: DocumentType;
  documentName: string;
}

export interface VideoPlayerComponent extends BaseComponent {
  type: 'video-player';
  title: string;
  videoUrl: string;
  videoType: VideoType;
  posterUrl?: string;
}

export interface FileManagerComponent extends BaseComponent {
  type: 'file-manager';
  title: string;
  files: Array<{
    name: string;
    type: 'image' | 'document' | 'video' | 'other';
    size: string;
    modified: string;
  }>;
}

export interface CSSEditorComponent extends BaseComponent {
  type: 'css-editor';
  title: string;
  cssCode: string;
}

export interface ThemeSelectorComponent extends BaseComponent {
  type: 'theme-selector';
  title: string;
  selectedTheme: string;
  themes: Array<{
    name: string;
    primaryColor: string;
    description: string;
  }>;
}

export interface ResponsiveContainerComponent extends BaseComponent {
  type: 'responsive-container';
  title: string;
  maxWidth: string;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
}

export interface StylePresetComponent extends BaseComponent {
  type: 'style-preset';
  title: string;
  selectedPreset: string;
  presets: Array<{
    name: string;
    description: string;
  }>;
}

export interface GradientBackgroundComponent extends BaseComponent {
  type: 'gradient-background';
  title: string;
  gradientType: GradientType;
  gradientDirection?: string;
  gradientColors: string[];
}

export interface AnimationContainerComponent extends BaseComponent {
  type: 'animation-container';
  title: string;
  animationType: AnimationType;
  animationDuration: string;
  animationTiming?: string;
}

export interface UserPresenceComponent extends BaseComponent {
  type: 'user-presence';
  title: string;
  showAvatars: boolean;
  updateInterval: number;
  onlineUsers: Array<{
    name: string;
    status: string;
  }>;
}

export interface CommentSystemComponent extends BaseComponent {
  type: 'comment-system';
  title: string;
  allowAnonymous: boolean;
  requireModeration: boolean;
  maxComments: number;
  comments: Array<{
    author: string;
    content: string;
    timestamp: string;
  }>;
  newComment?: string;
}

export interface VersionHistoryComponent extends BaseComponent {
  type: 'version-history';
  title: string;
  autoSave: boolean;
  maxVersions: number;
  currentVersion: string;
  versions: Array<{
    id: string;
    name: string;
    author: string;
    timestamp: string;
    description?: string;
  }>;
}

export interface CollaborationIndicatorComponent extends BaseComponent {
  type: 'collaboration-indicator';
  title: string;
  showActivityFeed: boolean;
  activityHistoryLength: number;
  activeUsers: number;
  recentActivity: Array<{
    user: string;
    action: string;
    timestamp: string;
  }>;
}

export interface LiveCursorComponent extends BaseComponent {
  type: 'live-cursor';
  title: string;
  updateFrequency: number;
  showUserNames: boolean;
  showCursors: boolean;
  cursorPositions: Array<{
    user: string;
    x: number;
    y: number;
    timestamp: string;
  }>;
}

export interface ActivityFeedComponent extends BaseComponent {
  type: 'activity-feed';
  title: string;
  maxActivities: number;
  refreshInterval: number;
  activityTypes: ActivityType[];
  activities: Array<{
    user: string;
    action: string;
    type: ActivityType;
    timestamp: string;
  }>;
}

export interface PermissionManagerComponent extends BaseComponent {
  type: 'permission-manager';
  title: string;
  defaultRole: UserRole;
  allowPublicAccess: boolean;
  requireApproval: boolean;
  permissions: Array<{
    user: string;
    email: string;
    role: UserRole;
  }>;
}

// Union type for all components
export type Component = 
  | HeadingComponent
  | TextComponent
  | ButtonComponent
  | InputComponent
  | SelectComponent
  | CheckboxComponent
  | TableComponent
  | FormComponent
  | ChartComponent
  | FileUploadComponent
  | ImageGalleryComponent
  | DocumentViewerComponent
  | VideoPlayerComponent
  | FileManagerComponent
  | CSSEditorComponent
  | ThemeSelectorComponent
  | ResponsiveContainerComponent
  | StylePresetComponent
  | GradientBackgroundComponent
  | AnimationContainerComponent
  | UserPresenceComponent
  | CommentSystemComponent
  | VersionHistoryComponent
  | CollaborationIndicatorComponent
  | LiveCursorComponent
  | ActivityFeedComponent
  | PermissionManagerComponent;

// History entry interface
export interface HistoryEntry {
  components: Component[];
  timestamp: number;
  author: string;
  description?: string;
}

// Form data interface
export interface FormData {
  [componentId: string]: string | boolean;
}

// Component data interface
export interface ComponentData {
  data: any[];
  loading: boolean;
  error?: string;
}

// File upload interface
export interface UploadedFile {
  name: string;
  size: string;
  type: string;
  url?: string;
}

// Template interface
export interface ComponentTemplate {
  name: string;
  description: string;
  category: 'form' | 'dashboard' | 'media' | 'collaboration' | 'styling';
  components: Component[];
}

// Page interface
export interface Page {
  id: string;
  title: string;
  layout?: {
    components: Component[];
  };
  createdAt: string;
  updatedAt: string;
}

// Project interface
export interface Project {
  id: string;
  name: string;
  description?: string;
}

// Datasource interface
export interface Datasource {
  id: string;
  name: string;
  type: string;
  config: any;
}

// Workflow interface
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: any[];
}

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Activity interface
export interface Activity {
  id: string;
  user: string;
  action: string;
  type: ActivityType;
  timestamp: string;
  metadata?: any;
}

// Comment interface
export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

// Version interface
export interface Version {
  id: string;
  name: string;
  author: string;
  timestamp: string;
  description?: string;
  changes?: string[];
}

// Cursor position interface
export interface CursorPosition {
  user: string;
  x: number;
  y: number;
  timestamp: string;
  elementId?: string;
}

// Permission interface
export interface Permission {
  user: string;
  email: string;
  role: UserRole;
  grantedAt: string;
  grantedBy: string;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error interface
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Loading state interface
export interface LoadingState {
  [key: string]: boolean;
}

// Toast notification interface
export interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
} 