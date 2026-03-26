#!/usr/bin/env bun
/**
 * Daily Note Creator
 * Generates today's note with template
 */

import { Vault } from "./lib/vault.ts";

function getDailyTemplate(date: Date): string {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  
  return `# Daily Note: ${dateStr}

## 🎯 Today's Intentions

1. 
2. 
3. 

## 📝 Notes & Ideas

- 

## 🔗 Connections

Links to yesterday: [[Yesterday's Note]]

## ✅ Completed

- [ ] 

## 💭 Reflections

> What went well?
> 
> What could improve?

---
*Created: ${date.toISOString()}*
`;
}

async function createDailyNote(): Promise<void> {
  const vaultPath = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-Template";
  const vault = new Vault(vaultPath);
  const today = new Date();
  
  // Check if note already exists
  const existing = vault.readFolder("05-Self-Notes/daily/");
  const todayStr = today.toISOString().split("T")[0];
  const alreadyExists = existing.some(n => n.filename.startsWith(todayStr));
  
  if (alreadyExists) {
    console.log("Daily note already exists for today");
    return;
  }
  
  const content = getDailyTemplate(today);
  const path = vault.createNote("05-Self-Notes/daily/", `Daily-${todayStr}`, content);
  
  console.log(`✅ Created: ${path}`);
}

if (import.meta.main) {
  createDailyNote();
}