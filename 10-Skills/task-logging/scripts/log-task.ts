#!/usr/bin/env tsx
/**
 * Task Logging System - Automatic task tracking for Solomon's Chamber
 * 
 * Usage:
 *   log-task start "User command here" "Description of task"
 *   log-task complete TASK-2026-04-05T... "Results description" "file1.ts,file2.ts"
 *   log-task list
 *   log-task status
 */

import { writeFileSync, appendFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const SESSIONS_DIR = '/home/teacherchris37/Solomons-Chamber/09-Agent-Sessions/current';

function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function startTask(userCommand: string, description: string): string {
  const timestamp = generateTimestamp();
  const taskId = `TASK-${timestamp}`;
  
  const logContent = `# TASK LOG - ${taskId}

## Status: 🟡 IN PROGRESS

## Task Description
${description}

## User Command (Exact Quote)
> "${userCommand}"

## Execution Plan
- [ ] Analyze requirements
- [ ] Plan implementation  
- [ ] Execute task
- [ ] Verify results
- [ ] Log completion

## Files to Modify
- TBD

## Expected Outcome
TBD

## Started At
${new Date().toISOString()}

## Agent
Kimi Code CLI

---

## Progress Log

`;

  const filePath = join(SESSIONS_DIR, `${taskId}.md`);
  writeFileSync(filePath, logContent);
  
  console.log(`✅ Task logged: ${taskId}`);
  console.log(`   File: ${filePath}`);
  return taskId;
}

function logProgress(taskId: string, message: string): void {
  const filePath = join(SESSIONS_DIR, `${taskId}.md`);
  
  if (!existsSync(filePath)) {
    console.error(`❌ Task not found: ${taskId}`);
    return;
  }
  
  const timestamp = new Date().toISOString();
  const logEntry = `- [${timestamp}] ${message}\n`;
  
  appendFileSync(filePath, logEntry);
  console.log(`📝 Progress logged: ${message}`);
}

function completeTask(taskId: string, results: string, filesModified: string[] = []): void {
  const filePath = join(SESSIONS_DIR, `${taskId}.md`);
  
  if (!existsSync(filePath)) {
    console.error(`❌ Task not found: ${taskId}`);
    return;
  }
  
  const completionContent = `
## Status: ✅ COMPLETE

## Results
${results}

## Files Modified
${filesModified.length > 0 ? filesModified.map(f => `- ${f}`).join('\n') : '- None recorded'}

## Completed At
${new Date().toISOString()}

`;

  appendFileSync(filePath, completionContent);
  
  // Update status line
  let content = readFileSync(filePath, 'utf8');
  content = content.replace('## Status: 🟡 IN PROGRESS', '## Status: ✅ COMPLETE');
  writeFileSync(filePath, content);
  
  console.log(`✅ Task completed and logged: ${taskId}`);
}

function listActiveTasks(): void {
  const files = readdirSync(SESSIONS_DIR);
  const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
  
  console.log('\n📋 Active Tasks:\n');
  
  let count = 0;
  for (const file of taskFiles) {
    const filePath = join(SESSIONS_DIR, file);
    const content = readFileSync(filePath, 'utf8');
    
    if (content.includes('IN PROGRESS')) {
      const taskId = file.replace('.md', '');
      const commandMatch = content.match(/> "(.+)"/);
      const command = commandMatch ? commandMatch[1].substring(0, 60) + '...' : 'N/A';
      
      console.log(`  🟡 ${taskId}`);
      console.log(`     Command: ${command}`);
      count++;
    }
  }
  
  if (count === 0) {
    console.log('  No active tasks found.');
  } else {
    console.log(`\n  Total active: ${count}`);
  }
}

function showStatus(): void {
  const files = readdirSync(SESSIONS_DIR);
  const taskFiles = files.filter(f => f.startsWith('TASK-') && f.endsWith('.md'));
  
  let inProgress = 0;
  let completed = 0;
  
  for (const file of taskFiles) {
    const filePath = join(SESSIONS_DIR, file);
    const content = readFileSync(filePath, 'utf8');
    
    if (content.includes('IN PROGRESS')) {
      inProgress++;
    } else if (content.includes('COMPLETE')) {
      completed++;
    }
  }
  
  console.log('\n📊 Task Status:\n');
  console.log(`  🟡 In Progress: ${inProgress}`);
  console.log(`  ✅ Complete: ${completed}`);
  console.log(`  📁 Total: ${inProgress + completed}`);
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'start':
    if (args.length < 3) {
      console.error('Usage: log-task start "user command" "description"');
      process.exit(1);
    }
    startTask(args[1], args[2]);
    break;
    
  case 'progress':
    if (args.length < 3) {
      console.error('Usage: log-task progress TASK-ID "message"');
      process.exit(1);
    }
    logProgress(args[1], args[2]);
    break;
    
  case 'complete':
    if (args.length < 3) {
      console.error('Usage: log-task complete TASK-ID "results" ["file1,file2"]');
      process.exit(1);
    }
    const files = args[3] ? args[3].split(',') : [];
    completeTask(args[1], args[2], files);
    break;
    
  case 'list':
    listActiveTasks();
    break;
    
  case 'status':
    showStatus();
    break;
    
  default:
    console.log('Task Logging System for Solomon\'s Chamber\n');
    console.log('Commands:');
    console.log('  start "command" "desc"  - Start a new task');
    console.log('  progress TASK-ID "msg"  - Log progress');
    console.log('  complete TASK-ID "res"  - Mark as complete');
    console.log('  list                    - Show active tasks');
    console.log('  status                  - Show statistics');
    console.log('\nExample:');
    console.log('  log-task start "fix bug" "Fix the login button"');
}
