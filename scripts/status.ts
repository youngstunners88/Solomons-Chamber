#!/usr/bin/env bun
/**
 * Vault Status
 * Shows current state of your vault
 */

import { readdirSync, statSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";

function countFiles(dir: string): number {
  try {
    return readdirSync(join(VAULT_PATH, dir)).filter(f => f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

function getLatest(dir: string): string {
  try {
    const files = readdirSync(join(VAULT_PATH, dir))
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        mtime: statSync(join(VAULT_PATH, dir, f)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    return files[0]?.name || "None";
  } catch {
    return "None";
  }
}

console.log("🗂️  Solomons Chamber - Status Dashboard");
console.log("========================================");
console.log("");

const counts = {
  inbox: countFiles("00-Inbox"),
  projects: countFiles("01-Projects/active"),
  research: countFiles("02-Research/topics"),
  trades: countFiles("03-Trading/signals"),
  daily: countFiles("05-Self-Notes/daily"),
  media: countFiles("06-Media/Audio/Voice-Memos/Inbox"),
  skills: countFiles("10-Skills"),
};

console.log(`📊 Vault Statistics:`);
console.log(`   📥 Inbox: ${counts.inbox} items`);
console.log(`   📁 Projects: ${counts.projects} active`);
console.log(`   🔬 Research: ${counts.research} topics`);
console.log(`   📈 Trades: ${counts.trades} signals`);
console.log(`   📝 Daily Notes: ${counts.daily} entries`);
console.log(`   🎙️ Voice Memos: ${counts.media} memos`);
console.log(`   🛠️ Skills: ${counts.skills} installed`);
console.log("");

console.log(`📝 Latest Daily Note: ${getLatest("05-Self-Notes/daily")}`);
console.log(`📥 Latest Inbox Item: ${getLatest("00-Inbox")}`);
console.log("");

console.log(`💡 Quick Commands:`);
console.log(`   bun scripts/daily-note.ts`);
console.log(`   bun scripts/voice-capture.ts`);
console.log(`   cat 05-Self-Notes/daily/*.md | tail -20`);

