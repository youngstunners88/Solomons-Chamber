#!/usr/bin/env bun
/**
 * Tag Voice Memos
 * Add or modify tags on existing memos
 * 
 * Usage: bun tag.ts <memo-name> <tag1,tag2,tag3>
 * Example: bun tag.ts "2024-03-26-memo" important,urgent
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || ".";
const PROCESSED_PATH = join(VAULT_PATH, "06-Media/Voice-Memos/Processed");
const TAGS_PATH = join(VAULT_PATH, "06-Media/Voice-Memos/tags");

function tagMemo(memoName: string, tags: string[]): void {
  if (!memoName || tags.length === 0) {
    console.log("Usage: bun tag.ts <memo-name> <tag1,tag2,tag3>");
    console.log("Example: bun tag.ts 2024-03-26-memo-123 important,meeting");
    process.exit(1);
  }
  
  const memoPath = join(PROCESSED_PATH, `${memoName}.md`);
  
  if (!existsSync(memoPath)) {
    console.error(`❌ Memo "${memoName}" not found`);
    console.log("\nRun: bun list.ts to see available memos");
    process.exit(1);
  }
  
  try {
    // Read existing content
    const content = readFileSync(memoPath, "utf-8");
    
    // Update tags in frontmatter
    const existingTags = content.match(/\*\*Tags:\*\* (.*)/)?.[1] || "none";
    const allTags = existingTags === "none" 
      ? tags 
      : [...new Set([...existingTags.split(", "), ...tags])];
    
    const updatedContent = content.replace(
      /\*\*Tags:\*\* .*/,
      `**Tags:** ${allTags.join(", ")}`
    );
    
    writeFileSync(memoPath, updatedContent);
    
    // Update tag index files
    for (const tag of tags) {
      const tagFile = join(TAGS_PATH, `${tag}.md`);
      
      if (!existsSync(tagFile)) {
        writeFileSync(tagFile, `# Tag: ${tag}\n\n## Memos\n\n`);
      }
      
      // Check if memo already in tag
      const tagContent = readFileSync(tagFile, "utf-8");
      if (!tagContent.includes(`[[${memoName}]]`)) {
        appendFileSync(tagFile, `- [[${memoName}]] — ${new Date().toLocaleDateString()}\n`);
      }
    }
    
    console.log(`✅ Tagged [[${memoName}]] with: ${tags.join(", ")}`);
    console.log(`\nAll tags: ${allTags.join(", ")}`);
    
  } catch (error) {
    console.error("❌ Failed to tag memo:", error);
    process.exit(1);
  }
}

const memoName = process.argv[2];
const tagsArg = process.argv[3];
const tags = tagsArg?.split(",").map(t => t.trim()).filter(Boolean) || [];

tagMemo(memoName, tags);