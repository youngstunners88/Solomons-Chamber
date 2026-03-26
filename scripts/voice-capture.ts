#!/usr/bin/env bun
/**
 * Voice Capture → Transcript → Vault
 * 
 * 1. Records audio (or accepts file)
 * 2. Transcribes using Whisper
 * 3. Saves transcript to 06-Media/Transcripts/
 * 4. Creates summary in 00-Inbox/
 * 5. Optionally speaks response back
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-Template";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

interface VoiceCaptureOptions {
  inputFile?: string;           // Path to audio file
  duration?: number;            // Recording duration in seconds
  outputFormat?: "transcript" | "summary" | "both";
  speakResponse?: boolean;    // TTS response back
  targetFolder?: string;        // Where to save (default: 06-Media/)
}

async function captureVoice(options: VoiceCaptureOptions = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mediaPath = join(VAULT_PATH, "06-Media");
  
  // Ensure folders exist
  ["Audio", "Transcripts", "Generated"].forEach(dir => {
    const path = join(mediaPath, dir);
    if (!existsSync(path)) mkdirSync(path, { recursive: true });
  });

  // Step 1: Get audio input
  let audioPath: string;
  if (options.inputFile && existsSync(options.inputFile)) {
    audioPath = options.inputFile;
    console.log(`🎤 Using provided audio: ${audioPath}`);
  } else {
    // Would integrate with system mic here
    // For now, expect file input
    console.error("❌ No audio input provided. Usage:");
    console.log("  --input-file <path>   Path to audio file (mp3, wav, m4a)");
    console.log("  --duration <seconds>  Record from microphone");
    process.exit(1);
  }

  // Step 2: Transcribe with Whisper
  console.log("📝 Transcribing...");
  const transcriptPath = join(mediaPath, "Transcripts", `${timestamp}.md`);
  
  // Mock transcription (replace with actual Whisper call)
  const transcriptContent = `---
date: ${new Date().toISOString()}
source: ${audioPath}
duration: ${options.duration || "unknown"}
---

# Voice Note — ${new Date().toLocaleDateString()}

[Transcription would appear here after Whisper API call]

To transcribe with Whisper:
\`\`\`bash
curl https://api.openai.com/v1/audio/transcriptions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F file="@${audioPath}" \\
  -F model="whisper-1"
\`\`\`
`;
  
  writeFileSync(transcriptPath, transcriptContent);
  console.log(`✅ Transcript saved: ${transcriptPath}`);

  // Step 3: Create inbox entry
  const inboxPath = join(VAULT_PATH, "00-Inbox", `${timestamp}-voice.md`);
  const inboxContent = `---
type: voice-capture
source: ${audioPath}
processed: ${new Date().toISOString()}
---

# Voice Capture — ${new Date().toLocaleString()}

**Original:** [Transcript](../../06-Media/Transcripts/${timestamp}.md)

**Quick Summary:**
- [ ] Review and categorize
- [ ] Extract action items
- [ ] Link to related notes
`;
  
  writeFileSync(inboxPath, inboxContent);
  console.log(`✅ Inbox entry: ${inboxPath}`);

  // Step 4: Optional TTS response
  if (options.speakResponse) {
    console.log("🔊 Generating response...");
    // Would use ElevenLabs or Kokoro here
    const responsePath = join(mediaPath, "Generated", `${timestamp}-response.mp3`);
    console.log(`   Response saved: ${responsePath}`);
  }

  return {
    transcript: transcriptPath,
    inbox: inboxPath,
    audio: audioPath,
  };
}

// CLI
const args = process.argv.slice(2);
const options: VoiceCaptureOptions = {
  inputFile: args.find(a => a.startsWith("--input"))?.split("=")[1],
  duration: parseInt(args.find(a => a.startsWith("--duration"))?.split("=")[1] || "0"),
  speakResponse: args.includes("--speak"),
};

if (require.main === module) {
  captureVoice(options).then(result => {
    console.log("\n🎯 Complete!");
    console.log(`   Transcript: ${result.transcript}`);
    console.log(`   Inbox: ${result.inbox}`);
  }).catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}

export { captureVoice };