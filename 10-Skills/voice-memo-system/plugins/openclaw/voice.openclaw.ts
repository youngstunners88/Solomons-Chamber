/**
 * OpenClaw Plugin: Voice Memo System
 * 
 * Install: Copy to ~/.openclaw/plugins/voice/
 * 
 * Commands:
 * $voice capture [tags] — Full capture
 * $voice quick — Quick 1-min
 * $voice list — Show recent
 * $voice search <keyword> — Search
 */

import { VoiceCaptureSystem } from "../../scripts/capture.ts";

export const voicePlugin = {
  name: "voice",
  version: "1.0.0",
  author: "kofi.zo.computer",
  
  commands: {
    capture: async (args: string[]) => {
      const tags = args.join(" ").split(",").map(t => t.trim()).filter(Boolean);
      const system = new VoiceCaptureSystem({ tags, duration: 300 });
      await system.run();
      return "✅ Voice memo captured";
    },
    
    quick: async () => {
      const system = new VoiceCaptureSystem({ duration: 60 });
      await system.run();
      return "✅ Quick capture complete";
    },
    
    list: async () => {
      const { readdirSync } = await import("fs");
      const { join } = await import("path");
      const vaultPath = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
      const memosPath = join(vaultPath, "06-Media/Voice-Memos/Processed");
      
      const files = readdirSync(memosPath)
        .filter(f => f.endsWith(".md"))
        .sort()
        .reverse()
        .slice(0, 10);
      
      return files.map(f => `- [[${f.replace(".md", "")}]]`).join("\n");
    },
    
    search: async (args: string[]) => {
      const query = args.join(" ");
      const { readdirSync, readFileSync } = await import("fs");
      const { join } = await import("path");
      const vaultPath = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
      const memosPath = join(vaultPath, "06-Media/Voice-Memos/Processed");
      
      const files = readdirSync(memosPath).filter(f => f.endsWith(".md"));
      const results = [];
      
      for (const file of files) {
        const content = readFileSync(join(memosPath, file), "utf-8");
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push(`- [[${file.replace(".md", "")}]]`);
        }
      }
      
      return results.length > 0
        ? `Results for "${query}":\n${results.join("\n")}`
        : `No memos found for "${query}"`;
    }
  }
};