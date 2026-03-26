#!/usr/bin/env bun
/**
 * Queue Manager
 * View and manage generation jobs
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const VAULT_PATH = process.env.VAULT_PATH || ".";
const QUEUE_PATH = join(VAULT_PATH, "12-Higgsfield-Studio/Queue");

interface Job {
  id: string;
  type: string;
  prompt: string;
  status: string;
  createdAt: string;
}

function listQueue(): Job[] {
  try {
    return readdirSync(QUEUE_PATH, { withFileTypes: true })
      .filter(d => d.isFile() && d.name.endsWith(".json"))
      .map(d => {
        const content = readFileSync(join(QUEUE_PATH, d.name), "utf-8");
        return JSON.parse(content) as Job;
      });
  } catch {
    return [];
  }
}

function printStatus(): void {
  const jobs = listQueue();
  const counts = {
    queued: jobs.filter(j => j.status === "queued").length,
    processing: jobs.filter(j => j.status === "processing").length,
    completed: jobs.filter(j => j.status === "completed").length,
    failed: jobs.filter(j => j.status === "failed").length
  };

  console.log("\n# Queue Status\n");
  console.log(`| Status | Count |`);
  console.log(`|--------|-------|`);
  console.log(`| ⏳ Queued | ${counts.queued} |`);
  console.log(`| 🔄 Processing | ${counts.processing} |`);
  console.log(`| ✅ Completed | ${counts.completed} |`);
  console.log(`| ❌ Failed | ${counts.failed} |`);
  console.log(`| **Total** | **${jobs.length}** |\n`);

  if (jobs.length > 0) {
    console.log("## Recent Jobs\n");
    jobs.slice(0, 5).forEach(j => {
      console.log(`- [${j.status.toUpperCase()}] ${j.type}: ${j.prompt?.substring(0, 50) || "N/A"}...`);
    });
    console.log("");
  }
}

function printList(): void {
  const jobs = listQueue();
  
  if (jobs.length === 0) {
    console.log("Queue is empty.");
    return;
  }

  console.log("\n# All Jobs\n");
  jobs.forEach(j => {
    console.log(`\n## ${j.id}`);
    console.log(`- Type: ${j.type}`);
    console.log(`- Status: ${j.status}`);
    console.log(`- Prompt: ${j.prompt?.substring(0, 100) || "N/A"}...`);
    console.log(`- Created: ${j.createdAt}`);
  });
}

// CLI
const args = process.argv.slice(2);

if (args.includes("--status")) {
  printStatus();
} else if (args.includes("--list")) {
  printList();
} else {
  console.log("Usage: bun queue-manager.ts [--status|--list]");
  printStatus();
}
