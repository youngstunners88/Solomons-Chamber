/**
 * Session Continuity System - Main Entry Point
 * 
 * Provides seamless session persistence and restoration.
 * Automatically saves all work and restores full context on new sessions.
 */

import * as path from 'path';
import { StateManager } from '../state/StateManager';
import { WorkRouter, RouteResult } from '../router/WorkRouter';
import { SessionCapture } from '../capture/SessionCapture';
import { SessionRestorer, RestorationContext } from '../restore/SessionRestorer';
import {
  SessionSnapshot,
  WorkItem,
  WorkStatus,
  WorkType,
  LearningCategory
} from '../types/session.types';

export interface ContinuityConfig {
  basePath: string;
  workspace: string;
  autoSaveInterval: number;
  captureChanges: boolean;
  restoreOnInit: boolean;
}

export interface WorkRequest {
  userInput: string;
  currentDirectory: string;
  recentFiles: string[];
  gitBranch?: string;
  fileExtensions: string[];
}

export class SessionContinuity {
  private config: ContinuityConfig;
  private stateManager: StateManager;
  private router: WorkRouter;
  private capture: SessionCapture;
  private restorer: SessionRestorer;
  private initialized: boolean = false;

  constructor(config: Partial<ContinuityConfig> = {}) {
    this.config = {
      basePath: config.basePath || '/home/teacherchris37/Solomons-Chamber',
      workspace: config.workspace || process.cwd(),
      autoSaveInterval: config.autoSaveInterval || 30000,
      captureChanges: config.captureChanges ?? true,
      restoreOnInit: config.restoreOnInit ?? true
    };

    this.stateManager = new StateManager({
      basePath: path.join(this.config.basePath, '.state'),
      autoSaveInterval: this.config.autoSaveInterval
    });

    this.router = new WorkRouter(this.config.basePath);
    this.capture = new SessionCapture(this.stateManager);
    this.restorer = new SessionRestorer(this.stateManager, this.config.basePath);
  }

  public async initialize(): Promise<RestorationContext | null> {
    if (this.initialized) return null;

    console.log('🚀 Initializing Session Continuity System...');

    // Try to restore previous session
    let context: RestorationContext | null = null;
    
    if (this.config.restoreOnInit) {
      context = await this.restorer.restoreSession(this.config.workspace);
      
      if (context) {
        console.log('✅ Previous session restored successfully');
        console.log(this.restorer.formatRestorationContext(context));
      } else {
        console.log('📝 Starting new session...');
        await this.stateManager.createSession(this.config.workspace);
      }
    } else {
      await this.stateManager.createSession(this.config.workspace);
    }

    // Initialize capture system
    await this.capture.initialize();

    if (this.config.captureChanges) {
      this.capture.startWatching(10000); // Watch every 10 seconds
    }

    this.initialized = true;
    console.log('✨ Session Continuity System ready');

    return context;
  }

  public async handleUserInput(input: string, metadata?: Partial<WorkRequest>): Promise<RouteResult> {
    // Capture user message
    this.capture.captureUserMessage(input);

    // Analyze and route
    const request: WorkRequest = {
      userInput: input,
      currentDirectory: metadata?.currentDirectory || process.cwd(),
      recentFiles: metadata?.recentFiles || [],
      gitBranch: metadata?.gitBranch,
      fileExtensions: metadata?.fileExtensions || []
    };

    const route = this.router.analyzeAndRoute(request);

    // Log the routing decision
    this.capture.captureDecision(
      `Route user request: "${input.substring(0, 100)}..."`,
      ['Create new project', 'Update existing', 'Archive session'],
      `${route.action} to ${route.targetPath}`,
      `Matched pattern with ${(route.confidence * 100).toFixed(1)}% confidence`
    );

    // Create work item if high confidence
    if (route.confidence > 0.5) {
      const workItem = this.stateManager.addWorkItem({
        type: route.workType,
        status: WorkStatus.PENDING,
        title: this.extractTitle(input),
        description: input,
        priority: 'medium',
        tags: route.suggestedTags,
        relatedFiles: [],
        dependencies: [],
        projectPath: route.targetPath
      });

      this.stateManager.setActiveWorkItem(workItem.id);
    }

    return route;
  }

  public startWork(workItemId: string): void {
    this.stateManager.updateWorkItem(workItemId, {
      status: WorkStatus.IN_PROGRESS
    });
    this.stateManager.setActiveWorkItem(workItemId);
    
    console.log(`▶️  Started work: ${workItemId}`);
  }

  public completeWork(workItemId: string, notes?: string): void {
    this.stateManager.updateWorkItem(workItemId, {
      status: WorkStatus.COMPLETED
    });

    // Capture learning
    if (notes) {
      this.capture.captureLearning(
        LearningCategory.TECHNICAL,
        `Completed: ${workItemId}`,
        notes,
        'work-completion',
        'medium'
      );
    }

    console.log(`✅ Completed work: ${workItemId}`);
  }

