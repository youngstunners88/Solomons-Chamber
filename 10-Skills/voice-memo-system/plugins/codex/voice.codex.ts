/**
 * Codex CLI Plugin: Voice Memo System
 * 
 * Installation:
 * 1. Copy to ~/.codex/skills/voice/
 * 2. Add to codex.json: { "skills": ["voice"] }
 * 
 * Usage:
 * $voice capture meeting,ideas
 * $voice quick
 * $voice list
 * $voice search "claude code"
 */

import { VoiceCaptureSystem } from "../../scripts/capture.ts";

interface CodexAPI {
  run: (command: string, args: string[]) => Promise<string>;
  notify: (message: string) => void;
}

export default function activate(api: CodexAPI) {
  api.run("voice", async (args: string[]) => {
    const subcommand = args[0] || "capture";
    const restArgs = args.slice(1);
    
    switch (subcommand) {
      case "capture": {
        const tags = restArgs.join(" ").split(",").map(t => t.trim()).filter(Boolean);
        const system = new VoiceCaptureSystem({ tags, duration: 300 });
        await system.run();
        api.notify("✅ Voice memo captured");
        return "Captured and transcribed";
      }
      
      case "quick": {
        const system = new VoiceCaptureSystem({ duration: 60 });
        await system.run();
        api.notify("✅ Quick memo captured");
        return "Quick capture complete";
      }
      
      case "list": {
        const { readdirSync } = await import("fs");
        const { join } = await import("path");
        const vaultPath = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
        const memosPath = join(vaultPath, "06-Media/Voice-Memos/Processed");
        
        const files = readdirSync(memosPath)
          .filter(f => f.endsWith(".md"))
          .sort()
          .reverse()
          .slice(0, 10);
        
        return files.map(f => `- ${f.replace(".md", "")}`).join("\n") || "No memos yet";
      }
      
      case "search": {
        const query = restArgs.join(" ");
        const { readdirSync, readFileSync } = await import("fs");
        const { join } = await import("path");
        const vaultPath = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
        const memosPath = join(vaultPath, "06-Media/Voice-Memos/Processed");
        
        const files = readdirSync(memosPath).filter(f => f.endsWith(".md"));
        const results = [];
        
        for (const file of files) {
          const content = readFileSync(join(memosPath, file), "utf-8");
          if (content.toLowerCase().includes(query.toLowerCase())) {
            results.push(`- ${file.replace(".md", "")}`);
          }
        }
        
        return results.length > 0
          ? `Found:\n${results.join("\n")}`
          : `No memos found for "${query}"`;
      }
      
      default:
        return `Unknown command: ${subcommand}. Try: capture, quick, list, search`;
    }
  });
}