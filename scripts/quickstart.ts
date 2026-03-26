#!/usr/bin/env bun

/**
 * Quick Start: Initialize your vault
 * Usage: bun scripts/quickstart.ts
 */

import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const BASE_PATH = "/home/workspace/Solomons-Chamber-Template";

console.log("🏛️  Solomon's Chamber - Quick Start\n");

// Check if already initialized
if (existsSync(join(BASE_PATH, "00-Inbox", "README.md"))) {
  console.log("✅ Vault already initialized!");
  console.log("\nNext steps:");
  console.log("  1. Create your first note: bun scripts/daily-note.ts");
  console.log("  2. Check your vault: bun scripts/status.ts");
  console.log("  3. Start capturing: bun scripts/voice-capture.ts --help");
  process.exit(0);
}

// Initialize folder structure
const folders = [
  "00-Inbox",
  "01-Projects/active",
  "01-Projects/archived",
  "02-Research/topics",
  "02-Research/sources",
  "02-Research/insights",
  "03-Trading/signals",
  "03-Trading/positions",
  "03-Trading/analysis",
  "04-Assets/skills/examples",
  "04-Assets/skills/templates",
  "04-Assets/adapters",
  "04-Assets/notes",
  "05-Self-Notes/daily",
  "05-Self-Notes/weekly",
  "05-Self-Notes/reflections",
  "06-Archive",
  "07-Routing",
  "08-State/Active",
  "08-State/Pending",
  "09-Automation/Triggers"
];

console.log("📁 Creating folder structure...\n");

for (const folder of folders) {
  const path = join(BASE_PATH, folder);
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    console.log(`  ✓ ${folder}`);
  }
}

// Create placeholder files
const placeholders = [
  { path: "00-Inbox/README.md", content: "# Inbox\n\nCapture everything here first. The router will process it.\n\n## Quick Capture\n- Voice notes → `bun scripts/voice-capture.ts`\n- Media links → `bun scripts/media-link-capture.ts <url>`\n- Daily notes → `bun scripts/daily-note.ts`\n\n## What Happens Next\nItems in inbox are automatically routed based on content type." },
  { path: "01-Projects/README.md", content: "# Projects\n\nActive and archived projects.\n\n## Status Flow\nactive/ → archived/\n\n## Project Template\nSee 04-Assets/notes/project-template.md" },
  { path: "04-Assets/README.md", content: "# Assets\n\nReusable tools and knowledge.\n\n## Skills/\nExecutable scripts that do one thing well.\n\n## Adapters/\nConnect external data (RSS, APIs, databases).\n\n## Notes/\nTemplates and reusable content." },
  { path: "07-Routing/README.md", content: "# Routing\n\nSmart routing system that moves items to their proper place.\n\n## Routes\n- Inbox → Projects (if has #project tag)\n- Inbox → Research (if has #research tag)\n- Inbox → Trading (if has ticker symbol)\n- Projects → Archive (if status: completed)\n\n## Manual Routing\n`bun scripts/route.ts <source> <destination>`" }
];

console.log("\n📝 Creating placeholder files...\n");

for (const { path, content } of placeholders) {
  const fullPath = join(BASE_PATH, path);
  if (!existsSync(fullPath)) {
    await Bun.write(fullPath, content);
    console.log(`  ✓ ${path}`);
  }
}

console.log("\n✅ Initialization complete!");
console.log("\n🚀 Next steps:");
console.log("  1. Create your first daily note:");
console.log("     bun scripts/daily-note.ts");
console.log("\n  2. Set up your first RSS feed:");
console.log("     Edit 04-Assets/adapters/rss-feed.ts");
console.log("\n  3. Check vault status:");
console.log("     bun scripts/status.ts");
console.log("\n  4. Explore the examples:");
console.log("     ls examples/");

