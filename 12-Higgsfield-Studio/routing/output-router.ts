#!/usr/bin/env bun
/**
 * Output Router
 * Routes generated content to appropriate vault locations
 */

import { readdirSync, renameSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";

interface RouteConfig {
  type: "image" | "video" | "lipsync" | "cinema";
  project?: string;
  tags?: string[];
}

const VAULT_PATH = process.env.VAULT_PATH || "/home/workspace/Solomons-Chamber-V2";
const COMPLETED_PATH = join(VAULT_PATH, "12-Higgsfield-Studio/Completed");
const QUEUE_PATH = join(VAULT_PATH, "12-Higgsfield-Studio/Queue");

class OutputRouter {
  async processQueue(): Promise<void> {
    const items = readdirSync(QUEUE_PATH, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => ({ name: d.name, path: join(QUEUE_PATH, d.name) }));

    for (const item of items) {
      const config = await this.parseConfig(item.path);
      await this.route(item.name, item.path, config);
    }
  }

  private async parseConfig(filePath: string): Promise<RouteConfig> {
    const configPath = filePath + ".json";
    if (existsSync(configPath)) {
      const config = await Bun.file(configPath).json();
      return config as RouteConfig;
    }
    return { type: "image" };
  }

  private async route(filename: string, sourcePath: string, config: RouteConfig): Promise<void> {
    const date = new Date().toISOString().split("T")[0];
    const year = date.split("-")[0];
    
    let targetPath: string;

    switch (config.type) {
      case "image":
        targetPath = join(VAULT_PATH, "06-Media/Images", config.project || "general");
        break;
      case "video":
        targetPath = join(VAULT_PATH, "06-Media/Videos", config.project || "general");
        break;
      case "lipsync":
        targetPath = join(VAULT_PATH, "12-Higgsfield-Studio/Lip-Sync/Completed");
        break;
      case "cinema":
        targetPath = join(VAULT_PATH, "12-Higgsfield-Studio/Cinema-Studio/Completed");
        break;
      default:
        targetPath = join(VAULT_PATH, "07-Archive", year, "higgsfield-outputs");
    }

    if (!existsSync(targetPath)) {
      mkdirSync(targetPath, { recursive: true });
    }

    const targetFile = join(targetPath, `${date}-${filename}`);
    renameSync(sourcePath, targetFile);

    if (existsSync(sourcePath + ".json")) {
      renameSync(sourcePath + ".json", targetFile + ".json");
    }

    console.log(`✅ Routed: ${filename} → ${targetPath}`);
  }
}

// CLI
const args = process.argv.slice(2);
const router = new OutputRouter();

if (args.includes("--process")) {
  await router.processQueue();
} else {
  console.log("Usage: bun output-router.ts --process");
}
