/**
 * core/state.ts
 * JSON-backed state store for Solomon's Chamber.
 * Persists to core/chamber-state.json — do not commit with sensitive data.
 *
 * CLI usage:
 *   bun core/state.ts status
 *   bun core/state.ts get
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  layer: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface StorychainLayerState {
  lastVisited: string | null;
  activeStories: number;
  totalContributions: number;
  url: string;
}

export interface HiggsFieldLayerState {
  queuedJobs: number;
  completedJobs: number;
  lastGeneration: string | null;
}

export interface VoiceLayerState {
  totalMemos: number;
  lastCapture: string | null;
  pendingTranscriptions: number;
}

export interface ProjectsLayerState {
  active: number;
  archived: number;
  lastUpdated: string | null;
}

export interface InboxLayerState {
  unprocessed: number;
  lastCapture: string | null;
}

export interface ChamberState {
  version: string;
  lastUpdated: string;
  session: {
    startedAt: string;
    commandsRun: number;
    activeLayer: string | null;
  };
  layers: {
    storychain: StorychainLayerState;
    higgsfield: HiggsFieldLayerState;
    voice: VoiceLayerState;
    projects: ProjectsLayerState;
    inbox: InboxLayerState;
  };
  recentActivity: ActivityEvent[];
}

// ---------------------------------------------------------------------------
// Default state factory
// ---------------------------------------------------------------------------

function defaultState(): ChamberState {
  const now = new Date().toISOString();
  return {
    version: "1.0.0",
    lastUpdated: now,
    session: {
      startedAt: now,
      commandsRun: 0,
      activeLayer: null,
    },
    layers: {
      storychain: {
        lastVisited: null,
        activeStories: 0,
        totalContributions: 0,
        url: "http://104.198.196.174:3000/",
      },
      higgsfield: {
        queuedJobs: 0,
        completedJobs: 0,
        lastGeneration: null,
      },
      voice: {
        totalMemos: 0,
        lastCapture: null,
        pendingTranscriptions: 0,
      },
      projects: {
        active: 2, // StoryChain + Wholesaling
        archived: 0,
        lastUpdated: now,
      },
      inbox: {
        unprocessed: 0,
        lastCapture: null,
      },
    },
    recentActivity: [],
  };
}

// ---------------------------------------------------------------------------
// StateStore class
// ---------------------------------------------------------------------------

const STATE_FILE = join(
  dirname(new URL(import.meta.url).pathname),
  "chamber-state.json"
);

const MAX_ACTIVITY = 50;

export class StateStore {
  private statePath: string;

  constructor(statePath = STATE_FILE) {
    this.statePath = statePath;
    this.ensureFile();
  }

  private ensureFile(): void {
    if (!existsSync(this.statePath)) {
      const dir = dirname(this.statePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.statePath, JSON.stringify(defaultState(), null, 2));
    }
  }

  /** Read and parse the current state from disk. */
  get(): ChamberState {
    try {
      const raw = readFileSync(this.statePath, "utf-8");
      return JSON.parse(raw) as ChamberState;
    } catch {
      const fresh = defaultState();
      this.write(fresh);
      return fresh;
    }
  }

  /** Write state to disk. */
  private write(state: ChamberState): void {
    writeFileSync(this.statePath, JSON.stringify(state, null, 2));
  }

  /**
   * Apply a shallow-merge patch to the current state.
   * Nested objects (session, layers) are also shallow-merged one level deep.
   */
  update(patch: Partial<ChamberState>): void {
    const current = this.get();
    const merged: ChamberState = {
      ...current,
      ...patch,
      session: { ...current.session, ...(patch.session ?? {}) },
      layers: { ...current.layers, ...(patch.layers ?? {}) },
      lastUpdated: new Date().toISOString(),
    };
    this.write(merged);
  }

  /**
   * Append an activity event to the recentActivity log (capped at MAX_ACTIVITY).
   */
  logActivity(event: ActivityEvent): void {
    const state = this.get();
    const activity = [event, ...state.recentActivity].slice(0, MAX_ACTIVITY);
    state.recentActivity = activity;
    state.lastUpdated = new Date().toISOString();
    this.write(state);
  }

  /**
   * Get the state object for a named layer key.
   */
  getLayerState(layer: string): unknown {
    const state = this.get();
    const layers = state.layers as Record<string, unknown>;
    return layers[layer] ?? null;
  }

  /**
   * Set (replace) the state object for a named layer key.
   */
  setLayerState(layer: string, layerState: unknown): void {
    const state = this.get();
    (state.layers as Record<string, unknown>)[layer] = layerState;
    state.lastUpdated = new Date().toISOString();
    this.write(state);
  }
}

