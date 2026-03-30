/**
 * Session Restoration System
 * 
 * Restores complete session context when starting a new session.
 * Loads state, context, and provides full memory of previous work.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SessionSnapshot,
  WorkItem,
  ConversationMessage,
  NextStep,
  Learning,
  Decision,
  WorkStatus
} from '../types/session.types';
import { StateManager } from '../state/StateManager';

export interface RestorationContext {
  summary: string;
  activeWork: WorkItem | null;
  recentConversation: ConversationMessage[];
  pendingSteps: NextStep[];
  relevantLearnings: Learning[];
  keyDecisions: Decision[];
  filesInProgress: string[];
  recommendations: string[];
}

export interface RestorationOptions {
  loadLastSession: boolean;
  maxConversationHistory: number;
  includeLearnings: boolean;
  showPendingSteps: boolean;
  summarizeChanges: boolean;
}

export class SessionRestorer {
  private stateManager: StateManager;
  private basePath: string;

  constructor(stateManager: StateManager, basePath: string = '/home/teacherchris37/Solomons-Chamber') {
    this.stateManager = stateManager;
    this.basePath = basePath;
  }

  public async restoreSession(
    workspace: string,
    options: Partial<RestorationOptions> = {}
  ): Promise<RestorationContext | null> {
    const opts: RestorationOptions = {
      loadLastSession: options.loadLastSession ?? true,
      maxConversationHistory: options.maxConversationHistory ?? 10,
      includeLearnings: options.includeLearnings ?? true,
      showPendingSteps: options.showPendingSteps ?? true,
      summarizeChanges: options.summarizeChanges ?? true
    };

    // Try to restore existing session
    const snapshot = await this.stateManager.restoreLastSession(workspace);

    if (!snapshot) {
      // No previous session found, create new one
      await this.stateManager.createSession(workspace);
      return null;
    }

    // Build restoration context
    const context = await this.buildRestorationContext(snapshot, opts);

    // Mark as restored
    console.log(`✅ Session restored: ${snapshot.snapshotId}`);
    console.log(`📅 Last active: ${snapshot.context.lastActivity}`);

    return context;
  }

  private async buildRestorationContext(
    snapshot: SessionSnapshot,
    options: RestorationOptions
  ): Promise<RestorationContext> {
    // Get active work
    const activeWork = this.findActiveWorkItem(snapshot);

    // Get recent conversation
    const recentConversation = snapshot.conversation
      .slice(-options.maxConversationHistory);

    // Get pending steps
    const pendingSteps = snapshot.nextSteps.filter(
      step => !step.blockedBy || step.blockedBy.length === 0
    );

    // Get relevant learnings
    const relevantLearnings = this.filterRelevantLearnings(snapshot, activeWork);

    // Get key decisions
    const keyDecisions = snapshot.decisions.slice(-5);

    // Get files in progress
    const filesInProgress = this.extractFilesInProgress(snapshot);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      snapshot,
      activeWork,
      pendingSteps
    );

    // Generate summary
    const summary = this.generateSummary(
      snapshot,
      activeWork,
      pendingSteps,
      options.summarizeChanges
    );

    return {
      summary,
      activeWork,
      recentConversation,
      pendingSteps,
      relevantLearnings,
      keyDecisions,
      filesInProgress,
      recommendations
    };
  }

  private findActiveWorkItem(snapshot: SessionSnapshot): WorkItem | null {
    for (const project of snapshot.projects) {
      if (project.activeWorkItemId) {
        const work = project.workItems.find(w => w.id === project.activeWorkItemId);
        if (work && work.status !== 'completed') {
          return work;
        }
      }
    }

    // Fall back to most recent in-progress work
    const allWork = snapshot.projects.flatMap(p => p.workItems);
    const inProgress = allWork
      .filter(w => w.status === 'in_progress')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return inProgress[0] || null;
  }

  private filterRelevantLearnings(snapshot: SessionSnapshot, activeWork: WorkItem | null): Learning[] {
    if (!activeWork) return snapshot.learnings.slice(-5);

    const workTags = new Set(activeWork.tags.map(t => t.toLowerCase()));
    
    return snapshot.learnings
      .filter(learning => {
        // Check if learning was applied to similar work
        const appliedMatch = learning.appliedTo.some(ref => 
          activeWork.relatedFiles.some(file => file.includes(ref))
        );
        
        // Check category match
        const categoryMatch = activeWork.type === learning.category;
        
        return appliedMatch || categoryMatch;
      })
      .slice(-5);
  }

  private extractFilesInProgress(snapshot: SessionSnapshot): string[] {
    const files = new Set<string>();

    snapshot.projects.forEach(project => {
      // Recent uncommitted changes
      project.uncommittedChanges
        .slice(-10)
        .forEach(change => files.add(change.path));

      // Files from active work items
      project.workItems
        .filter(w => w.status === 'in_progress')
        .flatMap(w => w.relatedFiles)
        .forEach(file => files.add(file));
    });

    return Array.from(files).slice(0, 20);
  }

  private generateRecommendations(
    snapshot: SessionSnapshot,
    activeWork: WorkItem | null,
    pendingSteps: NextStep[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommendation based on active work
    if (activeWork) {
      switch (activeWork.status) {
        case 'pending':
          recommendations.push(`Start work on: "${activeWork.title}"`);
          break;
        case 'in_progress':
          recommendations.push(`Continue: "${activeWork.title}"`);
          break;
        case 'blocked':
          recommendations.push(`Resolve blockers for: "${activeWork.title}"`);
          break;
      }
    }

    // Recommendation based on pending steps
    if (pendingSteps.length > 0) {
      const highPriority = pendingSteps.filter(s => s.priority === 'critical' || s.priority === 'high');
      if (highPriority.length > 0) {
        recommendations.push(`Address ${highPriority.length} high-priority pending steps`);
      }
    }

    // Recommendation based on errors
    const unresolvedErrors = snapshot.metadata.errors.filter(e => !e.resolved);
    if (unresolvedErrors.length > 0) {
      recommendations.push(`Fix ${unresolvedErrors.length} unresolved errors`);
    }

    // Recommendation based on learnings
    if (snapshot.learnings.length > 0) {
      const recentLearning = snapshot.learnings[snapshot.learnings.length - 1];
      recommendations.push(`Apply learning: ${recentLearning.title}`);
    }

    return recommendations;
  }

  private generateSummary(
    snapshot: SessionSnapshot,
    activeWork: WorkItem | null,
    pendingSteps: NextStep[],
    includeChanges: boolean
  ): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Previous Session Summary`);
    lines.push(`**Session:** ${snapshot.snapshotId}`);
    lines.push(`**Last Active:** ${new Date(snapshot.context.lastActivity).toLocaleString()}`);
    lines.push('');

    // Active work
    if (activeWork) {
      lines.push(`## Active Work`);
      lines.push(`**${activeWork.title}** (${activeWork.status})`);
      if (activeWork.description) {
        lines.push(activeWork.description);
      }
      lines.push('');
    }

    // Pending steps
    if (pendingSteps.length > 0) {
      lines.push(`## Pending Next Steps (${pendingSteps.length})`);
      pendingSteps.slice(0, 5).forEach(step => {
        lines.push(`- [ ] ${step.description} (${step.priority})`);
      });
      lines.push('');
    }

    // Recent activity
    if (includeChanges) {
      const totalFiles = snapshot.metadata.totalFilesCreated + 
                        snapshot.metadata.totalFilesModified;
      
      if (totalFiles > 0) {
        lines.push(`## Recent Changes`);
        lines.push(`- Files created: ${snapshot.metadata.totalFilesCreated}`);
        lines.push(`- Files modified: ${snapshot.metadata.totalFilesModified}`);
        lines.push(`- Lines changed: ${snapshot.metadata.totalLinesChanged}`);
        lines.push('');
      }
    }

    // Recent conversation context
    const lastUserMessage = [...snapshot.conversation]
      .reverse()
      .find(m => m.role === 'user');
    
    if (lastUserMessage) {
      lines.push(`## Last Request`);
      lines.push(`> ${lastUserMessage.content.substring(0, 200)}${lastUserMessage.content.length > 200 ? '...' : ''}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  public async searchPastSessions(query: string): Promise<SessionSnapshot[]> {
    try {
      const archivePath = path.join(this.basePath, '.state', 'archive');
      const files = await fs.readdir(archivePath);
      
      const sessions: SessionSnapshot[] = [];
      
      for (const file of files.filter(f => f.endsWith('.json'))) {
        try {
          const data = await fs.readFile(path.join(archivePath, file), 'utf-8');
          const session: SessionSnapshot = JSON.parse(data);
          
          // Simple text search
          const searchable = JSON.stringify(session).toLowerCase();
          if (searchable.includes(query.toLowerCase())) {
            sessions.push(session);
          }
        } catch (error) {
          // Skip invalid files
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  public async findRelatedSessions(workItemId: string): Promise<SessionSnapshot[]> {
    try {
      const archivePath = path.join(this.basePath, '.state', 'archive');
      const files = await fs.readdir(archivePath);
      
      const sessions: SessionSnapshot[] = [];
      
      for (const file of files.filter(f => f.endsWith('.json'))) {
        try {
          const data = await fs.readFile(path.join(archivePath, file), 'utf-8');
          const session: SessionSnapshot = JSON.parse(data);
          
          // Check if any project has this work item
          const hasWorkItem = session.projects.some(p => 
            p.workItems.some(w => w.id === workItemId || w.dependencies.includes(workItemId))
          );
          
          if (hasWorkItem) {
            sessions.push(session);
          }
        } catch (error) {
          // Skip invalid files
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  public formatRestorationContext(context: RestorationContext): string {
    const lines: string[] = [];

    lines.push(context.summary);
    lines.push('');

    if (context.recommendations.length > 0) {
      lines.push('## 💡 Recommendations');
      context.recommendations.forEach((rec, i) => {
        lines.push(`${i + 1}. ${rec}`);
      });
      lines.push('');
    }

    if (context.relevantLearnings.length > 0) {
      lines.push('## 🧠 Relevant Learnings');
      context.relevantLearnings.forEach(learning => {
        lines.push(`- **${learning.title}**: ${learning.description.substring(0, 100)}...`);
      });
      lines.push('');
    }

    if (context.keyDecisions.length > 0) {
      lines.push('## 📋 Key Decisions');
      context.keyDecisions.forEach(dec => {
        lines.push(`- ${dec.context} → **${dec.selected}**`);
      });
      lines.push('');
    }

    if (context.filesInProgress.length > 0) {
      lines.push('## 📁 Files In Progress');
      context.filesInProgress.slice(0, 10).forEach(file => {
        const shortPath = file.replace(this.basePath, '');
        lines.push(`- \`${shortPath}\``);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  public async restoreSpecificSession(sessionId: string): Promise<RestorationContext | null> {
    try {
      const archivePath = path.join(this.basePath, '.state', 'archive', `${sessionId}.json`);
      const data = await fs.readFile(archivePath, 'utf-8');
      const snapshot: SessionSnapshot = JSON.parse(data);

      // Override current session with this one
      const currentState = this.stateManager.getCurrentState();
      if (currentState) {
        // Archive current first
        await this.stateManager.archiveSession();
      }

      // Load the specific session
      // Note: This would require modifying StateManager to load arbitrary snapshots
      // For now, just return the context
      return this.buildRestorationContext(snapshot, {
        loadLastSession: true,
        maxConversationHistory: 20,
        includeLearnings: true,
        showPendingSteps: true,
        summarizeChanges: true
      });
    } catch (error) {
      console.error(`Failed to restore session ${sessionId}:`, error);
      return null;
    }
  }
}
