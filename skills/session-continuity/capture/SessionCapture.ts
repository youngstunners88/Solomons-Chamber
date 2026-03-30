/**
 * Session Capture System
 * 
 * Automatically captures and tracks all work done during a session.
 * Monitors file changes, commands, tool usage, and conversations.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  FileChange,
  ChangeType,
  ConversationMessage,
  ErrorRecord,
  WorkItem,
  WorkStatus
} from '../types/session.types';
import { StateManager } from '../state/StateManager';

const execAsync = promisify(exec);

export interface CaptureConfig {
  watchPaths: string[];
  excludePatterns: RegExp[];
  captureCommands: boolean;
  captureConversation: boolean;
  captureErrors: boolean;
  autoCommit: boolean;
}

export class SessionCapture {
  private config: CaptureConfig;
  private stateManager: StateManager;
  private fileHashes: Map<string, string> = new Map();
  private commandHistory: string[] = [];
  private isWatching: boolean = false;

  constructor(stateManager: StateManager, config: Partial<CaptureConfig> = {}) {
    this.stateManager = stateManager;
    this.config = {
      watchPaths: config.watchPaths || ['/home/teacherchris37/Solomons-Chamber'],
      excludePatterns: config.excludePatterns || [
        /node_modules/,
        /\.git/,
        /\.cache/,
        /dist/,
        /build/,
        /\.log$/,
        /\.tmp$/,
        /\.temp$/
      ],
      captureCommands: config.captureCommands ?? true,
      captureConversation: config.captureConversation ?? true,
      captureErrors: config.captureErrors ?? true,
      autoCommit: config.autoCommit ?? false
    };
  }

  public async initialize(): Promise<void> {
    // Take baseline snapshot of watched paths
    for (const watchPath of this.config.watchPaths) {
      await this.takeBaseline(watchPath);
    }
  }

  private async takeBaseline(watchPath: string): Promise<void> {
    try {
      const files = await this.getAllFiles(watchPath);
      
      for (const file of files) {
        if (this.shouldExclude(file)) continue;
        
        try {
          const content = await fs.readFile(file, 'utf-8');
          const hash = this.computeHash(content);
          this.fileHashes.set(file, hash);
        } catch (error) {
          // Binary file or unreadable
          this.fileHashes.set(file, 'binary');
        }
      }
    } catch (error) {
      console.error(`Failed to take baseline for ${watchPath}:`, error);
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (this.shouldExclude(fullPath)) continue;
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    
    return files;
  }

  private shouldExclude(filePath: string): boolean {
    return this.config.excludePatterns.some(pattern => pattern.test(filePath));
  }

  private computeHash(content: string): string {
    // Simple hash for tracking changes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  public async captureChanges(): Promise<FileChange[]> {
    const changes: FileChange[] = [];
    const currentHashes = new Map<string, string>();

    for (const watchPath of this.config.watchPaths) {
      const files = await this.getAllFiles(watchPath);
      
      for (const file of files) {
        if (this.shouldExclude(file)) continue;

        try {
          const content = await fs.readFile(file, 'utf-8');
          const hash = this.computeHash(content);
          currentHashes.set(file, hash);

          const previousHash = this.fileHashes.get(file);
          
          if (!previousHash) {
            // New file
            changes.push({
              path: file,
              changeType: ChangeType.CREATED,
              lineCount: content.split('\n').length,
              timestamp: new Date().toISOString()
            });
          } else if (previousHash !== hash) {
            // Modified file
            changes.push({
              path: file,
              changeType: ChangeType.MODIFIED,
              beforeHash: previousHash,
              afterHash: hash,
              lineCount: content.split('\n').length,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          // Binary file or unreadable
          currentHashes.set(file, 'binary');
        }
      }
    }

    // Check for deleted files
    for (const [file, hash] of this.fileHashes.entries()) {
      if (!currentHashes.has(file)) {
        changes.push({
          path: file,
          changeType: ChangeType.DELETED,
          beforeHash: hash,
          lineCount: 0,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update stored hashes
    this.fileHashes = currentHashes;

    // Track changes in state manager
    for (const change of changes) {
      this.stateManager.trackFileChange(change);
    }

    return changes;
  }

  public captureUserMessage(content: string, intent?: string, extractedTasks?: string[]): void {
    if (!this.config.captureConversation) return;

    const message: Omit<ConversationMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content,
      intent,
      extractedTasks
    };

    this.stateManager.addConversationMessage(message);

    // If tasks were extracted, create work items
    if (extractedTasks) {
      for (const task of extractedTasks) {
        this.stateManager.addWorkItem({
          type: this.inferWorkType(task),
          status: WorkStatus.PENDING,
          title: task,
          description: `Extracted from user message`,
          priority: 'medium',
          tags: [],
          relatedFiles: [],
          dependencies: [],
          projectPath: ''
        });
      }
    }
  }

  public captureAgentResponse(content: string): void {
    if (!this.config.captureConversation) return;

    const message: Omit<ConversationMessage, 'id' | 'timestamp'> = {
      role: 'agent',
      content
    };

    this.stateManager.addConversationMessage(message);
  }

  public captureCommand(command: string, output?: string, exitCode?: number): void {
    if (!this.config.captureCommands) return;

    this.commandHistory.push(command);

    const state = this.stateManager.getCurrentState();
    if (state) {
      state.metadata.commandsExecuted.push(command);
    }

    // Check for errors in command
    if (exitCode !== undefined && exitCode !== 0) {
      this.captureError({
        type: 'CommandError',
        message: `Command failed with exit code ${exitCode}: ${command}`,
        context: output || '',
        resolved: false
      });
    }
  }

  public captureToolUsage(toolName: string, params: Record<string, any>): void {
    const state = this.stateManager.getCurrentState();
    if (state && !state.metadata.toolsUsed.includes(toolName)) {
      state.metadata.toolsUsed.push(toolName);
    }
  }

  public captureError(error: Omit<ErrorRecord, 'timestamp'>): void {
    if (!this.config.captureErrors) return;

    const state = this.stateManager.getCurrentState();
    if (state) {
      state.metadata.errors.push({
        ...error,
        timestamp: new Date().toISOString()
      });
    }
  }

  public captureWarning(warning: string): void {
    const state = this.stateManager.getCurrentState();
    if (state && !state.metadata.warnings.includes(warning)) {
      state.metadata.warnings.push(warning);
    }
  }

  public captureDecision(context: string, options: string[], selected: string, rationale: string): void {
    this.stateManager.addDecision({
      context,
      options,
      selected,
      rationale,
      impact: [],
      reversible: true
    });
  }

  public captureLearning(category: string, title: string, description: string, source: string, confidence: 'high' | 'medium' | 'low' = 'medium'): void {
    this.stateManager.addLearning({
      category: category as any,
      title,
      description,
      source,
      appliedTo: [],
      confidence
    });
  }

  public captureNextStep(description: string, priority: 'critical' | 'high' | 'medium' | 'low' = 'medium', estimatedTime?: string): void {
    this.stateManager.addNextStep({
      description,
      priority,
      estimatedTime
    });
  }

  public async autoCommit(): Promise<void> {
    if (!this.config.autoCommit) return;

    try {
      const changes = await this.captureChanges();
      
      if (changes.length > 0) {
        // Check if we're in a git repo
        for (const watchPath of this.config.watchPaths) {
          try {
            await execAsync('git rev-parse --git-dir', { cwd: watchPath });
            
            // Stage all changes
            await execAsync('git add -A', { cwd: watchPath });
            
            // Commit with session info
            const state = this.stateManager.getCurrentState();
            const sessionId = state?.snapshotId || 'unknown';
            const message = `[Session ${sessionId}] Auto-commit: ${changes.length} files changed`;
            
            await execAsync(`git commit -m "${message}"`, { cwd: watchPath });
          } catch (error) {
            // Not a git repo or nothing to commit
          }
        }
      }
    } catch (error) {
      console.error('Auto-commit failed:', error);
    }
  }

  public startWatching(interval: number = 10000): void {
    if (this.isWatching) return;
    
    this.isWatching = true;
    
    const watch = async () => {
      if (!this.isWatching) return;
      
      await this.captureChanges();
      
      if (this.config.autoCommit) {
        await this.autoCommit();
      }
      
      setTimeout(watch, interval);
    };
    
    watch();
  }

  public stopWatching(): void {
    this.isWatching = false;
  }

  public getCommandHistory(): string[] {
    return [...this.commandHistory];
  }

  public getFileChangeStats(): { created: number; modified: number; deleted: number } {
    const state = this.stateManager.getCurrentState();
    if (!state) return { created: 0, modified: 0, deleted: 0 };

    let created = 0;
    let modified = 0;
    let deleted = 0;

    state.projects.forEach(project => {
      project.uncommittedChanges.forEach(change => {
        switch (change.changeType) {
          case ChangeType.CREATED:
            created++;
            break;
          case ChangeType.MODIFIED:
            modified++;
            break;
          case ChangeType.DELETED:
            deleted++;
            break;
        }
      });
    });

    return { created, modified, deleted };
  }

  private inferWorkType(task: string): any {
    const typePatterns = [
      [/fix|bug|error|issue/i, 'bugfix'],
      [/add|create|implement|build/i, 'feature'],
      [/refactor|rewrite|restructure/i, 'refactor'],
      [/document|doc|guide/i, 'documentation'],
      [/research|investigate|analyze/i, 'research'],
      [/design|ui|ux/i, 'design']
    ];

    for (const [pattern, type] of typePatterns) {
      if (pattern.test(task)) return type;
    }

    return 'feature';
  }

  public generateSessionReport(): string {
    const state = this.stateManager.getCurrentState();
    if (!state) return 'No active session';

    const stats = this.getFileChangeStats();
    const duration = new Date().getTime() - new Date(state.context.startTime).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return `
## Session Report

**Session ID:** ${state.snapshotId}
**Duration:** ${hours}h ${minutes}m
**Workspace:** ${state.context.workspace}

### Activity Summary
- Files Created: ${stats.created}
- Files Modified: ${stats.modified}
- Files Deleted: ${stats.deleted}
- Total Lines Changed: ${state.metadata.totalLinesChanged}
- Commands Executed: ${state.metadata.commandsExecuted.length}
- Tools Used: ${state.metadata.toolsUsed.length}

### Projects
${state.projects.map(p => `- ${p.name} (${p.workItems.length} work items)`).join('\n')}

### Pending Next Steps
${state.nextSteps.slice(0, 5).map(s => `- ${s.description}`).join('\n')}

### Recent Learnings
${state.learnings.slice(0, 3).map(l => `- ${l.title}`).join('\n')}
    `.trim();
  }
}
