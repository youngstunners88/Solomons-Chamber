#!/usr/bin/env bun
/**
 * Daily Note Generator
 * Creates a formatted daily note in 05-Self-Notes/daily/
 * 
 * Usage: bun scripts/daily-note.ts [optional-title]
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || ".";
const DAILY_PATH = join(VAULT_PATH, "05-Self-Notes", "daily");

// Ensure directory exists
if (!existsSync(DAILY_PATH)) {
  mkdirSync(DAILY_PATH, { recursive: true });
}

const today = new Date();
const dateStr = today.toISOString().split("T")[0];
const weekday = today.toLocaleDateString("en-US", { weekday: "long" });

const title = process.argv[2] || `${weekday}'s Intentions`;
const filename = `${dateStr}-${title.toLowerCase().replace(/\s+/g, "-")}.md`;
const filepath = join(DAILY_PATH, filename);

const template = `---
date: ${dateStr}
day: ${weekday}
tags: [daily, intentions]
---

# ${title}

## 🎯 Today's Focus
- [ ] 

## 📝 Notes & Thoughts


## ✅ Wins (End of Day)


## 🔄 Tomorrow's Seeds


---
*Created: ${today.toISOString()}*
`;

writeFileSync(filepath, template);
console.log(`✅ Created: ${filepath}`);
