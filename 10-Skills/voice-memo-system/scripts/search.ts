#!/usr/bin/env bun
/**
 * Search Voice Memos
 * Full-text search through transcripts
 * 
 * Usage: bun search.ts <query> [--case-sensitive]
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
const PROCESSED_PATH = join(VAULT_PATH, "06-Media/Voice-Memos/Processed");

function searchMemos(query: string, caseSensitive: boolean = false): void {
  if (!query) {
    console.log("Usage: bun search.ts <search-query>");
    console.log("Example: bun search.ts 'meeting with claude'");
    process.exit(1);
  }
  
  try {
    const files = readdirSync(PROCESSED_PATH).filter(f => f.endsWith(".md"));
    
    const results = [];
    
    for (const file of files) {
      const content = readFileSync(join(PROCESSED_PATH, file), "utf-8");
      const searchContent = caseSensitive ? content : content.toLowerCase();
      const searchQuery = caseSensitive ? query : query.toLowerCase();
      
      if (searchContent.includes(searchQuery)) {
        // Find context around match
        const lines = content.split("\n");
        let matchLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = caseSensitive ? lines[i] : lines[i].toLowerCase();
          if (line.includes(searchQuery)) {
            matchLine = i;
            break;
          }
        }
        
        // Get context (2 lines before and after)
        const contextStart = Math.max(0, matchLine - 2);
        const contextEnd = Math.min(lines.length, matchLine + 3);
        const context = lines.slice(contextStart, contextEnd).join("\n");
        
        // Extract timestamp from frontmatter
        const timestamp = content.match(/Voice Memo — (.+)/)?.[1] || "unknown";
        
        results.push({
          file: file.replace(".md", ""),
          timestamp,
          context: context.replace(/^#+\s+/, "").trim().substring(0, 200)
        });
      }
    }
    
    if (results.length === 0) {
      console.log(`🔍 No memos found matching "${query}"`);
      console.log("\nTips:");
      console.log("• Try broader search terms");
      console.log("• Check for typos");
      console.log("• Use bun list.ts to see all memos");
      return;
    }
    
    console.log(`🎯 Found ${results.length} memo${results.length === 1 ? "" : "s"} matching "${query}":\n`);
    console.log("=".repeat(70));
    
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. [[${result.file}]] — ${result.timestamp}`);
      console.log("-".repeat(70));
      console.log(result.context);
      console.log("-".repeat(70));
    });
    
    console.log(`\n✅ Search complete — ${results.length} result${results.length === 1 ? "" : "s"}`);
    
  } catch (error) {
    console.error("❌ Search failed:", error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const query = args.filter(a => !a.startsWith("--")).join(" ");
const caseSensitive = args.includes("--case-sensitive");

searchMemos(query, caseSensitive);