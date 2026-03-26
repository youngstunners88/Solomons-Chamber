#!/usr/bin/env bun
/**
 * State Manager
 * Tracks generation jobs, quotas, and progress
 */

interface Job {
  id: string;
  type: "image" | "video" | "lipsync" | "cinema";
  prompt: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  outputPath?: string;
}

interface DailyStats {
  date: string;
  jobs: {
    total: number;
    completed: number;
    failed: number;
  };
  credits: {
    used: number;
    remaining: number;
  };
}

class StateManager {
  private dbPath: string;
  private jobs: Map<string, Job> = new Map();
  private stats: DailyStats;

  constructor(vaultPath: string) {
    this.dbPath = `${vaultPath}/12-Higgsfield-Studio/state/db.json`;
    this.stats = this.loadStats();
  }

  private loadStats(): DailyStats {
    const today = new Date().toISOString().split("T")[0];
    return {
      date: today,
      jobs: { total: 0, completed: 0, failed: 0 },
      credits: { used: 0, remaining: 1000 }
    };
  }

  addJob(type: Job["type"], prompt: string): string {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const job: Job = {
      id,
      type,
      prompt,
      status: "queued",
      createdAt: new Date()
    };
    this.jobs.set(id, job);
    this.stats.jobs.total++;
    return id;
  }

  updateJob(id: string, updates: Partial<Job>): void {
    const job = this.jobs.get(id);
    if (job) {
      Object.assign(job, updates);
      if (updates.status === "completed") {
        this.stats.jobs.completed++;
        job.completedAt = new Date();
      }
      if (updates.status === "failed") {
        this.stats.jobs.failed++;
      }
    }
  }

  async getDashboard(): Promise<string> {
    const active = Array.from(this.jobs.values()).filter(j => j.status === "processing").length;
    const queued = Array.from(this.jobs.values()).filter(j => j.status === "queued").length;
    
    return `
# Higgsfield Studio Dashboard

## Today's Activity (${this.stats.date})
| Metric | Value |
|--------|-------|
| Total Jobs | ${this.stats.jobs.total} |
| Completed | ${this.stats.jobs.completed} ✓ |
| Failed | ${this.stats.jobs.failed} ✗ |
| Active | ${active} 🔄 |
| Queued | ${queued} ⏳ |

## Credits
- Used: ${this.stats.credits.used}
- Remaining: ${this.stats.credits.remaining}

## Recent Activity
${Array.from(this.jobs.values())
  .slice(-5)
  .map(j => `- ${j.status === "completed" ? "✅" : j.status === "failed" ? "❌" : "🔄"} [${j.type}] ${j.prompt.substring(0, 40)}...`)
  .join("\n") || "No jobs yet today"}
`;
  }

  async printDashboard(): Promise<void> {
    console.log(await this.getDashboard());
  }
}

// CLI
const VAULT_PATH = process.env.VAULT_PATH || ".";
const manager = new StateManager(VAULT_PATH);
const args = process.argv.slice(2);

if (args.includes("--dashboard")) {
  await manager.printDashboard();
} else if (args.includes("--status")) {
  console.log(`📊 Active: ${Array.from(manager["jobs"].values()).filter(j => j.status === "processing").length}`);
  console.log(`⏳ Queued: ${Array.from(manager["jobs"].values()).filter(j => j.status === "queued").length}`);
} else {
  console.log("Usage: bun state-manager.ts [--dashboard|--status]");
}
