#!/usr/bin/env bun
/**
 * Voice Capture Script
 * Records audio, transcribes with Whisper, saves to vault
 * 
 * Usage: bun capture.ts [tags...] [--quick] [--duration=300]
 */

import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, writeFileSync, renameSync, appendFileSync } from "fs";
import { join, basename } from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
const VOICE_MEMOS_PATH = join(VAULT_PATH, "06-Media/Voice-Memos");
const WHISPER_CMD = process.env.WHISPER_CMD || "whisper";

interface CaptureConfig {
  duration: number;
  tags: string[];
  autoTranscribe: boolean;
  moveToDaily: boolean;
}

class VoiceCaptureSystem {
  private config: CaptureConfig;
  
  constructor(config: Partial<CaptureConfig> = {}) {
    this.config = {
      duration: config.duration || 300,
      tags: config.tags || [],
      autoTranscribe: config.autoTranscribe ?? true,
      moveToDaily: config.moveToDaily ?? true
    };
    this.ensureFolders();
  }

  private ensureFolders() {
    const folders = ["Inbox", "Processed", "Archived", "tags"];
    for (const folder of folders) {
      const path = join(VOICE_MEMOS_PATH, folder);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }
  }

  async capture(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `memo-${timestamp}.wav`;
    const inboxPath = join(VOICE_MEMOS_PATH, "Inbox", filename);
    
    console.log(`🎙️ Recording for ${this.config.duration}s... (Ctrl+C to stop)`);
    
    try {
      execSync(`rec -r 16000 -c 1 -b 16 "${inboxPath}" trim 0 ${this.config.duration}`, {
        timeout: (this.config.duration + 5) * 1000,
        stdio: "inherit"
      });
    } catch (e) {
      // Recording completed or interrupted
    }
    
    if (!existsSync(inboxPath)) {
      throw new Error("Recording failed — no file created");
    }
    
    console.log(`✅ Saved: ${basename(inboxPath)}`);
    return inboxPath;
  }

  async transcribe(audioPath: string): Promise<string> {
    const transcriptName = basename(audioPath).replace(".wav", ".md");
    const processedPath = join(VOICE_MEMOS_PATH, "Processed", transcriptName);
    
    try {
      // Run whisper and capture output
      const result = execSync(
        `${WHISPER_CMD} "${audioPath}" --model tiny --output_format txt --output_dir "${join(VOICE_MEMOS_PATH, "temp")}"`,
        { encoding: "utf-8", timeout: 60000 }
      );
      
      // Read the transcript
      const tempFile = join(VOICE_MEMOS_PATH, "temp", basename(audioPath).replace(".wav", ".txt"));
      const transcription = existsSync(tempFile) 
        ? Bun.file(tempFile).text() 
        : result;
      
      const content = `# Voice Memo — ${new Date().toLocaleString()}

**Tags:** ${this.config.tags.join(", ") || "none"}
**Source:** ${basename(audioPath)}

---

${transcription}

---

*Captured via Voice-Memo System*
`;
      
      writeFileSync(processedPath, content);
      
      // Cleanup temp
      if (existsSync(tempFile)) {
        execSync(`rm "${tempFile}" "${audioPath.replace(".wav", "*")}"`);
      }
      
      console.log(`📝 Transcribed: ${processedPath}`);
      return processedPath;
      
    } catch (error) {
      console.error("❌ Transcription failed:", error);
      return "";
    }
  }

  async addTags(transcriptPath: string): Promise<void> {
    if (this.config.tags.length === 0) return;
    
    const memoName = basename(transcriptPath, ".md");
    
    for (const tag of this.config.tags) {
      const tagPath = join(VOICE_MEMOS_PATH, "tags", `${tag}.md`);
      const link = `- [[${memoName}]] — ${new Date().toLocaleDateString()}\n`;
      
      if (!existsSync(tagPath)) {
        writeFileSync(tagPath, `# Tag: ${tag}\n\n## Memos\n\n`);
      }
      
      appendFileSync(tagPath, link);
    }
    
    console.log(`🏷️ Tagged: ${this.config.tags.join(", ")}`);
  }

  async archive(audioPath: string): Promise<void> {
    const filename = basename(audioPath);
    const archivePath = join(VOICE_MEMOS_PATH, "Archived", filename);
    
    renameSync(audioPath, archivePath);
    console.log(`📦 Archived to: ${archivePath}`);
  }

  async linkToDailyNote(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const dailyPath = join(VAULT_PATH, "05-Self-Notes/Daily", `${today}.md`);
    
    if (!existsSync(dailyPath)) {
      console.log("⚠️ No daily note — create one with: bun scripts/daily-note.ts");
      return;
    }
    
    const memoName = `memo-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const link = `\n- 🎙️ Voice: [[${memoName}]] — ${new Date().toLocaleTimeString()}\n`;
    
    appendFileSync(dailyPath, link);
    console.log(`🔗 Linked to daily note`);
  }

  async run(): Promise<void> {
    console.log("🎙️ Voice Capture Starting...\n");
    
    try {
      const audioPath = await this.capture();
      
      if (this.config.autoTranscribe) {
        const transcriptPath = await this.transcribe(audioPath);
        if (transcriptPath) {
          await this.addTags(transcriptPath);
        }
      }
      
      await this.archive(audioPath);
      
      if (this.config.moveToDaily) {
        await this.linkToDailyNote();
      }
      
      console.log("\n✅ Capture complete!");
      
    } catch (error) {
      console.error("❌ Capture failed:", error);
      process.exit(1);
    }
  }
}

// CLI
const args = process.argv.slice(2);
const tags = args.filter(a => !a.startsWith("--"));
const quick = args.includes("--quick");
const durationArg = args.find(a => a.startsWith("--duration="));
const duration = quick ? 60 : (durationArg ? parseInt(durationArg.split("=")[1]) : 300);

const system = new VoiceCaptureSystem({
  duration,
  tags,
  autoTranscribe: !args.includes("--no-transcribe"),
  moveToDaily: !args.includes("--no-daily")
});

system.run();

export { VoiceCaptureSystem };