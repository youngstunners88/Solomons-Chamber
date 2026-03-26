#!/usr/bin/env bun
/**
 * Higgsfield Generate Skill
 * Primary interface for image/video generation
 * 
 * Usage:
 *   bun generate.ts image "sunset over city" --project trading
 *   bun generate.ts video --from-image path/to/img.jpg --duration 5
 *   bun generate.ts lipsync --audio path/to/voice.mp3 --image path/to/portrait.jpg
 */

interface GenerateOptions {
  type: "image" | "video" | "lipsync" | "cinema";
  prompt?: string;
  fromImage?: string;
  audio?: string;
  image?: string;
  duration?: number;
  project?: string;
  style?: string;
  tags?: string[];
}

class HiggsfieldSkill {
  private vaultPath: string;
  private apiKey: string;

  constructor() {
    this.vaultPath = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
    this.apiKey = process.env.HIGGSFIELD_API_KEY || "";
  }

  async runImage(prompt: string, options: Partial<GenerateOptions> = {}): Promise<void> {
    console.log(`🎨 Generating image: "${prompt.substring(0, 50)}..."`);
    
    // Queue the job
    const jobId = await this.queueJob("image", prompt, options);
    
    // Simulate generation (in real impl, call MuAPI)
    console.log(`   → Queued as job #${jobId}`);
    console.log(`   → Will save to: 12-Higgsfield-Studio/Image-Generation/${options.project || "general"}/`);
    console.log(`   ✓ Use 'bun 12-Higgsfield-Studio/routing/output-router.ts --process' to route when complete`);
  }

  async runVideo(options: GenerateOptions): Promise<void> {
    console.log(`🎬 Generating ${options.duration || 5}s video...`);
    
    if (options.fromImage) {
      console.log(`   → From image: ${options.fromImage}`);
    } else {
      console.log(`   → From prompt: "${options.prompt?.substring(0, 40)}..."`);
    }
    
    const jobId = await this.queueJob("video", options.prompt || "", options);
    console.log(`   → Queued as job #${jobId}`);
  }

  async runLipSync(options: GenerateOptions): Promise<void> {
    console.log(`🗣️ Creating lip-sync animation...`);
    
    if (!options.audio || !options.image) {
      console.error("❌ Required: --audio and --image");
      process.exit(1);
    }
    
    console.log(`   → Audio: ${options.audio}`);
    console.log(`   → Image: ${options.image}`);
    
    const jobId = await this.queueJob("lipsync", "Lip-sync portrait", options);
    console.log(`   → Queued as job #jobId`);
  }

  async runCinema(options: GenerateOptions): Promise<void> {
    console.log(`🎥 Cinema Studio mode...`);
    console.log(`   → Professional camera controls enabled`);
    console.log(`   → Aperture, focal length, lens adjustable`);
    
    const jobId = await this.queueJob("cinema", options.prompt || "", options);
    console.log(`   → Queued as job #jobId`);
  }

  private async queueJob(type: string, prompt: string, options: Partial<GenerateOptions>): Promise<string> {
    const id = `hf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Create queue entry
    const queuePath = `${this.vaultPath}/12-Higgsfield-Studio/Queue`;
    const jobFile = `${queuePath}/${id}.json`;
    
    await Bun.write(jobFile, JSON.stringify({
      id,
      type,
      prompt,
      options,
      status: "queued",
      createdAt: new Date().toISOString()
    }, null, 2));
    
    return id;
  }
}

// CLI parsing
const args = process.argv.slice(2);
const skill = new HiggsfieldSkill();

if (args.length === 0) {
  console.log("");
  console.log("🎨 Higgsfield Studio Skill");
  console.log("   AI Image & Video Generation for Solomons Chamber");
  console.log("");
  console.log("Usage:");
  console.log("  bun generate.ts image <prompt> [--project <name>] [--style <style>]");
  console.log("  bun generate.ts video --from-image <path> [--duration <seconds>]");
  console.log("  bun generate.ts video <prompt> [--duration <seconds>]");
  console.log("  bun generate.ts lipsync --audio <path> --image <path>");
  console.log("  bun generate.ts cinema <prompt> [--style cinematic...]");
  console.log("");
  console.log("Examples:");
  console.log('  bun generate.ts image "futuristic trading desk holographic charts" --project crypto --style cyberpunk');
  console.log('  bun generate.ts video --from-image 06-Media/Images/chart.jpg --duration 10');
  console.log('  bun generate.ts lipsync --audio 06-Media/Audio/memo.oga --image 04-Assets/portrait.jpg');
  console.log("");
  process.exit(0);
}

const [command, ...rest] = args;

// Parse flags
const flags: Record<string, string | undefined> = {};
let currentPrompt = "";

for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith("--")) {
    const key = rest[i].replace("--", "");
    flags[key] = rest[i + 1] || "true";
    i++;
  } else {
    currentPrompt += rest[i] + " ";
  }
}

const options: GenerateOptions = {
  type: command as GenerateOptions["type"],
  prompt: currentPrompt.trim() || undefined,
  fromImage: flags["from-image"],
  audio: flags["audio"],
  image: flags["image"],
  duration: flags["duration"] ? parseInt(flags["duration"]) : undefined,
  project: flags["project"],
  style: flags["style"],
  tags: flags["tags"]?.split(",")
};

// Execute
switch (command) {
  case "image":
    await skill.runImage(currentPrompt.trim(), options);
    break;
  case "video":
    await skill.runVideo(options);
    break;
  case "lipsync":
    await skill.runLipSync(options);
    break;
  case "cinema":
    await skill.runCinema(options);
    break;
  default:
    console.log(`❌ Unknown command: ${command}`);
    console.log("   Use: image, video, lipsync, or cinema");
    process.exit(1);
}
