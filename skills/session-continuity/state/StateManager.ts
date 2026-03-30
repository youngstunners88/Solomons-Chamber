/**
 * State Management System
 * 
 * Manages session state with automatic persistence, versioning,
 * and efficient state snapshots.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import {
  SessionSnapshot,
  SessionContext,
  ProjectState,
  WorkItem,
  FileChange,
  StateDiff,
  ConversationMessage,
  NextStep,
  Learning,
  Decision
} from '../types/session.types';

export interface StateManagerConfig {
  basePath: string;
  autoSaveInterval: number; // milliseconds
  maxSnapshots: number;
  compressionEnabled: boolean;
}

export class StateManager {
  private config: StateManagerConfig;
  private currentSnapshot: SessionSnapshot | null = null;
  private saveTimer: NodeJS.Timeout | null = null;
  private changeBuffer: FileChange[] = [];
  private isDirty: boolean = false;

  constructor(config: Partial<StateManagerConfig> = {}) {
    this.config = {
      basePath: config.basePath || '/home/teacherchris37/Solomons-Chamber/.state',
      autoSaveInterval: config.autoSaveInterval || 30000, // 30 seconds
      maxSnapshots: config.maxSnapshots || 50,
      compressionEnabled: config.compressionEnabled ?? true
    };
    this.init();
  }

  private async init(): Promise<void> {
    await this.ensureDirectory();
    await this.startAutoSave();
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.basePath, { recursive: true });
      await fs.mkdir(path.join(this.config.basePath, 'snapshots'), { recursive: true });
      await fs.mkdir(path.join(this.config.basePath, 'current'), { recursive: true });
      await fs.mkdir(path.join(this.config.basePath, 'archive'), { recursive: true });
    } catch (error) {
      console.error('Failed to create state directories:', error);
    }
  }

  private startAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    this.saveTimer = setInterval(() => {
      if (this.isDirty) {
        this.persistState();
      }
    }, this.config.autoSaveInterval);
  }

  public async createSession(workspace: string): Promise<SessionSnapshot> {
    const sessionId = this.generateSessionId();
    const timestamp = new Date().toISOString();

    this.currentSnapshot = {
      snapshotId: sessionId,
      timestamp,
      context: {
        sessionId,
        startTime: timestamp,
        lastActivity: timestamp,
        agentVersion: process.env.KIMI_VERSION || 'unknown',
        workspace
      },
      projects: [],
      conversation: [],
      decisions: [],
      learnings: [],
      nextSteps: [],
      metadata: {
        totalFilesModified: 0,
        totalFilesCreated: 0,
        totalLinesChanged: 0,
        commandsExecuted: [],
        toolsUsed: [],
        errors: [],
        warnings: []
      }
    };

    this.isDirty = true;
    await this.persistState();
    return this.currentSnapshot;
  }

  public async restoreLastSession(workspace: string): Promise<SessionSnapshot | null> {
    try {
      // Try to restore from current first
      const currentPath = path.join(this.config.basePath, 'current', 'session.json');
      const data = await fs.readFile(currentPath, 'utf-8');
      const snapshot: SessionSnapshot = JSON.parse(data);

      // Validate workspace match
      if (snapshot.context.workspace === workspace) {
        this.currentSnapshot = snapshot;
        this.updateLastActivity();
        return snapshot;
      }

      // If no match, try to find most recent archived session for this workspace
      return await this.findMostRecentSession(workspace);
    } catch (error) {
      console.log('No previous session found, creating new one...');
      return null;
    }
  }

  private async findMostRecentSession(workspace: string): Promise<SessionSnapshot | null> {
    try {
      const archivePath = path.join(this.config.basePath, 'archive');
      const files = await fs.readdir(archivePath);
      
      const sessions = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async f => {
            const data = await fs.readFile(path.join(archivePath, f), 'utf-8');
            return JSON.parse(data) as SessionSnapshot;
          })
      );

      const matching = sessions
        .filter(s => s.context.workspace === workspace)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return matching[0] || null;
    } catch (error) {
      return null;
    }
  }

  public addWorkItem(item: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt'>): WorkItem {
    if (!this.currentSnapshot) {
      throw new Error('No active session');
    }

    const workItem: WorkItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.currentSnapshot.projects.forEach(project => {
      project.workItems.push(workItem);
    });

    this.isDirty = true;
    return workItem;
  }

  public updateWorkItem(id: string, updates: Partial<WorkItem>): void {
    if (!this.currentSnapshot) return;

    this.currentSnapshot.projects.forEach(project => {
      const item = project.workItems.find(w => w.id === id);
      if (item) {
        Object.assign(item, updates, { updatedAt: new Date().toISOString() });
        if (updates.status === 'completed') {
          item.completedAt = new Date().toISOString();
        }
      }
    });

    this.isDirty = true;
  }

  public trackFileChange(change: FileChange): void {
    this.changeBuffer.push(change);
    this.isDirty = true;

    // Update metadata
    if (this.currentSnapshot) {
      if (change.changeType === 'created') {
        this.currentSnapshot.metadata.totalFilesCreated++;
      } else if (change.changeType === 'modified') {
        this.currentSnapshot.metadata.totalFilesModified++;
      }
      this.currentSnapshot.metadata.totalLinesChanged += change.lineCount;
    }
  }

  public addConversationMessage(message: Omit<ConversationMessage, 'id' | 'timestamp'>): void {
    if (!this.currentSnapshot) return;

    const msg: ConversationMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    this.currentSnapshot.conversation.push(msg);
    this.isDirty = true;
    this.updateLastActivity();
  }

  public addDecision(decision: Omit<Decision, 'id' | 'timestamp'>): void {
    if (!this.currentSnapshot) return;

    const dec: Decision = {
      ...decision,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    this.currentSnapshot.decisions.push(dec);
    this.isDirty = true;
  }

  public addLearning(learning: Omit<Learning, 'id' | 'timestamp'>): void {
    if (!this.currentSnapshot) return;

    const learn: Learning = {
      ...learning,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    this.currentSnapshot.learnings.push(learn);
    this.isDirty = true;
  }

  public addNextStep(step: Omit<NextStep, 'id'>): void {
    if (!this.currentSnapshot) return;

    const nextStep: NextStep = {
      ...step,
      id: this.generateId()
    };

    this.currentSnapshot.nextSteps.push(nextStep);
    this.isDirty = true;
  }

  public addProject(project: Omit<ProjectState, 'uncommittedChanges' | 'workItems'>): void {
    if (!this.currentSnapshot) return;

    const proj: ProjectState = {
      ...project,
      uncommittedChanges: [],
      workItems: []
    };

    this.currentSnapshot.projects.push(proj);
    this.isDirty = true;
  }

  public updateProject(projectId: string, updates: Partial<ProjectState>): void {
    if (!this.currentSnapshot) return;

    const project = this.currentSnapshot.projects.find(p => p.projectId === projectId);
    if (project) {
      Object.assign(project, updates);
      this.isDirty = true;
    }
  }

  public async persistState(): Promise<void> {
    if (!this.currentSnapshot || !this.isDirty) return;

    try {
      // Flush change buffer
      this.currentSnapshot.projects.forEach(project => {
        project.uncommittedChanges.push(...this.changeBuffer);
      });
      this.changeBuffer = [];

      // Save current session
      const currentPath = path.join(this.config.basePath, 'current', 'session.json');
      await fs.writeFile(currentPath, JSON.stringify(this.currentSnapshot, null, 2));

      // Create snapshot
      const snapshotPath = path.join(
        this.config.basePath,
        'snapshots',
        `${this.currentSnapshot.snapshotId}-${Date.now()}.json`
      );
      await fs.writeFile(snapshotPath, JSON.stringify(this.currentSnapshot, null, 2));

      this.isDirty = false;
      await this.cleanupOldSnapshots();
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  private async cleanupOldSnapshots(): Promise<void> {
    try {
      const snapshotsPath = path.join(this.config.basePath, 'snapshots');
      const files = await fs.readdir(snapshotsPath);
      
      if (files.length <= this.config.maxSnapshots) return;

      const fileStats = await Promise.all(
        files.map(async f => {
          const stat = await fs.stat(path.join(snapshotsPath, f));
          return { name: f, mtime: stat.mtime };
        })
      );

      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      
      const toDelete = fileStats.slice(0, files.length - this.config.maxSnapshots);
      await Promise.all(
        toDelete.map(f => fs.unlink(path.join(snapshotsPath, f.name)))
      );
    } catch (error) {
      console.error('Failed to cleanup old snapshots:', error);
    }
  }

  public async archiveSession(): Promise<void> {
    if (!this.currentSnapshot) return;

    try {
      const archivePath = path.join(
        this.config.basePath,
        'archive',
        `${this.currentSnapshot.snapshotId}.json`
      );
      await fs.writeFile(archivePath, JSON.stringify(this.currentSnapshot, null, 2));

      // Clear current
      const currentPath = path.join(this.config.basePath, 'current', 'session.json');
      await fs.unlink(currentPath).catch(() => {});

      this.currentSnapshot = null;
      this.isDirty = false;
    } catch (error) {
      console.error('Failed to archive session:', error);
    }
  }

  public getCurrentState(): SessionSnapshot | null {
    return this.currentSnapshot;
  }

  public getActiveWorkItem(): WorkItem | null {
    if (!this.currentSnapshot) return null;

    for (const project of this.currentSnapshot.projects) {
      if (project.activeWorkItemId) {
        return project.workItems.find(w => w.id === project.activeWorkItemId) || null;
      }
    }
    return null;
  }

  public setActiveWorkItem(workItemId: string): void {
    if (!this.currentSnapshot) return;

    this.currentSnapshot.projects.forEach(project => {
      const exists = project.workItems.some(w => w.id === workItemId);
      if (exists) {
        project.activeWorkItemId = workItemId;
      }
    });

    this.isDirty = true;
  }

  public getPendingNextSteps(): NextStep[] {
    if (!this.currentSnapshot) return [];
    return this.currentSnapshot.nextSteps.filter(
      step => !step.blockedBy?.length
    );
  }

  public getContextSummary(): string {
    if (!this.currentSnapshot) return 'No active session';

    const { context, projects, nextSteps, learnings } = this.currentSnapshot;
    const activeWork = this.getActiveWorkItem();

    return `
## Session Context
- **Session ID:** ${context.sessionId}
- **Started:** ${context.startTime}
- **Workspace:** ${context.workspace}
- **Projects:** ${projects.map(p => p.name).join(', ')}
${activeWork ? `- **Active Work:** ${activeWork.title} (${activeWork.status})` : ''}
- **Pending Steps:** ${nextSteps.length}
- **Learnings:** ${learnings.length}
    `.trim();
  }

  private updateLastActivity(): void {
    if (this.currentSnapshot) {
      this.currentSnapshot.context.lastActivity = new Date().toISOString();
      this.isDirty = true;
    }
  }

  private generateSessionId(): string {
    return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    this.persistState();
  }
}
