#!/usr/bin/env bun
/**
 * Voice Orchestrator
 * Main entry point for voice-controlled AI
 * 
 * Usage: bun voice-orchestrator.ts --listen
 *        bun voice-orchestrator.ts --capture
 *        bun voice-orchestrator.ts --query "what did I capture yesterday"
 */

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
const LOCALE = process.env.VOICE_LOCALE || "en";

interface VoiceCommand {
  intent: "capture" | "code" | "web" | "query" | "action";
  args: string[];
  confidence: number;
}

// Load voice commands for current locale
const loadLocale = async (locale: string) => {
  const file = await Bun.file(`${VAULT_PATH}/11-Voice-Agent/locales/voice-commands.json`).text();
  const data = JSON.parse(file);
  return data.languages[locale] || data.languages["en"];
};

// Parse transcribed voice into structured command
const parseVoice = (transcript: string, locale: any): VoiceCommand => {
  const text = transcript.toLowerCase();
  
  // Check each intent
  for (const [intent, phrases] of Object.entries(locale.voice_commands)) {
    for (const phrase of phrases as string[]) {
      if (text.includes(phrase.toLowerCase())) {
        // Extract args after the trigger phrase
        const triggerIndex = text.indexOf(phrase.toLowerCase());
        const args = text.slice(triggerIndex + phrase.length).trim().split(" ");
        return {
          intent: intent as VoiceCommand["intent"],
          args: args.filter(a => a.length > 0),
          confidence: 0.85
        };
      }
    }
  }
  
  // Default: treat as capture
  return { intent: "capture", args: [transcript], confidence: 0.5 };
};

// Execute parsed command
const executeCommand = async (cmd: VoiceCommand): Promise<string> => {
  const timestamp = new Date().toISOString();
  
  switch (cmd.intent) {
    case "capture": {
      const captureFile = `${VAULT_PATH}/06-Media/Voice-Memos/Inbox/voice-${timestamp}.md`;
      const content = `---\ndate: ${timestamp}\ntype: voice-capture\nintent: ${cmd.intent}\nconfidence: ${cmd.confidence}\n---\n\n${cmd.args.join(" ")}\n`;
      await Bun.write(captureFile, content);
      return `✅ Captured to ${captureFile}`;
    }
    
    case "code": {
      const codeRequest = cmd.args.join(" ");
      const codeFile = `${VAULT_PATH}/00-Inbox/code-request-${timestamp}.md`;
      const content = `---\ndate: ${timestamp}\ntype: code-request\nlanguage: auto-detect\n---\n\n## Request\n${codeRequest}\n\n## Status\n⏳ Pending - Run \`bun scripts/skills/voice-to-code.ts\` to generate\n`;
      await Bun.write(codeFile, content);
      return `📝 Code request saved. Run: bun scripts/skills/voice-to-code.ts "${codeRequest}"`;
    }
    
    case "web": {
      const url = cmd.args.find(a => a.includes(".")) || cmd.args.join("-");
      const webFile = `${VAULT_PATH}/00-Inbox/web-request-${timestamp}.md`;
      const content = `---\ndate: ${timestamp}\ntype: web-request\nurl: ${url}\n---\n\n## Request\n${cmd.args.join(" ")}\n\n## Status\n⏳ Pending - Run \`bun scripts/skills/voice-to-web.ts\`\n`;
      await Bun.write(webFile, content);
      return `🌐 Web request saved. Run: bun scripts/skills/voice-to-web.ts "${url}"`;
    }
    
    case "query": {
      // Search vault for matching content
      const { execSync } = await import("child_process");
      try {
        const searchTerm = cmd.args.join(" ");
        const results = execSync(
          `cd ${VAULT_PATH} && grep -r "${searchTerm}" --include="*.md" 2>/dev/null | head -5 || echo "No results"`,
          { encoding: "utf-8" }
        );
        return `🔍 Query results:\n${results}`;
      } catch {
        return "❌ Query failed - check vault path";
      }
    }
    
    default:
      return `⚠️ Unknown intent: ${cmd.intent}`;
  }
};

// Main entry
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log("🎙️ Voice Orchestrator");
  console.log(`🌍 Locale: ${LOCALE}`);
  console.log(`📂 Vault: ${VAULT_PATH}`);
  console.log();
  
  const locale = await loadLocale(LOCALE);
  
  if (command === "--listen" || command === "-l") {
    console.log("🎤 Listening... (simulated - connect microphone to enable)");
    console.log("   Say something like: \"Capture this idea about Bitcoin\"");
    console.log("   Or: \"Write code for a trading bot\"");
    console.log();
    console.log("   To actually use voice:");
    console.log("   1. Install: sox (audio) + whisper (transcription)");
    console.log("   2. Run: bun run scripts/capture.ts");
    console.log();
    console.log(`   Available in your language (${LOCALE}):`);
    console.log("   " + Object.entries(locale.voice_commands).map(([k, v]) => `${k}: "${(v as string[])[0]}"`).join(" | "));
  } else if (command === "--capture") {
    const transcript = args.slice(1).join(" ") || "Sample capture from voice orchestrator";
    const parsed = parseVoice(transcript, locale);
    const result = await executeCommand(parsed);
    console.log(result);
  } else if (command === "--query" || command === "-q") {
    const parsed: VoiceCommand = { intent: "query", args: args.slice(1), confidence: 1.0 };
    const result = await executeCommand(parsed);
    console.log(result);
  } else {
    console.log("Usage:");
    console.log("  voice-orchestrator.ts --listen     # Show voice help");
    console.log("  voice-orchestrator.ts --capture    # Simulate a capture");
    console.log("  voice-orchestrator.ts --query      # Search vault");
  }
};

main().catch(console.error);
