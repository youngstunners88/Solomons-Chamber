/**
 * core/layers.ts
 * Registry of all vault layers as typed objects.
 * Includes all 12 standard layers plus the StoryChain integration entry.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VaultLayer {
  /** Short unique identifier, e.g. "00-inbox" */
  id: string;
  /** Human-readable name */
  name: string;
  /** Emoji icon for display */
  emoji: string;
  /** One-line description */
  description: string;
  /** Path relative to vault root */
  path: string;
  /** What this layer can do */
  capabilities: string[];
  /** Whether this is an external integration vs a local layer */
  external?: boolean;
  /** External URL if applicable */
  url?: string;
}

// ---------------------------------------------------------------------------
// Layer registry
// ---------------------------------------------------------------------------

export const LAYERS: VaultLayer[] = [
  {
    id: "00-inbox",
    name: "Inbox",
    emoji: "📥",
    description: "Universal capture — everything enters here first before being processed and filed.",
    path: "00-Inbox/",
    capabilities: [
      "Quick capture of notes, links, and ideas",
      "Triage and routing to appropriate layers",
      "Timestamped item creation",
      "Tag-based sorting",
    ],
  },
  {
    id: "01-projects",
    name: "Projects",
    emoji: "🗂️",
    description: "Active and archived project workspaces with structured documentation and task tracking.",
    path: "01-Projects/",
    capabilities: [
      "Project workspace creation",
      "Status tracking (active/archived)",
      "Task and milestone logging",
      "Integration with external repos",
    ],
  },
  {
    id: "02-research",
    name: "Research",
    emoji: "🔬",
    description: "Topic-based knowledge storage — summaries, source notes, and synthesized insights.",
    path: "02-Research/",
    capabilities: [
      "Topic index pages",
      "Source annotation",
      "Reading notes",
      "Literature synthesis",
      "RSS and web ingestion",
    ],
  },
  {
    id: "03-trading",
    name: "Trading",
    emoji: "📈",
    description: "Signals, open positions, market analysis, and trade logs organized by date and instrument.",
    path: "03-Trading/",
    capabilities: [
      "Trade signal logging",
      "Position tracking",
      "Market analysis notes",
      "Performance journaling",
      "Strategy documentation",
    ],
  },
  {
    id: "04-assets",
    name: "Assets",
    emoji: "🧰",
    description: "Reusable skills, prompt templates, API adapters, and workflow components.",
    path: "04-Assets/",
    capabilities: [
      "Prompt template library",
      "Reusable code snippets",
      "API adapter definitions",
      "Workflow building blocks",
      "Claude skill templates",
    ],
  },
  {
    id: "05-self-notes",
    name: "Self-Notes",
    emoji: "📓",
    description: "Daily notes, weekly reviews, journal entries, and personal reflections.",
    path: "05-Self-Notes/",
    capabilities: [
      "Daily note generation",
      "Weekly review templates",
      "Freeform journaling",
      "Goal and habit tracking",
      "Mood and energy logging",
    ],
  },
  {
    id: "06-media",
    name: "Media",
    emoji: "🎙️",
    description: "Voice memos, audio files, transcripts, and linked media from external sources.",
    path: "06-Media/",
    capabilities: [
      "Voice memo capture",
      "Audio transcription",
      "Media file organization",
      "Transcript search and indexing",
      "Link to external media platforms",
    ],
  },
  {
    id: "07-archive",
    name: "Archive",
    emoji: "🗄️",
    description: "Cold storage for retired content — inactive projects, old notes, and reference material.",
    path: "07-Archive/",
    capabilities: [
      "Cold storage with metadata",
      "Searchable archive index",
      "Date-based organization",
      "Retrieval on demand",
    ],
  },
  {
    id: "08-docs",
    name: "Docs",
    emoji: "📚",
    description: "Internal vault documentation — architecture, conventions, and operation guides.",
    path: "08-Docs/",
    capabilities: [
      "Architecture documentation",
      "Layer usage guides",
      "API and script references",
      "Onboarding documentation",
    ],
  },
  {
    id: "10-skills",
    name: "Skills",
    emoji: "⚡",
    description: "Installed Claude Code skill library — slash commands and automation definitions.",
    path: "10-Skills/",
    capabilities: [
      "Claude Code skill installation",
      "Slash command definitions",
      "Automation workflow scripts",
      "Skill version management",
    ],
  },
  {
    id: "11-voice-agent",
    name: "Voice Agent",
    emoji: "🎤",
    description: "Voice-to-code, voice-to-web, and voice-to-action agent powered by Retell AI.",
    path: "11-Voice-Agent/",
    capabilities: [
      "Voice-to-code transcription and execution",
      "Voice-to-web navigation and search",
      "Voice-to-action automation triggers",
      "Outbound call automation (Retell AI)",
      "Real-time voice memo capture",
    ],
  },
  {
    id: "12-higgsfield-studio",
    name: "Higgsfield Studio",
    emoji: "🎨",
    description: "AI image and video generation studio powered by Higgsfield models.",
    path: "12-Higgsfield-Studio/",
    capabilities: [
      "Text-to-image generation",
      "Text-to-video generation",
      "Image-to-video animation",
      "Generation job queue management",
      "Output organization by date and project",
    ],
  },
  {
    id: "storychain",
    name: "StoryChain",
    emoji: "📖",
    description: "Collaborative storytelling platform — live at http://104.198.196.174:3000/. Users contribute to branching narrative chains.",
    path: "01-Projects/StoryChain/",
    external: true,
    url: "http://104.198.196.174:3000/",
    capabilities: [
      "Collaborative story creation",
      "Branching narrative management",
      "Contribution tracking",
      "Story chain browsing and exploration",
      "Integration with vault project layer",
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Find a layer by its id. Returns undefined if not found. */
export function getLayer(id: string): VaultLayer | undefined {
  return LAYERS.find((l) => l.id === id);
}

/** Return all external integration layers. */
export function getExternalLayers(): VaultLayer[] {
  return LAYERS.filter((l) => l.external);
}

/** Return all local (non-external) layers. */
export function getLocalLayers(): VaultLayer[] {
  return LAYERS.filter((l) => !l.external);
}

/** Return layers sorted by their numeric prefix (00-12). */
export function getLayersSorted(): VaultLayer[] {
  return [...LAYERS].sort((a, b) => a.id.localeCompare(b.id));
}
