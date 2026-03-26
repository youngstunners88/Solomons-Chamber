/**
 * Cursor Plugin: Voice Memo Integration
 * 
 * Commands:
 * @voice capture [tags] — Start recording
 * @voice quick — 1-minute quick capture
 * @voice list — Show recent memos
 * @voice search <query> — Search transcripts
 */

interface CursorPluginAPI {
  registerCommand: (name: string, handler: Function) => void;
  notify: (message: string) => void;
}

export function activate(context: CursorPluginAPI) {
  // @voice capture
  context.registerCommand("voice.capture", async (tags?: string) => {
    const { VoiceCaptureSystem } = await import("../../scripts/capture.ts");
    const tagList = tags ? tags.split(",").map(t => t.trim()) : [];
    const system = new VoiceCaptureSystem({ tags: tagList, duration: 300 });
    await system.run();
    context.notify("✅ Voice memo captured");
  });

  // @voice quick
  context.registerCommand("voice.quick", async () => {
    const { VoiceCaptureSystem } = await import("../../scripts/capture.ts");
    const system = new VoiceCaptureSystem({ duration: 60 });
    await system.run();
    context.notify("✅ Quick capture complete");
  });

  // @voice list
  context.registerCommand("voice.list", async () => {
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
  });

  // @voice search
  context.registerCommand("voice.search", async (query: string) => {
    // Simple search implementation
    const { readdirSync, readFileSync } = await import("fs");
    const { join } = await import("path");
    const vaultPath = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
    const memosPath = join(vaultPath, "06-Media/Voice-Memos/Processed");
    
    const files = readdirSync(memosPath).filter(f => f.endsWith(".md"));
    const results = [];
    
    for (const file of files) {
      const content = readFileSync(join(memosPath, file), "utf-8");
      if (content.toLowerCase().includes(query.toLowerCase())) {
        results.push(`- [[${file.replace(".md", "")}]] — match found`);
      }
    }
    
    return results.length > 0 
      ? `Search results for "${query}":\n${results.join("\n")}`
      : `No results for "${query}"`;
  });
}

export const pluginInfo = {
  name: "voice-memo-system",
  version: "1.0.0",
  description: "Voice memo capture and transcription for Cursor",
  author: "kofi.zo.computer"
};