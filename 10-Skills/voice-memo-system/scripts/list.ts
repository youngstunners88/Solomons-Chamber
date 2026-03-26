#!/usr/bin/env bun
/**
 * List Voice Memos
 * Shows recent transcribed memos
 * 
 * Usage: bun list.ts [--limit=10] [--sort=date|name]
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || ".";
const PROCESSED_PATH = join(VAULT_PATH, "06-Media/Voice-Memos/Processed");

function listMemos(limit: number = 10): void {
  try {
    const files = readdirSync(PROCESSED_PATH)
      .filter(f => f.endsWith(".md"))
      .map(f => {
        const stat = { mtime: { getTime: () => 0 } };
        try {
          const { statSync } = require("fs");
          const s = statSync(join(PROCESSED_PATH, f));
          return { name: f, mtime: s.mtime.getTime() };
        } catch {
          return { name: f, mtime: 0 };
        }
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);
    
    if (files.length === 0) {
      console.log("📭 No memos found yet.");
      console.log("Run: bun capture.ts to create your first memo");
      return;
    }
    
    console.log("🎙️ Recent Voice Memos:\n");
    console.log("-".repeat(60));
    
    files.forEach((file, i) => {
      const content = readFileSync(join(PROCESSED_PATH, file.name), "utf-8");
      const preview = content.split("\n\n---\n\n")[1]?.substring(0, 60)?.trim() || "...";
      const tags = content.match(/\*\*Tags:\*\* (.*)/)?.[1] || "none";
      
      console.log(`${i + 1}. [[${file.name.replace(".md", "")}]]`);
      console.log(`   Tags: ${tags}`);
      console.log(`   Preview: "${preview}..."`);
      console.log();
    });
    
    console.log("-".repeat(60));
    console.log(`\nTotal memos: ${readdirSync(PROCESSED_PATH).filter(f => f.endsWith(".md")).length}`);
    console.log("\nCommands:");
    console.log("  bun capture.ts              — Create new memo");
    console.log("  bun search.ts <query>       — Search memos");
    console.log("  bun tag.ts <memo> <tags>    — Add tags");
    
  } catch (error) {
    console.error("❌ Error listing memos:", error);
    process.exit(1);
  }
}

const limit = parseInt(process.argv.find(a => a.startsWith("--limit="))?.split("=")[1] || "10");
listMemos(limit);