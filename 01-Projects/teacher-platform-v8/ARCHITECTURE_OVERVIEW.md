# 🎓 Teacher Command Center v8 — ICP-Native Architecture

> **The world's first fully decentralized, blockchain-native teaching platform**

---

## 🌍 Platform Ecosystem (Complete)

### Live Streaming / Video
| Platform | Region | Integration | Canister |
|----------|--------|-------------|----------|
| **ClassIn** | Global (Primary) | REST API + SDK | `classin_canister` |
| **paricall.org** | Privacy-first | WebRTC | `paricall_canister` |
| **Google Meet** | Global | Google Calendar API | `google_canister` |
| **Microsoft Teams** | Enterprise | Graph API | `microsoft_canister` |
| **Zoom** | Global | Zoom SDK | `zoom_canister` |
| **YouTube Live** | Global | YouTube API | `youtube_canister` |
| **Discord** | Gaming/Edu | Discord.js | `discord_canister` |
| **TikTok Live** | Youth | TikTok API | `tiktok_canister` |

### China Ecosystem (Critical!)
| Platform | Purpose | Integration |
|----------|---------|-------------|
| **WeChat (微信)** | Everything | WeChat Work API |
| **DingTalk (钉钉)** | Education focus | Alibaba API |
| **Lark/Feishu (飞书)** | ByteDance suite | Lark Open API |
| **Tencent Meeting** | Video | Tencent Cloud |
| **Bilibili** | Youth content | Bilibili API |

### LMS / Classroom Management
| Platform | Type | Integration |
|----------|------|-------------|
| **Google Classroom** | Google ecosystem | Classroom API |
| **Microsoft Teams for Education** | Microsoft | Graph API |
| **Canvas** | Higher Ed | Canvas API |
| **Moodle** | Open source | Moodle Web Services |
| **Blackboard** | Enterprise | Blackboard Learn API |
| **Schoology** | K-12 | Schoology API |

### Social Media Broadcasting
| Platform | Purpose | Auto-Share |
|----------|---------|------------|
| **Twitter/X** | Announcements | ✅ |
| **Facebook** | Community | ✅ |
| **Instagram** | Visual content | ✅ |
| **LinkedIn** | Professional | ✅ |
| **Pinterest** | Resources | ✅ (Existing) |
| **TikTok** | Short-form | ✅ |
| **YouTube** | Long-form | ✅ |
| **WhatsApp** | Parent comms (SA) | ✅ |
| **Telegram** | Channels | ✅ |

### Content Platforms
| Platform | Type | Integration |
|----------|------|-------------|
| **Twinkl** | Worksheets | ✅ (Existing) |
| **Canva** | Design | ✅ (Existing) |
| **Pinterest** | Curation | ✅ (Existing) |
| **Skool** | Community | ✅ (Existing) |
| **Teachers Pay Teachers** | Marketplace | API |
| **Nearpod** | Interactive | Nearpod API |
| **Kahoot** | Quizzes | Kahoot API |

### Communication / Parent Engagement
| Platform | Purpose |
|----------|---------|
| **ClassDojo** | Parent-teacher |
| **Remind** | Messaging |
| **Bloomz** | Parent portal |
| **Seesaw** | Student portfolios |
| **WhatsApp Business** | SA primary |

---

## 🏗️ File & Folder Architecture