  public blockWork(workItemId: string, reason: string): void {
    this.stateManager.updateWorkItem(workItemId, {
      status: WorkStatus.BLOCKED
    });

    // Add as next step to resolve blocker
    this.capture.captureNextStep(
      `Resolve blocker: ${reason}`,
      'high'
    );

    console.log(`⛔ Blocked work: ${workItemId} - ${reason}`);
  }

  public addNextStep(description: string, priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'): void {
    this.capture.captureNextStep(description, priority);
    console.log(`📝 Added next step: ${description}`);
  }

  public trackFile(filePath: string, description?: string): void {
    const change: any = {
      path: filePath,
      changeType: 'modified',
      lineCount: 0,
      timestamp: new Date().toISOString(),
      description
    };

    this.capture.trackFileChange(change);
  }

  public captureError(error: Error, context?: string): void {
    this.capture.captureError({
      type: error.name,
      message: error.message,
      stack: error.stack,
      context: context || '',
      resolved: false
    });
  }

  public async saveSession(): Promise<void> {
    await this.stateManager.persistState();
    console.log('💾 Session saved');
  }

  public async endSession(): Promise<void> {
    console.log('🏁 Ending session...');

    // Stop watching
    this.capture.stopWatching();

    // Final save
    await this.saveSession();

    // Archive
    await this.stateManager.archiveSession();

    console.log('✅ Session archived');
  }

  public getCurrentContext(): string {
    return this.stateManager.getContextSummary();
  }

  public getActiveWork(): WorkItem | null {
    return this.stateManager.getActiveWorkItem();
  }

  public getPendingSteps(): any[] {
    return this.stateManager.getPendingNextSteps();
  }

  public getSessionReport(): string {
    return this.capture.generateSessionReport();
  }

  public async searchSessions(query: string): Promise<SessionSnapshot[]> {
    return this.restorer.searchPastSessions(query);
  }

  public async restoreSession(sessionId: string): Promise<RestorationContext | null> {
    return this.restorer.restoreSpecificSession(sessionId);
  }

  public suggestNextActions(): string[] {
    const activeWork = this.getActiveWork();
    if (!activeWork) return [];
    return this.router.suggestNextActions(activeWork);
  }

  private extractTitle(input: string): string {
    // Try to extract a concise title from the input
    const sentences = input.split(/[.!?]/);
    const firstSentence = sentences[0].trim();
    
    if (firstSentence.length < 100) {
      return firstSentence;
    }
    
    // Take first 80 chars and add ellipsis
    return firstSentence.substring(0, 80) + '...';
  }

  public async wrapUpAndContinue(laterTasks: string[]): Promise<void> {
    console.log('🔄 Wrapping up current session for continuation...');

    // Add continuation tasks
    for (const task of laterTasks) {
      this.addNextStep(task, 'high');
    }

    // Add a note about continuation
    this.capture.captureLearning(
      LearningCategory.PROCESS,
      'Session Continuation',
      `Session will continue with tasks: ${laterTasks.join(', ')}`,
      'session-wrap-up',
      'high'
    );

    // Save but don't archive (we're continuing)
    await this.saveSession();

    console.log('✅ Session ready for continuation');
    console.log('Next tasks:');
    laterTasks.forEach((task, i) => console.log(`  ${i + 1}. ${task}`));
  }

  public getStats(): object {
    const state = this.stateManager.getCurrentState();
    if (!state) return {};

    return {
      sessionId: state.snapshotId,
      startTime: state.context.startTime,
      projects: state.projects.length,
      workItems: state.projects.reduce((sum, p) => sum + p.workItems.length, 0),
      completedWork: state.projects.reduce(
        (sum, p) => sum + p.workItems.filter(w => w.status === 'completed').length, 
        0
      ),
      pendingSteps: state.nextSteps.length,
      learnings: state.learnings.length,
      decisions: state.decisions.length,
      filesCreated: state.metadata.totalFilesCreated,
      filesModified: state.metadata.totalFilesModified,
      commandsExecuted: state.metadata.commandsExecuted.length
    };
  }

  public printStats(): void {
    const stats = this.getStats();
    console.log('\n📊 Session Statistics');
    console.log('=====================');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  }
}

// Singleton instance for global access
let globalInstance: SessionContinuity | null = null;

export function initializeSessionContinuity(config?: Partial<ContinuityConfig>): SessionContinuity {
  if (!globalInstance) {
    globalInstance = new SessionContinuity(config);
  }
  return globalInstance;
}

export function getSessionContinuity(): SessionContinuity | null {
  return globalInstance;
}
