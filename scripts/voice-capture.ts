#!/usr/bin/env bun
/**
 * Voice Capture Script
 * Records audio and saves to vault
 * 
 * Usage: bun scripts/voice-capture.ts [tags] [--quick]
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || ".";
const AUDIO_PATH = join(VAULT_PATH, "06-Media", "Audio", "Voice-Memos", "Inbox");

// Ensure directory exists
if (!existsSync(AUDIO_PATH)) {
  mkdirSync(AUDIO_PATH, { recursive: true });
}

const args = process.argv.slice(2);
const isQuick = args.includes("--quick");
const tags = args.filter(a => !a.startsWith("--")).join(",");

const duration = isQuick ? 60 : 300; // 1 min quick, 5 min full
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filename = `voice-memo-${timestamp}.md`;
const filepath = join(AUDIO_PATH, filename);

const content = `---
type: voice-memo
date: ${new Date().toISOString()}
duration: ${duration}s
tags: [${tags || "uncategorized"}]
status: inbox
---

# Voice Memo ${timestamp}

**Duration:** ${duration} seconds  
**Tags:** ${tags || "none"}

## Transcript
[To be transcribed via Whisper]

## Notes


## Action Items
- [ ] 

---
*Captured: ${new Date().toISOString()}*
`;

writeFileSync(filepath, content);
console.log(`🎙️ Voice memo created: ${filepath}`);
console.log(`   Duration: ${duration}s | Tags: ${tags || "none"}`);
console.log("\n💡 Next steps:");
console.log("   bun 10-Skills/voice-memo-system/scripts/process.ts");