```
teacher-command-center-v8/          # Monorepo root
├── 📁 apps/
│   ├── 📁 web/                     # Next.js 15 (Frontend)
│   │   ├── 📁 app/
│   │   │   ├── 📁 (marketing)/     # Landing, pricing, about
│   │   │   ├── 📁 (auth)/          # Login, register, onboarding
│   │   │   ├── 📁 (dashboard)/     # Main teacher workspace
│   │   │   │   ├── 📁 overview/    # Dashboard home
│   │   │   │   ├── 📁 live/        # Go live + streaming hub
│   │   │   │   ├── 📁 content/     # Content studio (plugins)
│   │   │   │   ├── 📁 schedule/    # Calendar + scheduling
│   │   │   │   ├── 📁 community/   # Social + parent comms
│   │   │   │   ├── 📁 analytics/   # Insights + reports
│   │   │   │   ├── 📁 settings/    # Profile + integrations
│   │   │   │   └── 📁 agents/      # Hermes + SpaceBot interface
│   │   │   ├── 📁 api/             # Next.js API routes (thin layer)
│   │   │   │   ├── 📁 auth/
│   │   │   │   ├── 📁 webhooks/    # Platform webhooks
│   │   │   │   └── 📁 agents/      # Agent communication
│   │   │   └── 📁 layout.tsx
│   │   ├── 📁 components/
│   │   │   ├── 📁 ui/              # shadcn/ui components
│   │   │   ├── 📁 plugins/         # Platform plugin UIs
│   │   │   ├── 📁 live/            # Streaming components
│   │   │   ├── 📁 content/         # Content creation
│   │   │   ├── 📁 agents/          # Agent chat interfaces
│   │   │   └── 📁 shared/          # Cross-cutting components
│   │   ├── 📁 hooks/               # React hooks
│   │   ├── 📁 lib/                 # Utilities
│   │   ├── 📁 stores/              # Zustand stores
│   │   └── 📁 styles/
│   ├── 📁 mobile/                  # React Native (future)
│   └── 📁 desktop/                 # Tauri/Electron (future)
│
├── 📁 canisters/                   # ICP Canisters (Motoko/Rust)
│   ├── 📁 identity/                # Internet Identity + auth
│   │   ├── 📄 main.mo              # Identity management
│   │   └── 📄 types.mo
│   ├── 📁 content/                 # Content storage (ICFS)
│   │   ├── 📄 main.mo              # Content CRUD
│   │   ├── 📄 search.mo            # Vector search
│   │   └── 📄 types.mo
│   ├── 📁 live/                    # Live streaming coordination
│   │   ├── 📄 main.mo              # Session management
│   │   ├── 📄 signaling.mo         # WebRTC signaling
│   │   └── 📄 recording.mo         # Recording storage
│   ├── 📁 social/                  # Social media orchestration
│   │   ├── 📄 main.mo              # Cross-platform posting
│   │   ├── 📄 queue.mo             # Post queue/management
│   │   └── 📄 analytics.mo         # Cross-platform metrics
│   ├── 📁 plugins/                 # Plugin registry
│   │   ├── 📄 registry.mo          # Plugin management
│   │   ├── 📄 permissions.mo       # Access control
│   │   └── 📄 billing.mo           # Plugin payments
│   ├── 📁 agents/                  # AI Agents (on-chain)
│   │   ├── 📄 hermes.mo            # Curriculum agent logic
│   │   ├── 📄 spacebot.mo          # Builder agent logic
│   │   ├── 📄 orchestrator.mo      # Agent coordination
│   │   └── 📄 memory.mo            # On-chain agent memory
│   ├── 📁 funding/                 # ckUSDC classroom funding
│   │   ├── 📄 pool.mo              # Funding pools
│   │   ├── 📄 governance.mo        # Spending decisions
│   │   ├── 📄 receipts.mo          # ICRC-7 NFT receipts
│   │   └── 📄 escrow.mo            # Milestone payments
│   ├── 📁 marketplace/             # Teacher marketplace
│   │   ├── 📄 listings.mo          # Content listings
│   │   ├── 📄 orders.mo            # Purchase tracking
│   │   ├── 📄 royalties.mo         # Revenue distribution
│   │   └── 📄 reviews.mo           # Review system
│   ├── 📁 rewards/                 # Tokenized incentives
│   │   ├── 📄 token.mo             # TeacherToken (ICRC-1)
│   │   ├── 📄 staking.mo           # Staking mechanics
│   │   └── 📄 distribution.mo      # Reward distribution
│   └── 📁 shared/                  # Shared utilities
│       ├── 📄 types.mo
│       ├── 📄 utils.mo
│       └── 📄 constants.mo
│
├── 📁 packages/
│   ├── 📁 core/                    # Core business logic
│   │   ├── 📁 src/
│   │   │   ├── 📁 domain/          # Domain entities (framework-agnostic)
│   │   │   │   ├── 📁 entities/    # Teacher, Student, Lesson, etc.
│   │   │   │   ├── 📁 value-objects/
│   │   │   │   ├── 📁 events/      # Domain events
│   │   │   │   └── 📁 services/    # Domain services
│   │   │   ├── 📁 application/     # Use cases
│   │   │   │   ├── 📁 ports/       # Interfaces for infra
│   │   │   │   ├── 📁 services/
│   │   │   │   └── 📁 use-cases/
│   │   │   └── 📁 infrastructure/  # External adapters
│   │   │       ├── 📁 persistence/
│   │   │       ├── 📁 http/
│   │   │       └── 📁 icp/
│   │   └── 📄 package.json
│   │
│   ├── 📁 plugins/                 # Plugin SDK & types
│   │   ├── 📁 src/
│   │   │   ├── 📁 sdk/             # Plugin development kit
│   │   │   ├── 📁 types/           # Shared plugin types
│   │   │   └── 📁 registry/        # Plugin registry client
│   │   └── 📄 package.json
│   │
│   ├── 📁 agents/                  # Agent SDK
│   │   ├── 📁 src/
│   │   │   ├── 📁 hermes/          # Hermes client
│   │   │   ├── 📁 spacebot/        # SpaceBot client
│   │   │   └── 📁 shared/
│   │   └── 📄 package.json
│   │
│   ├── 📁 ui/                      # Shared UI components
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   ├── 📁 hooks/
│   │   │   └── 📁 utils/
│   │   └── 📄 package.json
│   │
│   ├── 📁 config/                  # Shared configuration
│   │   ├── 📁 src/
│   │   │   ├── 📁 eslint/
│   │   │   ├── 📁 typescript/
│   │   │   └── 📁 tailwind/
│   │   └── 📄 package.json
│   │
│   └── 📁 types/                   # Shared TypeScript types
│       ├── 📁 src/
│       │   ├── 📁 platform.ts      # All platform types
│       │   ├── 📁 icp.ts           # ICP-specific types
│       │   ├── 📁 content.ts
│       │   └── 📁 api.ts
│       └── 📄 package.json
│
├── 📁 agent-workers/               # AI Agent Workers (Node.js/Python)
│   ├── 📁 hermes-worker/           # Curriculum agent service
│   │   ├── 📁 src/
│   │   │   ├── 📁 skills/          # Lesson planning, curation
│   │   │   ├── 📁 integrations/    # Platform connectors
│   │   │   └── 📁 memory/          # Vector DB (local)
│   │   └── 📄 Dockerfile
│   │
│   └── 📁 spacebot-worker/         # Builder agent service
│       ├── 📁 src/
│       │   ├── 📁 generators/      # Code generation
│       │   ├── 📁 validators/      # Code validation
│       │   └── 📁 templates/       # Component templates
│       └── 📄 Dockerfile
│
├── 📁 scripts/
│   ├── 📁 deploy/                  # Deployment scripts
│   │   ├── 📄 deploy-canisters.sh
│   │   ├── 📄 deploy-web.sh
│   │   └── 📄 setup-local.sh
│   ├── 📁 seed/                    # Database seeding
│   └── 📁 migrate/                 # Migration scripts
│
├── 📁 docs/
│   ├── 📁 architecture/
│   ├── 📁 api/
│   ├── 📁 plugins/
│   └── 📁 deployment/
│
├── 📁 tests/
│   ├── 📁 e2e/
│   ├── 📁 integration/
│   ├── 📁 canister/
│   └── 📁 agent/
│
├── 📄 dfx.json                     # ICP configuration
├── 📄 turbo.json                   # Turborepo config
├── 📄 package.json
└── 📄 README.md
```

