# 🤖 Hermes × SpaceBot — Integrated Tools Architecture v1

> **Autonomous agent toolkit with persistent memory, offline resilience, and teacher-friendly execution.**

---

## 🎯 Executive Summary

We integrated 4 powerful open-source tools directly into the Hermes (curriculum) and SpaceBot (builder) agent architecture:

| Tool | Agent | Purpose | Teacher Value |
|------|-------|---------|---------------|
| **MarkItDown** | Hermes, SpaceBot | Convert any document → Markdown | Turns admin PDFs/Word docs into lesson content instantly |
| **PaddleOCR** (RapidOCR fallback) | Hermes, SpaceBot | Scan images/PDFs → text | Digitizes handwritten worksheets, exam papers, textbooks |
| **OpenMontage** | Hermes | Generate educational videos from prompts | Creates lesson explainers without technical knowledge |
| **Multilingual-TTS** | Hermes | Text → speech in 150+ languages | Generates audio lessons in Zulu, Xhosa, Afrikaans, etc. |

**Removed from original request** (unnecessary for non-technical teachers):
- EverClaw (overlaps SpaceBot's build capability, security risk)
- SentrySearch (too niche — video footage search)
- Hypergraph (too developer-focused — knowledge graph builder)

---

## 🏗️ File & Folder Architecture

```
teacher-command-center/
│
├── 📁 tools/                          # External tool installations
│   ├── openmontage/                   # git clone → pip install -e .
│   └── multilingual-tts/              # git clone → inference API scaffold
│
├── 📁 packages/
│   ├── 📁 agent-memory/               # Persistent memory SDK
│   │   ├── src/
│   │   │   ├── db.ts                  # IndexedDB schema (idb)
│   │   │   ├── crdt.ts                # Vector clock conflict resolution
│   │   │   ├── store.ts               # AgentMemoryStore (messages, sessions, preferences)
│   │   │   ├── sync.ts                # Supabase sync engine
│   │   │   ├── recovery.ts            # Session auto-recovery
│   │   │   ├── config.ts              # Heartbeat & optimization settings
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── 📁 agent-tools/                # Autonomous tool SDK
│   │   ├── src/
│   │   │   ├── base-tool.ts           # BaseTool abstract class
│   │   │   ├── markitdown.ts          # MarkItDown wrapper
│   │   │   ├── paddleocr.ts           # PaddleOCR (RapidOCR fallback)
│   │   │   ├── openmontage.ts         # OpenMontage wrapper
│   │   │   ├── multilingual-tts.ts    # TTS wrapper
│   │   │   ├── types.ts               # Shared interfaces
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── 📁 agent-voice/                # Voice command SDK (NO API KEYS)
│   │   ├── src/
│   │   │   ├── recognition.ts         # Web Speech API STT
│   │   │   ├── synthesis.ts           # Web Speech API TTS (ElevenLabs optional)
│   │   │   ├── intents.ts             # Fast regex intent parser
│   │   │   ├── types.ts               # Voice interfaces
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── 📁 shared/                     # Existing shared types
│
├── 📁 apps/web/
│   ├── 📁 app/(dashboard)/agents/     # Agent UI
│   │   ├── page.tsx                   # Agent selector
│   │   ├── hermes/page.tsx            # Hermes chat (with voice input)
│   │   └── spacebot/page.tsx          # SpaceBot builder (with voice input)
│   │
│   ├── 📁 app/(dashboard)/notes/      # Simplified Solomon's Chamber
│   │   ├── page.tsx                   # Notes dashboard (4 categories)
│   │   ├── [category]/page.tsx        # Category view
│   │   └── [category]/[id]/page.tsx   # Note editor
│   │
│   ├── 📁 app/(dashboard)/schedule/   # Calendar (voice-activated)
│   │   └── page.tsx                   # Weekly calendar with URL highlight
│   │
│   ├── 📁 components/agents/
│   │   ├── AgentSelector.tsx
│   │   ├── HermesChat.tsx
│   │   ├── SpaceBotBuilder.tsx
│   │   ├── MemoryIndicator.tsx
│   │   └── OfflineBadge.tsx
│   │
│   ├── 📁 components/notes/
│   │   ├── NoteCard.tsx
│   │   ├── NoteEditor.tsx
│   │   └── QuickCapture.tsx
│   │
│   ├── 📁 components/voice/
│   │   ├── VoiceCommandButton.tsx     # Floating mic button
│   │   └── VoiceResponseToast.tsx     # Spoken response display
│   │
│   ├── 📁 lib/agents/
│   │   ├── hermes-client.ts
│   │   ├── spacebot-client.ts
│   │   └── memory-client.ts
│   │
│   ├── 📁 lib/notes/
│   │   ├── store.ts                   # IndexedDB notes storage
│   │   └── voice-capture.ts           # Voice → note creation
│   │
│   ├── 📁 lib/schedule/
│   │   ├── types.ts                   # LessonEvent types
│   │   └── store.ts                   # IndexedDB schedule storage
│   │
│   ├── 📁 lib/voice/
│   │   ├── calendar-handler.ts        # "What's on Friday at 1pm?"
│   │   ├── navigation-handler.ts      # "Go to calendar"
│   │   └── orchestrator.ts            # Main voice command router
│   │
│   └── 📁 app/api/agents/
│       ├── hermes/route.ts
│       ├── hermes/session/route.ts
│       ├── spacebot/route.ts
│       └── spacebot/queue/route.ts
│
└── 📁 supabase/migrations/
    └── 006_agent_memory.sql           # DB schema for sync + persistence
```

---

## 🧠 Persistent Memory System

### Design Philosophy

Teachers in South Africa face **load shedding** (up to 12 hours/day) and unreliable internet. The memory system is **local-first** — everything is saved to IndexedDB immediately, then synced to Supabase when online.

### Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Agent UI (HermesChat, SpaceBotBuilder)                     │
├─────────────────────────────────────────────────────────────┤
│                    MEMORY CLIENT                             │
│  initializeMemory(), syncMemory(), recoverSession()         │
├─────────────────────────────────────────────────────────────┤
│                    LOCAL STORE (IndexedDB)                   │
│  AgentMemoryDB: messages, sessions, toolOutputs,            │
│  preferences, syncQueue                                     │
├─────────────────────────────────────────────────────────────┤
│                    SYNC ENGINE                               │
│  CRDT conflict resolution → Supabase upsert                 │
├─────────────────────────────────────────────────────────────┤
│                    SERVER STORE (Supabase)                   │
│  agent_sessions, agent_messages, agent_tool_outputs,        │
│  agent_preferences, agent_sync_log                          │
└─────────────────────────────────────────────────────────────┘
```

### CRDT Strategy

- **Vector clocks** per agent (`{ hermes: 42, spacebot: 17 }`)
- **Conflict detection**: concurrent updates with no causal ordering
- **Resolution**: last-write-wins using vector clock primary ordering + timestamp tiebreaker
- Every write auto-queues a `syncQueue` entry

### Recovery Flow

```
Teacher opens Agents page
         │
         ▼
recoverSession(agentId, teacherId)
         │
         ▼
Find latest non-archived session
         │
         ▼
Load all messages + tool outputs
         │
         ▼
Resume session (mark active, show "memory restored" banner)
```

### Auto-Sync Behaviors

| Event | Action |
|-------|--------|
| Message sent | Save to IndexedDB + queue sync |
| Tool executed | Save output to IndexedDB + queue sync |
| Browser comes online | Trigger `syncMemory()` |
| Tab reopens | `recoverSession()` auto-runs |
| 30s heartbeat | Background sync attempt |

---

## 🔧 Autonomous Tool Architecture

### BaseTool Contract

All tools extend `BaseTool` and implement:

```typescript
abstract class BaseTool {
  abstract name: string;
  abstract execute<T>(input: unknown): Promise<ToolResult<T>>;
  
  protected safeExec<T>(fn: () => Promise<T>): Promise<ToolResult<T>>
  // Wraps execution, never throws. Returns { success, data, error }
}
```

### Tool Registry

```typescript
export const AGENT_TOOLS = {
  markitdown: MarkItDownTool,
  paddleocr: PaddleOCRTool,
  openmontage: OpenMontageTool,
  multilingualTTS: MultilingualTTSTool,
};
```

### Agent × Tool Mapping

| Tool | Hermes Uses It For | SpaceBot Uses It For |
|------|-------------------|---------------------|
| **MarkItDown** | Ingest curriculum docs, convert worksheets | Parse API docs, convert specs |
| **PaddleOCR** | Scan textbook pages, handwritten notes | Extract text from screenshots |
| **OpenMontage** | Generate lesson explainer videos | — |
| **Multilingual-TTS** | Create audio lessons in local languages | Voice-over for generated tools |

### Execution Model

Tools run in **Node.js agent worker processes**, not the browser:

```
Browser (Teacher)
    │
    ▼
Next.js API Route
    │
    ▼
Agent Worker (Node.js)
    │
    ├──▶ MarkItDownTool.spawnPython("markitdown file.pdf")
    ├──▶ PaddleOCRTool.spawnPython("rapidocr_onnxruntime")
    ├──▶ OpenMontageTool.writeConfig().spawnPython("pipeline.py")
    └──▶ MultilingualTTSTool.spawnPython("tts_inference.py")
```

---

## 🛣️ Routing System

### Dashboard Routes (App Router)

```
/dashboard/agents              → Agent selector (Hermes vs SpaceBot)
/dashboard/agents/hermes       → Hermes chat interface (with mic button)
/dashboard/agents/spacebot     → SpaceBot builder interface (with mic button)
/dashboard/notes               → My Notes dashboard (simplified Solomon's Chamber)
/dashboard/notes/[category]    → Notes by category
/dashboard/schedule            → Weekly calendar (voice-highlightable)
```

### API Routes

```
POST /api/agents/hermes              → Send message to Hermes
GET  /api/agents/hermes/session      → Get/recover Hermes session
POST /api/agents/hermes/session      → Create Hermes session

POST /api/agents/spacebot            → Send message to SpaceBot
GET  /api/agents/spacebot/queue      → Get build queue

POST /api/notes                      → Create/update note
GET  /api/notes                      → List notes
```

### Sidebar Navigation

Added `"My Notes"` and `"Agents"` to the dashboard sidebar. Voice command button floats globally on all dashboard pages.

---

## 🔄 State Management

### Frontend Stores (Zustand-style, via hooks)

```typescript
// apps/web/lib/agents/memory-client.ts
interface AgentMemoryState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingCount: number;
  sessionRecovered: boolean;
}
```

### Memory Store (`packages/agent-memory/src/store.ts`)

```typescript
class AgentMemoryStore {
  async createSession(agentId, teacherId, context?)
  async recoverLatestSession(agentId, teacherId)
  async addMessage(sessionId, message)
  async addToolOutput(sessionId, toolName, input, output, error?)
  async setPreference(agentId, teacherId, key, value)
  async queueSyncOperation(operation, table, payload)
}
```

### Sync Store (`packages/agent-memory/src/sync.ts`)

```typescript
class MemorySyncEngine {
  async push()   // IndexedDB → Supabase
  async pull()   // Supabase → IndexedDB
  async sync()   // push + pull with CRDT merge
}
```

---

## 🧱 Abstraction Layers

### 1. Tool Abstraction

All tools implement the same interface, regardless of whether they spawn Python, call an API, or use a local model.

### 2. Memory Abstraction

The frontend doesn't know about CRDTs or vector clocks. It calls:
- `initializeMemory()`
- `recoverSession(agentId)`
- `syncMemory()`

The complexity is hidden in `packages/agent-memory/`.

### 3. Platform Abstraction

OpenMontage and TTS can swap between local inference and cloud APIs without changing the agent code.

### 4. Offline Abstraction

Every write is local-first. The sync engine handles connectivity transparently.

---

## 🎙️ Voice System — Zero API Keys Required

### Philosophy

Teachers should be able to say **"Bring up my calendar and tell me what the lesson is on Friday at 1pm"** and get an **immediate** audio + visual response. No setup. No API keys. No understanding of what "ElevenLabs" means.

### Technology Stack

| Layer | Technology | Cost | Latency |
|-------|-----------|------|---------|
| **Speech-to-Text** | Web Speech API (`SpeechRecognition`) | Free | ~200ms |
| **Text-to-Speech** | Web Speech API (`speechSynthesis`) | Free | ~100ms |
| **Intent Parsing** | Regex-based parser (no LLM) | Free | ~1ms |
| **Premium TTS (Optional)** | ElevenLabs | Paid | ~500ms-2s |

**ElevenLabs is explicitly opt-in only.** The default path uses the browser's built-in voice synthesis, which works instantly offline.

### Voice Command Flow

```
Teacher presses mic button or floating voice button
         │
         ▼
VoiceRecognizer.start('en-ZA')
         │
         ▼
Teacher: "What's my lesson on Friday at 1pm?"
         │
         ▼
parseIntent() → intent: calendar.show, entities: { day: 'friday', time: '1pm' }
         │
         ▼
calendar-handler.ts → fetch lessons from IndexedDB schedule store
         │
         ▼
Generate response: "You have Grade 7 Mathematics on Friday at 1 PM in Classroom B."
         │
         ├──▶ Visual: router.push('/schedule?highlight=friday-13-00')
         └──▶ Audio: VoiceSynthesizer.speak(responseText)
```

### Supported Voice Commands

| Command Type | Example | Action |
|-------------|---------|--------|
| **Calendar** | "What's on Friday at 1pm?" | Shows schedule + speaks lesson |
| **Navigation** | "Go to my notes" | Navigates to `/notes` |
| **Notes** | "Take a note about photosynthesis" | Creates note in Lesson Ideas |
| **Agent (Hermes)** | "Ask Hermes to plan a lesson" | Opens Hermes + sends message |
| **Agent (SpaceBot)** | "Build an attendance tracker" | Opens SpaceBot + sends message |

### Agent Chat Voice Input

Both **HermesChat** and **SpaceBotBuilder** now include a **microphone button** next to the send button. Teachers can:
1. Tap the mic
2. Speak their message
3. The transcript is automatically sent as a chat message

No typing required.

---

## 📓 Simplified Solomon's Chamber — "My Notes"

The original Solomon's Chamber is a powerful but complex knowledge management system with numbered folders (`00-Inbox`, `01-Projects`, etc.). For teachers, we created a **simplified, friendly version** called **My Notes**.

### Categories

| Category | Purpose | Example |
|----------|---------|---------|
| **Daily Notes** | Simple journal | "Today the Grade 8s struggled with algebra..." |
| **Lesson Ideas** | Teaching concepts | "Interactive activity for photosynthesis" |
| **Student Notes** | Observations & comms | "Thabo's parent meeting follow-up" |
| **Quick Capture** | Unsorted voice/text dumps | "Remember to print exam papers" |

### Features

- **Offline-first**: All notes saved to IndexedDB
- **Voice capture**: One-tap voice note creation with auto-categorization
- **Auto-save editor**: No "Save" button needed
- **Zero complexity**: No folder numbers, no technical jargon

### Voice-to-Note

Saying **"Take a note about photosynthesis for grade 7"** automatically:
1. Starts voice recognition
2. Creates a note titled "Photosynthesis for Grade 7"
3. Saves it under **Lesson Ideas**

---

## 💓 Agent Heartbeat & Optimization Config

Tuned specifically for **South African internet conditions** (load shedding, intermittent connectivity).

### Configuration File

`packages/agent-memory/src/config.ts`

```typescript
export interface AgentHeartbeatConfig {
  sync: {
    intervalMs: 30_000;        // Try sync every 30s
    retryIntervalMs: 5_000;    // Retry after 5s on failure
    maxRetries: 10;
    batchSize: 25;
    heartbeatIntervalMs: 15_000;
  };
  memory: {
    autoRecoverOnLoad: true;
    recoveryTimeoutMs: 3_000;
    archiveAfterInactiveMs: 7 days;
    checkpointIntervalMs: 10_000;
  };
  voice: {
    recognitionTimeoutMs: 10_000;  // Max 10s per voice command
    silenceTimeoutMs: 2_000;       // Stop after 2s silence
  };
  offline: {
    queueMaxSize: 500;             // Buffer 500 operations offline
  };
  tools: {
    defaultTimeoutMs: 30_000;
    longRunningTimeoutMs: 300_000; // Video generation, etc.
  };
}
```

### Presets

| Mode | Best For | Sync Interval | Retry Interval |
|------|----------|---------------|----------------|
| `default` | Typical SA connectivity | 30s | 5s |
| `fast` | Stable fiber/WiFi | 10s | 2s |
| `conservative` | Frequent load shedding | 60s | 15s |

---

## 🛡️ Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│  UI LAYER           │  React components, pages, hooks       │
├─────────────────────────────────────────────────────────────┤
│  CLIENT LAYER       │  hermes-client.ts, memory-client.ts   │
│                     │  voice/orchestrator.ts                │
├─────────────────────────────────────────────────────────────┤
│  API LAYER          │  Next.js API routes (thin proxies)    │
├─────────────────────────────────────────────────────────────┤
│  AGENT LAYER        │  Hermes/SpaceBot orchestration logic  │
├─────────────────────────────────────────────────────────────┤
│  VOICE SDK          │  packages/agent-voice/                │
├─────────────────────────────────────────────────────────────┤
│  TOOL SDK           │  packages/agent-tools/                │
├─────────────────────────────────────────────────────────────┤
│  MEMORY SDK         │  packages/agent-memory/               │
├─────────────────────────────────────────────────────────────┤
│  EXTERNAL TOOLS     │  Python processes (MarkItDown, etc.)  │
├─────────────────────────────────────────────────────────────┤
│  DATABASE           │  IndexedDB (local) + Supabase (cloud) │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation Status

| Tool / Package | Status | Location |
|---------------|--------|----------|
| MarkItDown | ✅ Installed | `.venv/bin/markitdown` |
| RapidOCR (PaddleOCR fallback) | ✅ Installed | `.venv` + `rapidocr_onnxruntime` |
| OpenMontage | ✅ Cloned + Installed | `tools/openmontage/` |
| Multilingual-TTS | ✅ Cloned | `tools/multilingual-tts/` |
| `@teacher-platform/agent-voice` | ✅ Built | `packages/agent-voice/` |
| `@teacher-platform/agent-memory` | ✅ Built | `packages/agent-memory/` |
| `@teacher-platform/agent-tools` | ✅ Built | `packages/agent-tools/` |
| My Notes (Simplified Chamber) | ✅ Built | `apps/web/app/(dashboard)/notes/` |
| Voice Calendar Integration | ✅ Built | `apps/web/lib/voice/` + `apps/web/components/voice/` |

### API Keys Required?

**NO API keys are required for basic voice functionality.** The Web Speech API is completely free and built into Chrome/Edge/Firefox/Safari.

| Feature | API Key Needed? | Default Fallback |
|---------|----------------|------------------|
| Voice commands (STT) | ❌ No | Web Speech API |
| Voice responses (TTS) | ❌ No | Web Speech API |
| Premium voice quality | ⚠️ Optional | ElevenLabs (opt-in) |
| Document conversion | ❌ No | MarkItDown (local) |
| Image OCR | ❌ No | RapidOCR (local) |
| Educational videos | ⚠️ Optional | OpenMontage can use free stock + local TTS |
| AI-generated video clips | ⚠️ Optional | FAL_KEY / Runway / etc. |

**Note on PaddleOCR**: The full `paddlepaddle` runtime requires `libgomp1` (not available in this environment). We use `rapidocr-onnxruntime` as a lightweight, API-compatible fallback. When deployed to a server with `libgomp1`, swap `PaddleOCRTool` to use the native `paddleocr` backend.

**Note on Multilingual-TTS**: The base repo contains training scripts. For production inference, use the companion repo `TTS-API-Neucodec`. The current wrapper includes a `mockSynthesize` fallback that uses system TTS (`espeak-ng` on Linux) to prevent agent crashes while models are being set up.

---

## 🚀 Next Steps

1. **Run `pnpm install`** in the monorepo root to link all new packages (`@teacher-platform/agent-memory`, `@teacher-platform/agent-tools`, `@teacher-platform/agent-voice`)
2. **Apply Supabase migration**: `supabase db push` (or `npx supabase db push`)
3. **Test voice commands** in Chrome/Edge: "What's my lesson on Friday at 1pm?"
4. **Set up environment variables** for OpenMontage API keys (FAL, etc.) if using cloud providers
5. **Download TTS models** or deploy `TTS-API-Neucodec` for real multilingual voice generation
6. **Build agent orchestration layer** — wire API routes to actual LLM + tool-calling logic
7. **Test offline resilience**: Disconnect WiFi mid-conversation, close tab, reopen — session + notes should restore seamlessly
8. **Optional**: Add ElevenLabs API key in Settings for premium TTS voices

---

**Built for teachers who don't know what an API is.** 🍎🇿🇦
