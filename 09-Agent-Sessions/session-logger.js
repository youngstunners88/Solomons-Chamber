#!/usr/bin/env node
/**
 * Solomon's Chamber - Automatic Session Logger
 * 
 * Captures all agent activities and stores them in the Chamber.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CHAMBER_PATH = "/home/teacherchris37/Solomons-Chamber";
const SESSIONS_PATH = path.join(CHAMBER_PATH, "09-Agent-Sessions");
const CURRENT_PATH = path.join(SESSIONS_PATH, "current");
const ARCHIVE_PATH = path.join(SESSIONS_PATH, "archive");
const DAILY_NOTES_PATH = path.join(CHAMBER_PATH, "05-Self-Notes/daily");

class SessionLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date().toISOString();
    this.sessionFile = path.join(CURRENT_PATH, `${this.sessionId}.md`);
    this.entries = [];
    this.ensureDirectories();
    this.initializeSession();
  }

  generateSessionId() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
  }

  ensureDirectories() {
    [SESSIONS_PATH, CURRENT_PATH, ARCHIVE_PATH, DAILY_NOTES_PATH].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  initializeSession() {
    const header = `# Agent Session Log

**Session ID:** ${this.sessionId}  
**Started:** ${this.startTime}  
**Status:** 🟢 Active

---

## Session Timeline

`;
    fs.writeFileSync(this.sessionFile, header);
    console.log(`📜 Session logging initialized: ${this.sessionId}`);
  }

  log(type, content, metadata = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      content,
      metadata
    };
    this.entries.push(entry);
    
    const icon = this.getIconForType(type);
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });
    
    let entryText = `### ${icon} ${time} - ${this.formatType(type)}\n\n`;
    
    if (content) {
      const maxLength = 2000;
      let displayContent = content;
      if (displayContent.length > maxLength) {
        displayContent = displayContent.substring(0, maxLength) + `\n\n... [truncated, ${displayContent.length - maxLength} more characters]`;
      }
      entryText += `${displayContent}\n\n`;
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      entryText += `**Metadata:**\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\`\n\n`;
    }
    
    entryText += `---\n\n`;
    
    fs.appendFileSync(this.sessionFile, entryText);
  }

  getIconForType(type) {
    const icons = {
      user_request: '👤',
      tool_call: '🔧',
      tool_result: '📊',
      response: '💬',
      file_created: '📄',
      file_modified: '✏️',
      decision: '🎯',
      error: '❌',
      milestone: '🏆',
      info: 'ℹ️'
    };
    return icons[type] || '📝';
  }

  formatType(type) {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  finalize(summary = null) {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(this.startTime).getTime();
    const durationMinutes = Math.round(duration / 60000);
    
    const stats = this.calculateStats();
    
    const footer = `\n## Session Summary

**Ended:** ${endTime}  
**Duration:** ${durationMinutes} minutes  
**Status:** ✅ Completed

### Activity Statistics

| Type | Count |
|------|-------|
| User Requests | ${stats.user_request || 0} |
| Tool Calls | ${stats.tool_call || 0} |
| Files Created | ${stats.file_created || 0} |
| Files Modified | ${stats.file_modified || 0} |
| Decisions | ${stats.decision || 0} |
| Milestones | ${stats.milestone || 0} |
| Errors | ${stats.error || 0} |

${summary ? `### Summary\n\n${summary}\n` : ''}

---

*Session archived in Solomon's Chamber*
`;

    fs.appendFileSync(this.sessionFile, footer);
    
    // Move to archive
    const archiveFile = path.join(ARCHIVE_PATH, `${this.sessionId}.md`);
    const content = fs.readFileSync(this.sessionFile, 'utf8');
    fs.writeFileSync(archiveFile, content);
    fs.unlinkSync(this.sessionFile);
    
    // Update daily notes
    this.updateDailyNotes(stats, durationMinutes);
    
    console.log(`✅ Session finalized and archived`);
    return archiveFile;
  }

  calculateStats() {
    const stats = {};
    this.entries.forEach(entry => {
      stats[entry.type] = (stats[entry.type] || 0) + 1;
    });
    return stats;
  }

  updateDailyNotes(stats, durationMinutes) {
    const today = new Date().toISOString().split('T')[0];
    const dailyFile = path.join(DAILY_NOTES_PATH, `${today}.md`);
    
    const timeOfDay = this.getTimeOfDay();
    const entry = `- **${timeOfDay}** - Agent session (${durationMinutes}m): ${stats.user_request || 0} requests, ${stats.file_created || 0} files created, ${stats.file_modified || 0} modified\n`;
    
    if (fs.existsSync(dailyFile)) {
      let content = fs.readFileSync(dailyFile, 'utf8');
      
      const sectionMap = {
        'Morning': '## Morning',
        'Afternoon': '## Afternoon',
        'Evening': '## Evening'
      };
      
      const section = sectionMap[timeOfDay];
      if (section && content.includes(section)) {
        const sectionIndex = content.indexOf(section) + section.length;
        content = content.slice(0, sectionIndex) + '\n' + entry + content.slice(sectionIndex);
      } else {
        content += entry;
      }
      
      fs.writeFileSync(dailyFile, content);
    }
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  getSessionId() {
    return this.sessionId;
  }
}

// Export for use as module
module.exports = { SessionLogger };

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      const logger = new SessionLogger();
      console.log(`📁 Log file: ${logger.sessionFile}`);
      break;
    case 'status':
      const sessions = fs.readdirSync(CURRENT_PATH).filter(f => f.endsWith('.md'));
      console.log(`Active sessions: ${sessions.length}`);
      sessions.forEach(s => console.log(`  - ${s}`));
      break;
    case 'archive-all':
      const currentSessions = fs.readdirSync(CURRENT_PATH).filter(f => f.endsWith('.md'));
      currentSessions.forEach(s => {
        const src = path.join(CURRENT_PATH, s);
        const dst = path.join(ARCHIVE_PATH, s);
        fs.copyFileSync(src, dst);
        fs.unlinkSync(src);
        console.log(`Archived: ${s}`);
      });
      break;
    default:
      console.log(`
Solomon's Chamber - Session Logger

Usage:
  node session-logger.js init           # Initialize new session (creates file)
  node session-logger.js status         # Show active sessions
  node session-logger.js archive-all    # Archive all active sessions

For automatic logging, import as module:
  const { SessionLogger } = require('./session-logger.js');
  const logger = new SessionLogger();
  logger.log('user_request', 'User asked about...');
  logger.log('file_created', 'Created new file', { path: '/path/to/file' });
  logger.finalize('Session completed successfully');
      `);
  }
}