---

## 🛣️ Routing Architecture

### App Router (Next.js 15) + ICP Integration

```typescript
// app/(dashboard)/[platform]/[action]/page.tsx
// Dynamic routing for all platforms

interface PlatformRouteParams {
  platform: 'classin' | 'google-meet' | 'zoom' | 'twinkl' | 'canva' | ...;
  action: 'live' | 'schedule' | 'share' | 'import' | 'create';
}

// Routing Strategy:
// /dashboard/live/classin/start     → Start ClassIn session
// /dashboard/live/zoom/schedule     → Schedule Zoom meeting
// /dashboard/content/twinkl/search  → Search Twinkl
// /dashboard/content/canva/create   → Create Canva design
// /dashboard/share/twitter          → Share to Twitter
// /dashboard/agents/hermes          → Chat with Hermes
// /dashboard/agents/spacebot        → Build with SpaceBot
```

### Route Groups by Feature

```
app/
├── (marketing)/           # No auth required
│   ├── /
│   ├── /pricing
│   ├── /about
│   └── /blog
│
├── (auth)/                # Auth layout
│   ├── /login
│   ├── /register
│   ├── /onboarding
│   └── /icp-auth          # Internet Identity
│
├── (dashboard)/           # Protected, sidebar layout
│   ├── /overview
│   ├── /live/             # Live streaming hub
│   │   ├── /start         # Platform selector
│   │   ├── /[platform]/schedule
│   │   └── /[platform]/join/[id]
│   ├── /content/          # Content studio
│   │   ├── /plugins       # Plugin grid
│   │   └── /[plugin]/...  # Dynamic plugin routes
│   ├── /schedule/         # Calendar
│   ├── /community/        # Social + parent comms
│   ├── /analytics/
│   ├── /marketplace/      # Buy/sell content
│   ├── /funding/          # ckUSDC funding
│   ├── /settings/
│   └── /agents/           # AI agents
│       ├── /hermes
│       └── /spacebot
│
└── api/                   # API routes (thin)
    ├── /webhooks/         # Platform webhooks
    │   ├── /classin
    │   ├── /zoom
    │   └── /...
    ├── /agents/           # Agent communication
    └── /icp/              # ICP canister proxy
```

