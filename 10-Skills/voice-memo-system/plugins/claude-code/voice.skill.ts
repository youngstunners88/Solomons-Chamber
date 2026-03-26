#!/usr/bin/env bun
/**
 * Claude Code Skill: Voice Memo System
 * 
 * Commands:
 * /voice capture [tag1,tag2] — Capture voice memo
 * /voice quick — Quick 1-min capture
 * /voice list — List recent memos
 * /voice search <query> — Search transcripts
 */

import { VoiceCaptureSystem } from "../../scripts/capture.ts";

interface ClaudeContext {
  vaultPath: string;
  notify: (msg: string) => void;
}

export default {
  name: "voice",
  
  async execute(command: string, args: string[], ctx: ClaudeContext) {
    switch (command) {
      case "capture": {
        const tags = args.join(" ").split(",").map(t => t.trim()).filter(Boolean);
        const system = new VoiceCaptureSystem({ tags, duration: 300 });
        await system.run();
        ctx.notify("✅ Voice memo captured and processed");
        return { success: true };
      }
      
      case "quick": {
        const system = new VoiceCaptureSystem({ duration: 60 });
        await system.run();
        ctx.notify("✅ Quick 1-minute memo captured");
        return { success: true };
      }
      
      case "list": {
        const { readdirSync } = await import("fs");
        const { join } = await import("path");
        const memosPath = join(ctx.vaultPath, "06-Media/Voice-Memos/Processed");
        
        const files = readdirSync(memosPath)
          .filter(f => f.endsWith(".md"))
          .sort()
          .reverse()
          .slice(0, 10);
        
        return {
          success: true,
          output: files.length > 0
            ? `Recent memos:\n${files.map(f => `- [[${f.replace(".md", "")}]]`).join("\n")}`
            : "No memos found. Create one with: /voice capture"
        };
      }
      
      case "search": {
        const query = args.join(" ");
        const { readdirSync, readFileSync } = await import("fs");
        const { join } = await import("path");
        const memosPath = join(ctx.vaultPath, "06-Media/Voice-Memos/Processed");
        
        const files = readdirSync(memosPath).filter(f => f.endsWith(".md"));
        const results = [];
        
        for (const file of files) {
          const content = readFileSync(join(memosPath, file), "utf-8");
          if (content.toLowerCase().includes(query.toLowerCase())) {
            results.push(`- [[${file.replace(".md", "")}]]`);
          }
        }
        
        return {
          success: true,
          output: results.length > 0
            ? `Search results for "${query}":\n${results.join("\n")}`
            : `No memos found containing "${query}"`
        };
      }
      
      default:
        return {
          success: false,
          output: `Unknown command: ${command}. Use: capture, quick, list, search`
        };
    }
  }
};