// ---------------------------------------------------------------------------
// Pretty-print summary helper
// ---------------------------------------------------------------------------

function formatAge(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function printStatus(state: ChamberState): void {
  const { version, lastUpdated, session, layers, recentActivity } = state;

  console.log("\n  ╔══════════════════════════════════════════════╗");
  console.log("  ║         Solomon's Chamber — Status           ║");
  console.log("  ╚══════════════════════════════════════════════╝\n");

  console.log(`  Version      : ${version}`);
  console.log(`  Last Updated : ${formatAge(lastUpdated)} (${lastUpdated})`);
  console.log(`  Session Start: ${session.startedAt}`);
  console.log(`  Commands Run : ${session.commandsRun}`);
  console.log(`  Active Layer : ${session.activeLayer ?? "none"}`);

  console.log("\n  ── Layer States ─────────────────────────────────\n");

  const l = layers;

  console.log(`  Inbox`);
  console.log(`    Unprocessed  : ${l.inbox.unprocessed}`);
  console.log(`    Last Capture : ${formatAge(l.inbox.lastCapture)}`);

  console.log(`\n  Projects`);
  console.log(`    Active       : ${l.projects.active}`);
  console.log(`    Archived     : ${l.projects.archived}`);
  console.log(`    Last Updated : ${formatAge(l.projects.lastUpdated)}`);

  console.log(`\n  StoryChain`);
  console.log(`    URL          : ${l.storychain.url}`);
  console.log(`    Active Stories    : ${l.storychain.activeStories}`);
  console.log(`    Total Contributions: ${l.storychain.totalContributions}`);
  console.log(`    Last Visited : ${formatAge(l.storychain.lastVisited)}`);

  console.log(`\n  Higgsfield Studio`);
  console.log(`    Queued Jobs  : ${l.higgsfield.queuedJobs}`);
  console.log(`    Completed    : ${l.higgsfield.completedJobs}`);
  console.log(`    Last Gen     : ${formatAge(l.higgsfield.lastGeneration)}`);

  console.log(`\n  Voice Agent`);
  console.log(`    Total Memos  : ${l.voice.totalMemos}`);
  console.log(`    Pending Transcriptions: ${l.voice.pendingTranscriptions}`);
  console.log(`    Last Capture : ${formatAge(l.voice.lastCapture)}`);

  console.log("\n  ── Recent Activity ──────────────────────────────\n");

  if (recentActivity.length === 0) {
    console.log("  (no activity recorded yet)");
  } else {
    const recent = recentActivity.slice(0, 10);
    for (const ev of recent) {
      const ts = new Date(ev.timestamp).toLocaleTimeString();
      console.log(`  [${ts}] ${ev.layer.padEnd(18)} ${ev.type.padEnd(20)} ${ev.description}`);
    }
    if (recentActivity.length > 10) {
      console.log(`  ... and ${recentActivity.length - 10} more events`);
    }
  }

  console.log();
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const store = new StateStore();
  const command = Bun.argv[2];

  if (command === "status" || !command) {
    const state = store.get();
    printStatus(state);
  } else if (command === "get") {
    const state = store.get();
    console.log(JSON.stringify(state, null, 2));
  } else if (command === "reset") {
    const confirm = Bun.argv[3];
    if (confirm === "--yes") {
      import("fs").then(({ writeFileSync }) => {
        writeFileSync(STATE_FILE, JSON.stringify(defaultState(), null, 2));
        console.log("  State reset to defaults.");
      });
    } else {
      console.log("  Pass --yes to confirm reset: bun core/state.ts reset --yes");
    }
  } else {
    console.log(`
  Usage:
    bun core/state.ts status     — print pretty summary (default)
    bun core/state.ts get        — dump raw JSON
    bun core/state.ts reset --yes — reset to defaults
`);
  }
}