---

## 🔄 State Management Architecture

### Multi-Layer State

```typescript
// Layer 1: ICP Canister (Source of Truth)
// - User identity
// - Content ownership (NFTs)
// - Token balances (ckUSDC, TeacherToken)
// - Governance votes

// Layer 2: Supabase (Operational Data)
// - Session data
// - Real-time presence
// - Cache of canister data
// - Search indexes

// Layer 3: Zustand (Frontend State)
// - UI state
// - Form state
// - Optimistic updates
// - Local caching

// Layer 4: React Query (Server State)
// - API call caching
// - Background sync
// - Invalidation
```

### Store Structure

```typescript
// stores/index.ts
export const useTeacherStore = create<TeacherState>((set, get) => ({
  // Identity (from ICP)
  identity: null,
  principal: null,
  
  // Profile (hybrid: ICP + Supabase)
  profile: null,
  
  // Connected platforms
  platforms: {
    classin: { connected: false, config: null },
    google: { connected: false, config: null },
    microsoft: { connected: false, config: null },
    wechat: { connected: false, config: null },
    // ... all platforms
  },
  
  // Content library
  content: {
    items: [],
    selected: null,
    filters: {},
  },
  
  // Live session state
  live: {
    currentSession: null,
    participants: [],
    chat: [],
    screenShare: null,
  },
  
  // Agent state
  agents: {
    hermes: { messages: [], context: null },
    spacebot: { messages: [], buildQueue: [] },
  },
  
  // Token/Blockchain state
  tokens: {
    ckUSDC: { balance: 0n, transactions: [] },
    TeacherToken: { balance: 0n, staked: 0n },
  },
  
  // Actions
  connectPlatform: (platform, config) => {...},
  startLiveSession: (platform) => {...},
  callAgent: (agent, message) => {...},
}));
```

### ICP ↔ Frontend Sync

```typescript
// hooks/useCanisterSync.ts
export function useCanisterSync() {
  // Sync identity from Internet Identity
  useEffect(() => {
    authClient.then(client => {
      if (await client.isAuthenticated()) {
        const identity = client.getIdentity();
        useTeacherStore.setState({ identity, principal: identity.getPrincipal() });
      }
    });
  }, []);
  
  // Sync token balances
  const { data: balances } = useQuery({
    queryKey: ['balances', principal],
    queryFn: () => tokenCanister.getBalances(principal),
    refetchInterval: 30000, // 30s
  });
}
```

---

## 🧱 Abstraction Layer

### Platform Abstraction (The Key!)

