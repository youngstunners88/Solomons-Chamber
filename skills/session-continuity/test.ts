/**
 * Quick test of Session Continuity System
 */

import { initializeSessionContinuity } from './core/SessionContinuity';

async function test() {
  console.log('🧪 Testing Session Continuity System\n');

  // Initialize
  const continuity = initializeSessionContinuity({
    workspace: '/home/teacherchris37/Solomons-Chamber',
    restoreOnInit: true
  });

  console.log('1️⃣ Initializing...');
  const context = await continuity.initialize();

  if (context) {
    console.log('✅ Restored previous session');
    console.log('\n📋 Context Summary:');
    console.log(context.summary);
  } else {
    console.log('🆕 New session started');
  }

  // Test routing
  console.log('\n2️⃣ Testing work routing...');
  const route = await continuity.handleUserInput(
    "Create a React component for user profiles",
    {
      currentDirectory: process.cwd(),
      recentFiles: [],
      fileExtensions: ['.tsx', '.ts']
    }
  );

  console.log(`Target: ${route.targetPath}`);
  console.log(`Work Type: ${route.workType}`);
  console.log(`Confidence: ${(route.confidence * 100).toFixed(1)}%`);
  console.log(`Tags: ${route.suggestedTags.join(', ')}`);

  // Test stats
  console.log('\n3️⃣ Session Stats:');
  continuity.printStats();

  // Save
  console.log('\n4️⃣ Saving session...');
  await continuity.saveSession();

  console.log('\n✨ Test complete!');
  console.log('Session saved to: Solomons-Chamber/.state/current/session.json');
}

test().catch(console.error);
