#!/usr/bin/env bun
/**
 * Solomon's Chamber - Automatic Session Logger
 * 
 * Captures all agent activities and stores them in the Chamber.
 * Run at the start of each session to create a persistent log.
 */

import { existsSync, mkdirSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";

// Configuration
const CHAMBER_PATH = "/home/teacherchris37/Solomons-Chamber";
const SESSIONS_PATH = join(CHAMBER_PATH, "09-Agent-Sessions");
const CURRENT_PATH = join(SESSIONS_PATH, "current");
const ARCHIVE_PATH = join(SESSIONS_PATH, "archive");
const DAILY_NOTES_PATH = join(CHAMBER_PATH, "05-Self-Notes/daily");

interface SessionEntry {
  timestamp: string;
  type: "user_request" | "tool_call" | "tool_result" | "response" | "file_created" | "file_modified" | "decision" | "error" | "milestone";
  content: string;
  metadata?: Record<string, any>;
}

interface Session {
  id: string;
  startTime: string;
  entries: SessionEntry[];
}

class SessionLogger {
  private session: Session;
  private sessionFile: string;

  constructor() {
    this.session = {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      entries: []
    };
    this.sessionFile = join(CURRENT_PATH, `${this.session.id}.md`);
    this.ensureDirectories();
    this.initializeSession();
  }

  private generateSessionId(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  }

  private ensureDirectories(): void {
    [SESSIONS_PATH, CURRENT_PATH, ARCHIVE_PATH, DAILY_NOTES_PATH].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  private initializeSession(): void {
    const header = `# Agent Session Log

**Session ID:** ${this.session.id}  
**Started:** ${this.session.startTime}  
**Status:** 🟢 Active

---

## Session Timeline

`;
    writeFileSync(this.sessionFile, header);
    console.log(`📜 Session logging initialized: ${this.session.id}`);
    console.log(`📁 Log file: ${this.sessionFile}`);
  }

  log(entry: SessionEntry): void {
    this.session.entries.push(entry);
    
    const icon = this.getIconForType(entry.type);
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });
    
    let entryText = `### ${icon} ${time} - ${this.formatType(entry.type)}\n\n`;
    
    if (entry.content) {
      // Truncate very long content
      const maxLength = 2000;
      let content = entry.content;
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + `\n\n... [truncated, ${content.length - maxLength} more characters]`;
      }
      entryText += `${content}\n\n`;
    }
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      entryText += `**Metadata:**\n\`\`\`json\n${JSON.stringify(entry.metadata, null, 2)}\n\`\`\`\n\n`;
    }
    
    entryText += `---\n\n`;
    
    appendFileSync(this.sessionFile, entryText);
  }

  private getIconForType(type: SessionEntry['type']): string {
    const icons: Record<SessionEntry['type'], string> = {
      user_request: '👤',
      tool_call: '🔧',
      tool_result: '📊',
      response: '💬',
      file_created: '📄',
      file_modified: '✏️',
      decision: '🎯',
      error: '❌',
      milestone: '🏆'
    };
    return icons[type] || '📝';
  }

  private formatType(type: string): string {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  finalize(summary?: string): void {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(this.session.startTime).getTime();
    const durationMinutes = Math.round(duration / 60000);
    
    const stats = this.calculateStats();
    
    const footer = `\n## Session Summary

**Ended:** ${endTime}  
**Duration:** ${durationMinutes} minutes  
**Status:** ✅ Completed

### Activity Statistics

| Type | Count |
|------|-------|
| User Requests | ${stats.user_request} |
| Tool Calls | ${stats.tool_call} |
| Files Created | ${stats.file_created} |
| Files Modified | ${stats.file_modified} |
| Decisions | ${stats.decision} |
| Milestones | ${stats.milestone} |
| Errors | ${stats.error} |

${summary ? `### Summary\n\n${summary}\n` : ''}

---

*Session archived in Solomon's Chamber*
`;

    appendFileSync(this.sessionFile, footer);
    
    // Move to archive
    const archiveFile = join(ARCHIVE_PATH, `${this.session.id}.md`);
    const content = require('fs').readFileSync(this.sessionFile, 'utf8');
    writeFileSync(archiveFile, content);
    require('fs').unlinkSync(this.sessionFile);
    
    // Update daily notes
    this.updateDailyNotes(stats, durationMinutes);
    
    console.log(`✅ Session finalized and archived: ${this.session.id}`);
    console.log(`📁 Archived to: ${archiveFile}`);
  }

  private calculateStats(): Record<string, number> {
    const stats: Record<string, number> = {
      user_request: 0,
      tool_call: 0,
      tool_result: 0,
      response: 0,
      file_created: 0,
      file_modified: 0,
      decision: 0,
      error: 0,
      milestone: 0
    };
    
    this.session.entries.forEach(entry => {
      stats[entry.type] = (stats[entry.type] || 0) + 1;
    });
    
    return stats;
  }

  private updateDailyNotes(stats: Record<string, number>, durationMinutes: number): void {
    const today = new Date().toISOString().split('T')[0];
    const dailyFile = join(DAILY_NOTES_PATH, `${today}.md`);
    
    const timeOfDay = this.getTimeOfDay();
    const entry = `- **${timeOfDay}** - Agent session (${durationMinutes}m): ${stats.user_request} requests, ${stats.file_created} files created, ${stats.file_modified} modified\n`;
    
    if (existsSync(dailyFile)) {
      let content = require('fs').readFileSync(dailyFile, 'utf8');
      
      // Find the appropriate section based on time of day
      const sectionMap: Record<string, string> = {
        'Morning': '## Morning',
        'Afternoon': '## Afternoon',
        'Evening': '## Evening'
      };
      
      const section = sectionMap[timeOfDay];
      if (section && content.includes(section)) {
        // Insert after the section header
        const sectionIndex = content.indexOf(section) + section.length;
        content = content.slice(0, sectionIndex) + '\n' + entry + content.slice(sectionIndex);
      } else {
        content += entry;
      }
      
      require('fs').writeFileSync(dailyFile, content);
    }
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  getSessionId(): string {
    return this.session.id;
  }
}

// Singleton instance
let logger: SessionLogger | null = null;

export function initSession(): SessionLogger {
  if (!logger) {
    logger = new SessionLogger();
  }
  return logger;
}

export function getLogger(): SessionLogger {
  if (!logger) {
    return initSession();
  }
  return logger;
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      initSession();
      break;
    case 'log':
      const type = process.argv[3] as SessionEntry['type'];
      const content = process.argv[4];
      if (type && content) {
        getLogger().log({
          timestamp: new Date().toISOString(),
          type,
          content
        });
      }
      break;
    case 'finalize':
      const summary = process.argv[3];
      getLogger().finalize(summary);
      break;
    default:
      console.log(`
Solomon's Chamber - Session Logger

Usage:
  bun session-logger.ts init                    # Initialize new session
  bun session-logger.ts log <type> <content>    # Log an entry
  bun session-logger.ts finalize [summary]      # Finalize and archive session

Types:
  user_request, tool_call, tool_result, response
  file_created, file_modified, decision, error, milestone
      `);
  }
}
