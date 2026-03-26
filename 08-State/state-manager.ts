#!/usr/bin/env bun
/**
 * State Manager — Track what's active, pending, completed
 * 
 * Usage: bun 08-State/state-manager.ts [--dashboard] [--list-active]
 */

import { readdirSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";

interface StateItem {
  file: string;
  state: "active" | "pending" | "completed" | "archived";
  section: string;
}

function scanDirectory(dir: string, section: string, items: StateItem[]) {
  if (!existsSync(dir)) return;
  
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      items.push({ file: entry.name, state: "active", section });
    } else if (entry.isDirectory()) {
      scanDirectory(join(dir, entry.name), `${section}/${entry.name}`, items);
    }
  }
}

const args = process.argv.slice(2);
const showDashboard = args.includes("--dashboard");

const items: StateItem[] = [];

// Scan key directories
scanDirectory(join(VAULT_PATH, "01-Projects/active"), "Projects", items);
scanDirectory(join(VAULT_PATH, "02-Research"), "Research", items);
scanDirectory(join(VAULT_PATH, "03-Trading/signals"), "Trading", items);

const stats = {
  projects: items.filter(i => i.section.startsWith("Projects")).length,
  research: items.filter(i => i.section.startsWith("Research")).length,
  trading: items.filter(i => i.section.startsWith("Trading")).length
};

console.log("🏛️  Solomons Chamber — State Dashboard");
console.log("=".repeat(50));
console.log();

console.log("📊 Active Items:");
console.log(`   📝 Projects: ${stats.projects}`);
console.log(`   🔬 Research: ${stats.research}`);
console.log(`   📈 Trading: ${stats.trading}`);
console.log(`   📦 Total: ${items.length}`);
console.log();

if (showDashboard) {
  console.log("📍 Recent Activity (last 10):");
  items.slice(-10).forEach(item => {
    console.log(`   • [${item.section}] ${item.file}`);
  });
}

console.log();
console.log("💡 Quick actions:");
console.log("   bun 07-Routing/vault-router.ts --process");
console.log("   bun scripts/daily-note.ts");
console.log("   bun scripts/voice-capture.ts");

// Save state
const stateFile = join(VAULT_PATH, "08-State", "vault-state.json");
if (!existsSync(dirname(stateFile))) {
  mkdirSync(dirname(stateFile), { recursive: true });
}
writeFileSync(stateFile, JSON.stringify({ items, stats, updated: new Date().toISOString() }, null, 2));

function dirname(_p: string): string {
  const parts = _p.split("/");
  parts.pop();
  return parts.join("/");
}
