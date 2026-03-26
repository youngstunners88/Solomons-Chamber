/**
 * Cursor Plugin: Voice Capture Integration
 * 
 * Install: Copy this to ~/.cursor/extensions/voice-capture/
 * Usage: @voice capture [tag1,tag2] - Records voice in Cursor
 *      : @voice quick - Quick 1-min capture
 *      : @voice list - Show recent memos
 */

interface CursorPlugin {
  name: string;
  version: string;
  commands: Map<string, Function>;
}

const VoiceCaptureCursor: CursorPlugin = {
  name: "voice-capture",
  version: "1.0.0",
  commands: new Map([
    ["capture", async (tags: string[]) => {
      const { VoiceCaptureSystem } = await import("../../scripts/voice/quick-capture.ts");
      const system = new VoiceCaptureSystem({ tags, duration: 300 });
      await system.run();
      return "✅ Voice captured and transcribed";
    }],
    
    ["quick", async () => {
      const { VoiceCaptureSystem } = await import("../../scripts/voice/quick-capture.ts");
      const system = new VoiceCaptureSystem({ duration: 60 });
      await system.run();
      return "✅ Quick capture complete";
    }],
    
    ["list", async () => {
      const { readdirSync } = await import("fs");
      const { join } = await import("path");
      const processed = readdirSync(join(process.env.VAULT_PATH || "", "06-Media/Voice-Memos/Processed"));
      return `Recent memos:
${processed.slice(-5).map(f => `- ${f.replace(".md", "")}`).join("\n")}`;
    }]
  ])
};

export default VoiceCaptureCursor;

/**
 * Commands:
 * @voice capture meeting,claude-code
 * @voice quick
 * @voice list
 */