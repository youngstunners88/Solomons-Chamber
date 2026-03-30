#!/usr/bin/env tsx
/**
 * Session Continuity CLI
 * 
 * Command-line interface for managing sessions
 */

import { SessionContinuity, initializeSessionContinuity } from '../core/SessionContinuity';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  const continuity = initializeSessionContinuity({
    workspace: process.cwd(),
    restoreOnInit: command !== 'new'
  });

  switch (command) {
    case 'init':
    case 'start':
      const context = await continuity.initialize();
      if (!context) {
        console.log('🆕 Started new session');
      }
      break;

    case 'status':
      await continuity.initialize();
      continuity.printStats();
      break;

    case 'report':
      await continuity.initialize();
      console.log(continuity.getSessionReport());
      break;

    case 'save':
      await continuity.initialize();
      await continuity.saveSession();
      break;

    case 'end':
    case 'finish':
      await continuity.initialize();
      await continuity.endSession();
      break;

    case 'continue':
      const tasks = args.length > 0 ? args : ['Continue previous work'];
      await continuity.initialize();
      await continuity.wrapUpAndContinue(tasks);
      break;

    case 'next':
      await continuity.initialize();
      const steps = continuity.getPendingSteps();
      if (steps.length > 0) {
        console.log('📋 Pending Next Steps:');
        steps.forEach((step, i) => {
          console.log(`  ${i + 1}. [${step.priority}] ${step.description}`);
        });
      } else {
        console.log('✅ No pending steps');
      }
      break;

    case 'suggest':
      await continuity.initialize();
      const suggestions = continuity.suggestNextActions();
      if (suggestions.length > 0) {
        console.log('💡 Suggested Next Actions:');
        suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      }
      break;

    case 'work':
      await continuity.initialize();
      const input = args.join(' ');
      const route = await continuity.handleUserInput(input, {
        currentDirectory: process.cwd(),
        recentFiles: [],
        fileExtensions: []
      });
      console.log(`🎯 Routed to: ${route.targetPath}`);
      console.log(`📊 Confidence: ${(route.confibility * 100).toFixed(1)}%`);
      console.log(`🏷️  Tags: ${route.suggestedTags.join(', ')}`);
      break;

    case 'search':
      const query = args.join(' ');
      const sessions = await continuity.searchSessions(query);
      console.log(`🔍 Found ${sessions.length} matching sessions:`);
      sessions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.snapshotId} (${new Date(s.timestamp).toLocaleDateString()})`);
      });
      break;

    case 'help':
    default:
      console.log(`
Session Continuity CLI

Usage: session-cli <command> [options]

Commands:
  init, start     Initialize or restore session
  status          Show current session statistics
  report          Generate session report
  save            Save current session state
  end, finish     Archive and end session
  continue <...>  Wrap up with continuation tasks
  next            Show pending next steps
  suggest         Suggest next actions
  work <input>    Process user input and route work
  search <query>  Search past sessions
  help            Show this help message

Examples:
  session-cli init
  session-cli work "create a new React component"
  session-cli continue "Fix the bug" "Write tests"
  session-cli search "authentication"
      `);
  }
}

main().catch(console.error);
