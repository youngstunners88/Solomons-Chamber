#!/usr/bin/env bun
/**
 * Quick Voice Capture
 * One command: record → transcribe → tag → archive
 * 
 * Usage: bun scripts/voice/quick-capture.ts [tag1,tag2,...]
 * 
 * Integrates with: Cursor, Claude Code, OpenClaw, Codex
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, renameSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || ".";
const VOICE_MEMOS_PATH = join(VAULT_PATH, "06-Media/Voice-Memos");

interface CaptureConfig {
  duration: number; // seconds
  tags: string[];
  autoTranscribe: boolean;
  moveToDaily: boolean;
}

class VoiceCaptureSystem {
  private config: CaptureConfig;
  
  constructor(config: Partial<CaptureConfig> = {}) {
    this.config = {
      duration: config.duration || 300, // 5 min default
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
    
    console.log("🎙️ Recording... (press Ctrl+C to stop early)");
    
    // Record audio using available tool
    try {
      execSync(`rec -r 16000 -c 1 -b 16 "${inboxPath}"`, {
        timeout: this.config.duration * 1000,
        stdio: "inherit"
      });
    } catch {
      // User interrupted or timeout
    }
    
    console.log(`✅ Saved: ${inboxPath}`);
    return inboxPath;
  }

  async transcribe(audioPath: string): Promise<string> {
    const transcriptName = audioPath.replace(".wav", ".md").replace("/Inbox/", "/Processed/");
    
    // Use whisper.cpp or whisper CLI
    const whisperCmd = process.env.WHISPER_CMD || "whisper";
    
    try {
      const result = execSync(`${whisperCmd} "${audioPath}" --model tiny --output_format txt --output_dir "${join(VOICE_MEMOS_PATH, "Processed")}"`, {
        encoding: "utf-8"
      });
      
      const transcript = `# Voice Memo — ${new Date().toLocaleString()}

**Tags:** ${this.config.tags.join(", ") || "none"}
**Source:** ${audioPath.split("/").pop()}

---

${result}

---

*Captured via Quick Voice Capture*
`;
      
      writeFileSync(transcriptName, transcript);
      console.log(`📝 Transcribed: ${transcriptName}`);
      
      return transcriptName;
    } catch (error) {
      console.error("❌ Transcription failed:", error);
      return "";
    }
  }

  async addTags(transcriptPath: string): Promise<void> {
    if (this.config.tags.length === 0) return;
    
    for (const tag of this.config.tags) {
      const tagPath = join(VOICE_MEMOS_PATH, "tags", `${tag}.md`);
      const link = `- [[${transcriptPath.split("/").pop()?.replace(".md", "")}]]\n`;
      
      if (!existsSync(tagPath)) {
        writeFileSync(tagPath, `# Tag: ${tag}\n\n## Memos\n\n`);
      }
      
      // Append link to tag file
      const fs = await import("fs");
      fs.appendFileSync(tagPath, link);
    }
    
    console.log(`🏷️ Tagged: ${this.config.tags.join(", ")}`);
  }

  async archive(audioPath: string): Promise<void> {
    const filename = audioPath.split("/").pop();
    const archivePath = join(VOICE_MEMOS_PATH, "Archived", filename!);
    
    renameSync(audioPath, archivePath);
    console.log(`📦 Archived: ${archivePath}`);
  }

  async run(): Promise<void> {
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
    
    console.log("✅ Capture complete!");
  }

  private async linkToDailyNote(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const dailyPath = join(VAULT_PATH, "05-Self-Notes/Daily", `${today}.md`);
    
    if (!existsSync(dailyPath)) {
      console.log("⚠️ No daily note found — create one with: bun scripts/daily-note.ts");
      return;
    }
    
    const fs = await import("fs");
    const link = `\n- 📹 [[Voice Memo]] — captured at ${new Date().toLocaleTimeString()}\n`;
    fs.appendFileSync(dailyPath, link);
    console.log(`🔗 Linked to daily note: ${dailyPath}`);
  }
}

// Parse command line args
const tags = process.argv.slice(2).filter(arg => !arg.startsWith("--"));
const duration = parseInt(process.argv.find(arg => arg.startsWith("--duration="))?.split("=")[1] || "300");
const noTranscribe = process.argv.includes("--no-transcribe");

const system = new VoiceCaptureSystem({
  duration,
  tags,
  autoTranscribe: !noTranscribe,
  moveToDaily: true
});

system.run().catch(console.error);

export { VoiceCaptureSystem };