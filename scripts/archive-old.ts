#!/usr/bin/env bun
/**
 * Archive Old Notes
 * Moves stale projects to archive folder
 */

import { Vault } from "./lib/vault.ts";

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function archiveOldNotes(daysThreshold: number = 90): Promise<void> {
  const vaultPath = process.env.VAULT_PATH || ".";
  const vault = new Vault(vaultPath);
  
  console.log(`📦 Archiving notes older than ${daysThreshold} days...\n`);
  
  const foldersToCheck = [
    "00-Inbox/",
    "01-Projects/active/"
  ];
  
  let archived = 0;
  
  for (const folder of foldersToCheck) {
    const notes = vault.readFolder(folder);
    
    for (const note of notes) {
      const created = note.metadata.created || note.metadata.date;
      if (!created) continue;
      
      const age = daysSince(created);
      
      if (age > daysThreshold) {
        console.log(`📦 ${note.filename} (${age} days old)`);
        // vault.moveNote(note.filename, folder, "06-Archive/");
        // Uncomment ↑ when ready to actually move
        archived++;
      }
    }
  }
  
  console.log(`\n✅ Found ${archived} notes to archive (dry run — no files moved)`);
  console.log("Run with --confirm to actually archive");
  
  if (process.argv.includes("--confirm")) {
    console.log("\n🚚 Moving files...");
    for (const folder of foldersToCheck) {
      const notes = vault.readFolder(folder);
      for (const note of notes) {
        const created = note.metadata.created || note.metadata.date;
        if (!created) continue;
        if (daysSince(created) > daysThreshold) {
          vault.moveNote(note.filename, folder, "06-Archive/");
          console.log(`  ✓ ${note.filename}`);
        }
      }
    }
  }
}

if (import.meta.main) {
  const days = parseInt(process.argv[2]) || 90;
  archiveOldNotes(days);
}