```typescript
// packages/plugins/src/types/platform.ts

// Universal interface for ALL platforms
interface IPlatform {
  id: string;
  name: string;
  category: 'live' | 'content' | 'social' | 'lms' | 'communication';
  
  // Authentication
  authenticate(): Promise<AuthResult>;
  isAuthenticated(): boolean;
  disconnect(): Promise<void>;
  
  // Capabilities (feature detection)
  capabilities: {
    liveStreaming: boolean;
    recording: boolean;
    screenShare: boolean;
    chat: boolean;
    breakoutRooms: boolean;
    whiteboard: boolean;
    attendance: boolean;
    scheduling: boolean;
    importContent: boolean;
    exportContent: boolean;
    analytics: boolean;
  };
}

// Live streaming specific
interface ILivePlatform extends IPlatform {
  capabilities: { liveStreaming: true; ... };
  
  scheduleSession(details: SessionDetails): Promise<Session>;
  startSession(sessionId: string): Promise<StreamUrl>;
  joinSession(sessionId: string): Promise<JoinUrl>;
  endSession(sessionId: string): Promise<void>;
  getParticipants(sessionId: string): Promise<Participant[]>;
  sendChat(sessionId: string, message: string): Promise<void>;
  shareScreen(sessionId: string): Promise<void>;
  startRecording(sessionId: string): Promise<void>;
  stopRecording(sessionId: string): Promise<Recording>;
  getAttendance(sessionId: string): Promise<Attendance[]>;
}

// Content platform specific
interface IContentPlatform extends IPlatform {
  capabilities: { importContent: true; ... };
  
  search(query: string, filters: Filters): Promise<Content[]>;
  importContent(contentId: string): Promise<ContentItem>;
  exportContent(content: ContentItem): Promise<void>;
  createFromTemplate(template: Template): Promise<ContentItem>;
}

// Social platform specific
interface ISocialPlatform extends IPlatform {
  capabilities: { ... };
  
  share(content: ShareContent): Promise<Post>;
  schedulePost(content: ShareContent, time: Date): Promise<ScheduledPost>;
  getAnalytics(postId: string): Promise<Analytics>;
}
```

### Platform Factory

```typescript
// packages/plugins/src/factory.ts

class PlatformFactory {
  private static adapters = new Map<string, PlatformAdapter>();
  
  static register(id: string, adapter: PlatformAdapter) {
    this.adapters.set(id, adapter);
  }
  
  static get(id: string): PlatformAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`Platform ${id} not registered`);
    return adapter;
  }
  
  static getAll(category?: string): PlatformAdapter[] {
    const adapters = Array.from(this.adapters.values());
    return category 
      ? adapters.filter(a => a.category === category)
      : adapters;
  }
  
  static getLivePlatforms(): ILivePlatform[] {
    return this.getAll('live') as ILivePlatform[];
  }
}

// Register all platforms
PlatformFactory.register('classin', new ClassInAdapter());
PlatformFactory.register('google-meet', new GoogleMeetAdapter());
PlatformFactory.register('zoom', new ZoomAdapter());
PlatformFactory.register('wechat', new WeChatAdapter());
PlatformFactory.register('dingtalk', new DingTalkAdapter());
// ... etc
```

---

## 🎯 Separation of Concerns

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  Next.js Components, Pages, UI, Hooks                          │
│  - React components                                             │
│  - Zustand stores                                               │
│  - TanStack Query                                               │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                            │
│  Use Cases, Application Services                               │
│  - StartLiveSessionUseCase                                     │
│  - CreateLessonUseCase                                          │
│  - ShareContentUseCase                                          │
├─────────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                               │
│  Business Logic, Entities, Value Objects                       │
│  - Teacher, Lesson, Content                                    │
│  - Platform interfaces                                          │
│  - Domain events                                                │
├─────────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                          │
│  External Adapters, ICP Canisters, APIs                        │
│  - Platform adapters                                            │
│  - Canister clients                                             │
│  - Database repositories                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Rule
```
Domain ← Application ← Infrastructure
Domain has NO external dependencies!
```

---

## 🔗 ICP Integration Points

### Internet Identity
```typescript
// Authentication flow
1. User clicks "Sign in with Internet Identity"
2. Redirect to Internet Identity service
3. Delegation chain created
4. Principal ID = user identity
5. Create/link Supabase user with principal
```

### Canister Communication
```typescript
// Frontend agent
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as contentIdl } from '../../../declarations/content';

const agent = new HttpAgent({ host: process.env.NEXT_PUBLIC_IC_HOST });
const contentCanister = Actor.createActor(contentIdl, {
  agent,
  canisterId: process.env.NEXT_PUBLIC_CONTENT_CANISTER_ID,
});

// Use in components
const content = await contentCanister.getContent(contentId);
```

### ckUSDC Payments
```typescript
// Funding pool contribution
const transferArgs = {
  to: fundingPoolPrincipal,
  amount: BigInt(amount * 1000000), // 6 decimals
  fee: [],
  memo: [],
  from_subaccount: [],
  created_at_time: [],
};

await ckUSDCCanister.icrc1_transfer(transferArgs);
```

---

**Next**: Read `MISSING_OPPORTUNITIES.md` for what you're sleeping on! 🚀
