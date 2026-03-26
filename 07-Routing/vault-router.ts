#!/usr/bin/env bun
/**
 * Vault Router — Content Intelligence Layer
 * Auto-sorts content from Inbox to appropriate section
 * 
 * Usage: bun 07-Routing/vault-router.ts [--process] [--dry-run]
 */

import { readdirSync, statSync, renameSync, readFileSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
const INBOX_PATH = join(VAULT_PATH, "00-Inbox");

type Route = {
  pattern: RegExp;
  destination: string;
  reason: string;
};

// Routing rules
const ROUTES: Route[] = [
  {
    pattern: /\b(btc|eth|trading|signal|position|long|short|buy|sell)\b/i,
    destination: "03-Trading/",
    reason: "contains trading keywords"
  },
  {
    pattern: /\b(project|todo|task|milestone|deliverable)\b/i,
    destination: "01-Projects/active/",
    reason: "project-related content"
  },
  {
    pattern: /\b(research|article|paper|study|analysis)\b/i,
    destination: "02-Research/",
    reason: "research content"
  },
  {
    pattern: /\b(meeting|call|discussion|sync)\b/i,
    destination: "05-Self-Notes/",
    reason: "meeting notes"
  },
  {
    pattern: /\b(reflection|journal|thought|idea)\b/i,
    destination: "05-Self-Notes/",
    reason: "personal reflection"
  }
];

const args = process.argv.slice(2);
const doProcess = args.includes("--process");
const dryRun = args.includes("--dry-run");

console.log("🧭 Vault Router");
console.log("=".repeat(60));
console.log(`Inbox: ${INBOX_PATH}`);
console.log(`Mode: ${dryRun ? "DRY RUN" : doProcess ? "PROCESSING" : "ANALYZE ONLY"}`);
console.log();

// Read inbox
let files: string[] = [];
try {
  files = readdirSync(INBOX_PATH).filter(f => f.endsWith(".md"));
} catch (e) {
  console.log("📭 Inbox is empty or doesn't exist");
  process.exit(0);
}

if (files.length === 0) {
  console.log("📭 Inbox is empty");
  process.exit(0);
}

console.log(`Found ${files.length} item(s) to route:\n`);

let routed = 0;
let skipped = 0;

for (const filename of files) {
  const filepath = join(INBOX_PATH, filename);
  let content = "";
  
  try {
    content = readFileSync(filepath, "utf-8");
  } catch (e) {
    console.log(`⚠️ Could not read: ${filename}`);
    skipped++;
    continue;
  }
  
  // Find matching route
  let matchedRoute: Route | null = null;
  for (const route of ROUTES) {
    if (route.pattern.test(content)) {
      matchedRoute = route;
      break;
    }
  }
  
  if (matchedRoute) {
    const destPath = join(VAULT_PATH, matchedRoute.destination);
    const newPath = join(destPath, filename);
    
    console.log(`📄 ${filename}`);
    console.log(`   → ${matchedRoute.destination}`);
    console.log(`   💡 ${matchedRoute.reason}`);
    
    if (doProcess && !dryRun) {
      try {
        // Ensure destination exists
        const fs = await import("fs");
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        renameSync(filepath, newPath);
        console.log(`   ✅ Moved successfully`);
      } catch (e) {
        console.log(`   ❌ Error: ${e}`);
        skipped++;
        continue;
      }
    }
    
    routed++;
  } else {
    console.log(`📄 ${filename}`);
    console.log(`   ⚠️ No route matched—staying in Inbox`);
    skipped++;
  }
  console.log();
}

console.log("=".repeat(60));
console.log(`📊 Summary: ${routed} routed, ${skipped} stayed`);

if (!doProcess && !dryRun) {
  console.log("\n💡 To actually move files, run:");
  console.log("   bun 07-Routing/vault-router.ts --process");
}
