/**
 * Session Continuity System - Type Definitions
 * 
 * Core types for managing persistent sessions across agent restarts
 */

export interface SessionContext {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  agentVersion: string;
  workspace: string;
}

export interface WorkItem {
  id: string;
  type: WorkType;
  status: WorkStatus;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  priority: Priority;
  tags: string[];
  relatedFiles: string[];
  dependencies: string[];
  projectPath: string;
}

export enum WorkType {
  FEATURE = 'feature',
  BUGFIX = 'bugfix',
  REFACTOR = 'refactor',
  RESEARCH = 'research',
  DOCUMENTATION = 'documentation',
  DESIGN = 'design',
  DEPLOYMENT = 'deployment',
  ANALYSIS = 'analysis',
  INTEGRATION = 'integration',
  UNKNOWN = 'unknown'
}

export enum WorkStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  TRIVIAL = 'trivial'
}

export interface FileChange {
  path: string;
  changeType: ChangeType;
  beforeHash?: string;
  afterHash?: string;
  lineCount: number;
  timestamp: string;
  description?: string;
}

export enum ChangeType {
  CREATED = 'created',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed',
  MOVED = 'moved'
}

export interface ConversationMessage {
  id: string;
  timestamp: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  attachments?: string[];
  intent?: string;
  extractedTasks?: string[];
}

export interface ProjectState {
  projectId: string;
  name: string;
  path: string;
  type: string;
  branch?: string;
  lastCommit?: string;
  uncommittedChanges: FileChange[];
  dependencies: DependencyInfo;
  environment: EnvironmentInfo;
  workItems: WorkItem[];
  activeWorkItemId?: string;
}

export interface DependencyInfo {
  runtime: string[];
  build: string[];
  dev: string[];
  outdated: string[];
  vulnerabilities: string[];
}

export interface EnvironmentInfo {
  nodeVersion?: string;
  pythonVersion?: string;
  os: string;
  shell: string;
  envVars: Record<string, string>;
}

export interface SessionSnapshot {
  snapshotId: string;
  timestamp: string;
  context: SessionContext;
  projects: ProjectState[];
  conversation: ConversationMessage[];
  decisions: Decision[];
  learnings: Learning[];
  nextSteps: NextStep[];
  metadata: SessionMetadata;
}

export interface Decision {
  id: string;
  timestamp: string;
  context: string;
  options: string[];
  selected: string;
  rationale: string;
  impact: string[];
  reversible: boolean;
}

export interface Learning {
  id: string;
  timestamp: string;
  category: LearningCategory;
  title: string;
  description: string;
  source: string;
  appliedTo: string[];
  confidence: 'high' | 'medium' | 'low';
}

export enum LearningCategory {
  TECHNICAL = 'technical',
  ARCHITECTURAL = 'architectural',
  DOMAIN = 'domain',
  PROCESS = 'process',
  TOOL = 'tool',
  ERROR = 'error'
}

export interface NextStep {
  id: string;
  description: string;
  priority: Priority;
  estimatedTime?: string;
  blockedBy?: string[];
  relatedWorkItemId?: string;
}

export interface SessionMetadata {
  totalFilesModified: number;
  totalFilesCreated: number;
  totalLinesChanged: number;
  commandsExecuted: string[];
  toolsUsed: string[];
  errors: ErrorRecord[];
  warnings: string[];
}

export interface ErrorRecord {
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  context: string;
  resolved: boolean;
  resolution?: string;
}

export interface RouteConfig {
  pattern: RegExp | string;
  target: string;
  action: RouteAction;
  priority: number;
}

export enum RouteAction {
  CREATE_PROJECT = 'create_project',
  UPDATE_PROJECT = 'update_project',
  ARCHIVE_SESSION = 'archive_session',
  RESTORE_SESSION = 'restore_session',
  GENERATE_REPORT = 'generate_report',
  SYNC_STATE = 'sync_state'
}

export interface StateDiff {
  before: SessionSnapshot;
  after: SessionSnapshot;
  changes: {
    files: FileChange[];
    workItems: {
      added: WorkItem[];
      modified: WorkItem[];
      removed: WorkItem[];
    };
    conversation: ConversationMessage[];
  };
}
