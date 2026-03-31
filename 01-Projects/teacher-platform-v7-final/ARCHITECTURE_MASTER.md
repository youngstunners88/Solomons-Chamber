# 🎓 Teacher's Command Center v7 — COMPLETE Architecture

> **Full v7 blueprint implementation: Staking, DAO, WhatsApp, Offline-First, ICP Native**

---

## 🎯 What Was ALWAYS in v7 (I Missed These!)

### ✅ Staking System (From Your Blueprint)
- Teachers stake TeacherTokens for premium features
- Staking rewards for long-term holders
- Governance weight based on stake + reputation
- Unlock periods and penalties

### ✅ DAO Governance (From Your Blueprint)
- On-chain voting for platform decisions
- Proposal creation by token holders
- Transparent treasury management
- Community-driven roadmap

### ✅ WhatsApp Integration (Critical - You Agreed)
- Parent communication primary channel (SA)
- WhatsApp Business API
- Automated notifications
- Group management for classes

### ✅ Offline-First (Critical - You Agreed)
- Works during load shedding
- Local-first database
- Background sync
- SMS fallback

---

## 📁 PERFECT File & Folder System

```
teacher-command-center-v7/           # Project root
│
├── 📁 .github/                      # CI/CD & workflows
│   └── 📁 workflows/
│       ├── 📄 ci.yml                # Lint, test, build
│       ├── 📄 deploy-web.yml        # Vercel deployment
│       ├── 📄 deploy-canisters.yml  # ICP deployment
│       └── 📄 e2e.yml               # Playwright tests
│
├── 📁 apps/
│   ├── 📁 web/                      # Next.js 15 (Primary)
│   │   ├── 📁 app/                  # App Router
│   │   │   ├── 📁 (marketing)/      # Public pages
│   │   │   │   ├── 📄 page.tsx      # Landing
│   │   │   │   ├── 📁 pricing/
│   │   │   │   └── 📁 about/
│   │   │   │
│   │   │   ├── 📁 (auth)/           # Authentication
│   │   │   │   ├── 📁 login/
│   │   │   │   ├── 📁 register/
│   │   │   │   ├── 📁 onboarding/   # 5-screen flow
│   │   │   │   └── 📁 icp-auth/     # Internet Identity
│   │   │   │
│   │   │   ├── 📁 (dashboard)/      # Main app (protected)
│   │   │   │   ├── 📁 layout.tsx    # Dashboard shell
│   │   │   │   ├── 📁 page.tsx      # Overview
│   │   │   │   │
│   │   │   │   ├── 📁 live/         # Live streaming hub
│   │   │   │   │   ├── 📁 page.tsx              # Platform selector
│   │   │   │   │   ├── 📁 classin/
│   │   │   │   │   │   ├── 📁 schedule/
│   │   │   │   │   │   ├── 📁 start/
│   │   │   │   │   │   └── 📁 join/
│   │   │   │   │   ├── 📁 paricall/
│   │   │   │   │   │   └── 📁 [same structure]
│   │   │   │   │   └── 📁 recordings/
│   │   │   │   │
│   │   │   │   ├── 📁 content/      # Content Studio
│   │   │   │   │   ├── 📁 page.tsx              # Plugin grid
│   │   │   │   │   ├── 📁 canva/
│   │   │   │   │   ├── 📁 skool/
│   │   │   │   │   ├── 📁 twinkl/
│   │   │   │   │   ├── 📁 pinterest/
│   │   │   │   │   ├── 📁 library/
│   │   │   │   │   └── 📁 imported/
│   │   │   │   │
│   │   │   │   ├── 📁 schedule/     # Calendar
│   │   │   │   ├── 📁 community/    # Social + parent comms
│   │   │   │   │   ├── 📁 whatsapp/             # NEW: WhatsApp hub
│   │   │   │   │   ├── 📁 share/
│   │   │   │   │   └── 📁 parents/
│   │   │   │   │
│   │   │   │   ├── 📁 dao/          # DAO Governance
│   │   │   │   │   ├── 📁 page.tsx              # Proposals list
│   │   │   │   │   ├── 📁 proposals/
│   │   │   │   │   │   ├── 📁 [id]/
│   │   │   │   │   │   │   └── 📁 vote/
│   │   │   │   │   │   └── 📁 create/
│   │   │   │   │   ├── 📁 treasury/
│   │   │   │   │   └── 📁 staking/
│   │   │   │   │       ├── 📁 page.tsx
│   │   │   │   │       └── 📁 unstake/
│   │   │   │   │
│   │   │   │   ├── 📁 funding/      # ckUSDC funding
│   │   │   │   │   ├── 📁 page.tsx              # My pools
│   │   │   │   │   ├── 📁 create/
│   │   │   │   │   ├── 📁 [poolId]/
│   │   │   │   │   │   ├── 📁 deposit/
│   │   │   │   │   │   ├── 📁 withdraw/
│   │   │   │   │   │   └── 📁 proposals/        # Spending proposals
│   │   │   │   │   └── 📁 marketplace/
│   │   │   │   │
│   │   │   │   ├── 📁 agents/       # Hermes + SpaceBot
│   │   │   │   │   ├── 📁 page.tsx              # Agent selector
│   │   │   │   │   ├── 📁 hermes/
│   │   │   │   │   │   └── 📁 chat/
│   │   │   │   │   └── 📁 spacebot/
│   │   │   │   │       └── 📁 builder/
│   │   │   │   │
│   │   │   │   ├── 📁 analytics/
│   │   │   │   ├── 📁 settings/
│   │   │   │   └── 📁 offline/      # NEW: Offline mode indicator
│   │   │   │       └── 📁 page.tsx              # Sync status
│   │   │   │
│   │   │   ├── 📁 api/              # API Routes (thin layer)
│   │   │   │   ├── 📁 auth/
│   │   │   │   │   └── 📁 [...nextauth]/
│   │   │   │   │
│   │   │   │   ├── 📁 class/
│   │   │   │   │   └── 📁 session/
│   │   │   │   │       └── 📄 route.ts        # ClassIn + paricall
│   │   │   │   │
│   │   │   │   ├── 📁 content/
│   │   │   │   │   ├── 📁 canva/
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 skool/
│   │   │   │   │   │   └── 📁 webhook/
│   │   │   │   │   │       └── 📄 route.ts
│   │   │   │   │   ├── 📁 twinkl/
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   ├── 📁 pinterest/
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📁 [other-plugins]/
│   │   │   │   │
│   │   │   │   ├── 📁 social/
│   │   │   │   │   ├── 📁 share/
│   │   │   │   │   │   └── 📄 route.ts        # Native share + prefill
│   │   │   │   │   └── 📁 whatsapp/           # NEW
│   │   │   │   │       ├── 📁 send/
│   │   │   │   │       ├── 📁 template/
│   │   │   │   │       └── 📁 webhook/
│   │   │   │   │
│   │   │   │   ├── 📁 sync/                   # NEW: Offline sync
│   │   │   │   │   ├── 📁 queue/
│   │   │   │   │   ├── 📁 resolve/
│   │   │   │   │   └── 📁 status/
│   │   │   │   │
│   │   │   │   └── 📁 webhooks/
│   │   │   │       ├── 📁 classin/
│   │   │   │       ├── 📁 whatsapp/           # NEW
│   │   │   │       └── 📁 [other-platforms]/
│   │   │   │
│   │   │   ├── 📁 layout.tsx
│   │   │   └── 📁 loading.tsx
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── 📁 ui/               # shadcn/ui components
│   │   │   ├── 📁 live/             # Streaming components
│   │   │   │   ├── 📄 GoLiveButton.tsx          # Main CTA
│   │   │   │   ├── 📄 PlatformSelector.tsx
│   │   │   │   ├── 📄 ClassInEmbed.tsx
│   │   │   │   └── 📄 RecordingPlayer.tsx
│   │   │   │
│   │   │   ├── 📁 content/          # Content Studio
│   │   │   │   ├── 📄 PluginCard.tsx
│   │   │   │   ├── 📄 TwinklSearch.tsx
│   │   │   │   ├── 📄 PinterestPin.tsx
│   │   │   │   └── 📄 ContentLibrary.tsx
│   │   │   │
│   │   │   ├── 📁 whatsapp/         # NEW: WhatsApp components
│   │   │   │   ├── 📄 WhatsAppConnect.tsx
│   │   │   │   ├── 📄 ChatThread.tsx
│   │   │   │   ├── 📄 MessageComposer.tsx
│   │   │   │   ├── 📄 ContactList.tsx
│   │   │   │   ├── 📄 TemplateSelector.tsx
│   │   │   │   └── 📄 BroadcastSender.tsx
│   │   │   │
│   │   │   ├── 📁 dao/              # DAO components
│   │   │   │   ├── 📄 ProposalCard.tsx
│   │   │   │   ├── 📄 VoteButton.tsx
│   │   │   │   ├── 📄 TreasuryView.tsx
│   │   │   │   ├── 📄 StakingPanel.tsx
│   │   │   │   └── 📄 CreateProposalForm.tsx
│   │   │   │
│   │   │   ├── 📁 offline/          # NEW: Offline components
│   │   │   │   ├── 📄 OfflineIndicator.tsx
│   │   │   │   ├── 📄 SyncStatus.tsx
│   │   │   │   ├── 📄 PendingActions.tsx
│   │   │   │   └── 📄 ConflictResolver.tsx
│   │   │   │
│   │   │   ├── 📁 agents/
│   │   │   │   ├── 📄 HermesChat.tsx
│   │   │   │   └── 📄 SpaceBotBuilder.tsx
│   │   │   │
│   │   │   └── 📁 shared/
│   │   │       ├── 📄 Sidebar.tsx
│   │   │       ├── 📄 Header.tsx
│   │   │       └── 📄 FeatureFlagGuard.tsx
│   │   │
│   │   ├── 📁 hooks/                # React hooks
│   │   │   ├── 📄 useAuth.ts
│   │   │   ├── 📄 useLiveSession.ts
│   │   │   ├── 📄 useContentPlugins.ts
│   │   │   ├── 📄 useWhatsApp.ts              # NEW
│   │   │   ├── 📄 useOffline.ts               # NEW
│   │   │   ├── 📄 useSync.ts                  # NEW
│   │   │   ├── 📄 useDAO.ts
│   │   │   ├── 📄 useStaking.ts
│   │   │   ├── 📄 useICP.ts
│   │   │   └── 📄 useFeatureFlags.ts
│   │   │
│   │   ├── 📁 lib/                  # Utilities
│   │   │   ├── 📁 auth/
│   │   │   │   ├── 📄 supabase.ts
│   │   │   │   ├── 📄 icp.ts
│   │   │   │   └── 📄 roles.ts
│   │   │   │
│   │   │   ├── 📁 live/
│   │   │   │   ├── 📄 classin-client.ts
│   │   │   │   └── 📄 paricall-client.ts
│   │   │   │
│   │   │   ├── 📁 content/
│   │   │   │   ├── 📄 plugins.ts              # Plugin registry
│   │   │   │   ├── 📄 canva.ts
│   │   │   │   ├── 📄 skool.ts
│   │   │   │   ├── 📄 twinkl.ts
│   │   │   │   ├── 📄 pinterest.ts
│   │   │   │   └── 📄 [other-plugins].ts
│   │   │   │
│   │   │   ├── 📁 whatsapp/                   # NEW
│   │   │   │   ├── 📄 client.ts               # WhatsApp Business API
│   │   │   │   ├── 📄 templates.ts            # Message templates
│   │   │   │   ├── 📄 webhooks.ts             # Webhook handlers
│   │   │   │   └── 📄 broadcast.ts            # Bulk messaging
│   │   │   │
│   │   │   ├── 📁 offline/                    # NEW
│   │   │   │   ├── 📄 db.ts                   # Local DB (Dexie/RxDB)
│   │   │   │   ├── 📄 sync.ts                 # Sync engine
│   │   │   │   ├── 📄 queue.ts                # Action queue
│   │   │   │   └── 📄 conflict-resolution.ts  # CRDT logic
│   │   │   │
│   │   │   ├── 📁 dao/
│   │   │   │   ├── 📄 client.ts               # DAO canister client
│   │   │   │   ├── 📄 staking.ts              # Staking logic
│   │   │   │   ├── 📄 voting.ts               # Voting logic
│   │   │   │   └── 📄 proposals.ts            # Proposal management
│   │   │   │
│   │   │   ├── 📁 icp/
│   │   │   │   ├── 📄 agent.ts                # ICP agent setup
│   │   │   │   ├── 📄 canisters.ts            # Canister IDs
│   │   │   │   ├── 📄 identity.ts             # Identity management
│   │   │   │   └── 📄 declarations/           # Generated types
│   │   │   │
│   │   │   ├── 📄 feature-flags.ts
│   │   │   ├── 📄 utils.ts
│   │   │   └── 📄 constants.ts
│   │   │
│   │   ├── 📁 stores/               # State management
│   │   │   ├── 📄 auth-store.ts
│   │   │   ├── 📄 live-store.ts
│   │   │   ├── 📄 content-store.ts
│   │   │   ├── 📄 whatsapp-store.ts           # NEW
│   │   │   ├── 📄 offline-store.ts            # NEW
│   │   │   ├── 📄 dao-store.ts
│   │   │   ├── 📄 staking-store.ts
│   │   │   └── 📄 icp-store.ts
│   │   │
│   │   ├── 📁 workers/              # NEW: Service Workers
│   │   │   ├── 📄 service-worker.ts           # Main SW
│   │   │   ├── 📄 sync.worker.ts              # Background sync
│   │   │   └── 📄 push.worker.ts              # Push notifications
│   │   │
│   │   ├── 📁 public/
│   │   │   ├── 📄 manifest.json               # PWA manifest
│   │   │   ├── 📄 sw-register.js              # SW registration
│   │   │   └── 📁 icons/
│   │   │
│   │   ├── 📄 next.config.js
│   │   ├── 📄 tailwind.config.ts
│   │   ├── 📄 tsconfig.json
│   │   └── 📄 package.json
│   │
│   └── 📁 mobile/                   # React Native (Phase 2)
│       └── 📄 [future]
│
├── 📁 packages/
│   ├── 📁 shared/                   # Shared types & constants
│   │   ├── 📁 src/
│   │   │   ├── 📁 types/
│   │   │   │   ├── 📄 platform.ts             # All platform types
│   │   │   │   ├── 📄 icp.ts                  # ICP types
│   │   │   │   ├── 📄 dao.ts                  # DAO types
│   │   │   │   ├── 📄 staking.ts              # Staking types
│   │   │   │   ├── 📄 whatsapp.ts             # NEW
│   │   │   │   ├── 📄 offline.ts              # NEW
│   │   │   │   └── 📄 api.ts
│   │   │   │
│   │   │   ├── 📁 constants/
│   │   │   │   ├── 📄 platforms.ts
│   │   │   │   ├── 📄 dao.ts
│   │   │   │   └── 📄 staking.ts
│   │   │   │
│   │   │   └── 📄 index.ts
│   │   └── 📄 package.json
│   │
│   ├── 📁 ui/                       # Shared UI components
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   ├── 📁 hooks/
│   │   │   └── 📁 utils/
│   │   └── 📄 package.json
│   │
│   ├── 📁 config/                   # Shared configuration
│   │   ├── 📁 src/
│   │   │   ├── 📁 eslint/
│   │   │   ├── 📁 typescript/
│   │   │   └── 📁 tailwind/
│   │   └── 📄 package.json
│   │
│   └── 📁 offline-sync/             # NEW: Offline sync package
│       ├── 📁 src/
│       │   ├── 📄 crdt.ts                     # CRDT implementation
│       │   ├── 📄 sync-engine.ts              # Sync orchestration
│       │   ├── 📄 local-db.ts                 # IndexedDB wrapper
│       │   └── 📄 queue.ts                    # Action queue
│       └── 📄 package.json
│
├── 📁 canisters/                    # ICP Canisters
│   ├── 📁 identity/                 # Internet Identity integration
│   │   ├── 📄 main.mo
│   │   └── 📄 types.mo
│   │
│   ├── 📁 teacher_token/            # TeacherToken (ICRC-1)
│   │   ├── 📄 main.mo               # Token logic
│   │   ├── 📄 staking.mo            # STAKING SYSTEM ✅
│   │   ├── 📄 rewards.mo            # Staking rewards
│   │   └── 📄 types.mo
│   │
│   ├── 📁 dao/                      # DAO Governance ✅
│   │   ├── 📄 main.mo               # Core DAO logic
│   │   ├── 📄 proposals.mo          # Proposal management
│   │   ├── 📄 voting.mo             # Voting logic
│   │   ├── 📄 treasury.mo           # Treasury management
│   │   ├── 📄 staking_integration.mo# Stake-weighted voting
│   │   └── 📄 types.mo
│   │
│   ├── 📁 funding_pool/             # ckUSDC Funding
│   │   ├── 📄 main.mo
│   │   ├── 📄 deposits.mo
│   │   ├── 📄 proposals.mo          # Spending proposals
│   │   ├── 📄 payouts.mo
│   │   └── 📄 types.mo
│   │
│   ├── 📁 content_nft/              # Content as NFTs (ICRC-7)
│   │   ├── 📄 main.mo
│   │   ├── 📄 minting.mo
│   │   ├── 📄 marketplace.mo
│   │   └── 📄 types.mo
│   │
│   ├── 📁 whatsapp_bridge/          # NEW: WhatsApp ↔ ICP bridge
│   │   ├── 📄 main.mo
│   │   ├── 📄 messages.mo
│   │   ├── 📄 verification.mo
│   │   └── 📄 types.mo
│   │
│   └── 📁 shared/
│       ├── 📄 types.mo
│       └── 📄 utils.mo
│
├── 📁 agent-workers/                # AI Agents (Node.js)
│   ├── 📁 hermes-worker/
│   │   ├── 📁 src/
│   │   │   ├── 📁 skills/
│   │   │   └── 📁 integrations/
│   │   └── 📄 Dockerfile
│   │
│   └── 📁 spacebot-worker/
│       ├── 📁 src/
│       │   ├── 📁 generators/
│       │   └── 📁 validators/
│       └── 📄 Dockerfile
│
├── 📁 supabase/                     # Database
│   ├── 📁 migrations/
│   │   ├── 📄 001_initial.sql
│   │   ├── 📄 002_profiles.sql
│   │   ├── 📄 003_content.sql
│   │   ├── 📄 004_whatsapp.sql              # NEW
│   │   └── 📄 005_offline_sync.sql          # NEW
│   │
│   ├── 📁 functions/                # Edge functions
│   │   ├── 📄 whatsapp-webhook.ts           # NEW
│   │   └── 📄 sync-trigger.ts               # NEW
│   │
│   └── 📄 policies.sql
│
├── 📁 scripts/
│   ├── 📁 deploy/
│   ├── 📁 seed/
│   └── 📁 test/
│
├── 📁 docs/
│   ├── 📁 architecture/
│   ├── 📁 api/
│   └── 📁 deployment/
│
├── 📁 tests/
│   ├── 📁 e2e/
│   ├── 📁 integration/
│   └── 📁 canister/
│
├── 📄 dfx.json                      # ICP configuration
├── 📄 turbo.json                    # Turborepo config
├── 📄 pnpm-workspace.yaml
├── 📄 package.json
└── 📄 README.md
```

---

## 🛣️ Routing System (Perfect)

### Route Groups

```typescript
// Route Architecture

// 1. MARKETING (no auth)
(marketing)/
├── /                    # Landing page
├── /pricing
├── /about
└── /blog

// 2. AUTH (auth layout)
(auth)/
├── /login
├── /register
├── /onboarding          # 5-screen flow
│   ├── /step-1          # Profile
│   ├── /step-2          # Subjects/grades
│   ├── /step-3          # Connect platforms
│   ├── /step-4          # WhatsApp setup      # NEW
│   └── /step-5          # Complete
└── /icp-auth            # Internet Identity

// 3. DASHBOARD (protected, sidebar)
(dashboard)/
├── /                    # Overview
│
├── /live/               # Streaming hub
│   ├── /                # Platform selector
│   ├── /classin/
│   │   ├── /schedule
│   │   ├── /start
│   │   └── /join/[id]
│   └── /paricall/       # Same structure
│
├── /content/            # Content Studio
│   ├── /                # Plugin grid
│   ├── /canva
│   ├── /skool
│   ├── /twinkl
│   ├── /pinterest
│   └── /library
│
├── /community/          # Social + Comms
│   ├── /whatsapp/       # NEW: WhatsApp hub
│   │   ├── /            # Chat list
│   │   ├── /[chatId]    # Conversation
│   │   └── /broadcast   # Bulk messaging
│   └── /share
│
├── /dao/                # DAO Governance ✅
│   ├── /                # Proposals list
│   ├── /proposals/
│   │   ├── /create
│   │   └── /[id]/
│   │       └── /vote
│   ├── /treasury
│   └── /staking         # STAKING SYSTEM ✅
│       ├── /
│       └── /unstake
│
├── /funding/            # ckUSDC pools
│   ├── /                # My pools
│   ├── /create
│   └── /[poolId]/
│       ├── /deposit
│       ├── /withdraw
│       └── /proposals
│
├── /agents/
│   ├── /                # Agent selector
│   ├── /hermes
│   └── /spacebot
│
├── /offline/            # NEW: Offline status
│   └── /                # Sync status, pending actions
│
└── /settings

// 4. API ROUTES (thin layer)
api/
├── /auth/
├── /class/session
├── /content/
│   ├── /canva
│   ├── /skool/webhook
│   ├── /twinkl
│   └── /pinterest
├── /social/
│   ├── /share
│   └── /whatsapp/       # NEW
│       ├── /send
│       ├── /template
│       └── /webhook
├── /sync/               # NEW
│   ├── /queue
│   └── /resolve
├── /dao/                # DAO proxy
│   ├── /proposals
│   ├── /vote
│   └── /staking
└── /webhooks/
    └── /whatsapp        # NEW
```

---

## 🔄 State Management (Fabulous)

### Multi-Layer Architecture

```typescript
// Layer 1: ICP Canisters (Blockchain - Source of Truth)
// - Identity
// - TeacherToken balances
// - Staking positions
// - DAO proposals & votes
// - Funding pool balances
// - Content NFT ownership

// Layer 2: Supabase (Operational)
// - User profiles
// - Session data
// - Content metadata
// - WhatsApp conversations  // NEW
// - Sync status             // NEW

// Layer 3: Local-First DB (Offline)  // NEW
// - IndexedDB via Dexie/RxDB
// - CRDT for conflict resolution
// - Action queue
// - Optimistic updates

// Layer 4: Zustand (Frontend State)
// - UI state
// - Form state
// - Navigation state
// - Real-time presence

// Layer 5: TanStack Query (Server Cache)
// - API response caching
// - Background sync
// - Automatic invalidation
```

### Store Structure

```typescript
// stores/index.ts

export const useAuthStore = create<AuthState>((set, get) => ({
  // ICP Identity
  identity: null,
  principal: null,
  
  // Supabase session
  session: null,
  
  // Profile
  profile: null,
  
  // Auth methods
  loginWithICP: async () => {...},
  loginWithEmail: async (email, password) => {...},
  logout: async () => {...},
}));

export const useWhatsAppStore = create<WhatsAppState>((set, get) => ({  // NEW
  // Connection status
  isConnected: false,
  qrCode: null,
  
  // Conversations
  chats: [],
  selectedChat: null,
  
  // Messages (local-first)
  messages: new Map(),
  
  // Methods
  connect: async () => {...},
  sendMessage: async (chatId, text) => {...},
  syncMessages: async () => {...},  // Background sync
}));

export const useOfflineStore = create<OfflineState>((set, get) => ({  // NEW
  // Connectivity
  isOnline: navigator.onLine,
  isSyncing: false,
  
  // Pending actions
  pendingActions: [],
  
  // Sync status
  lastSync: null,
  syncErrors: [],
  
  // Methods
  queueAction: (action) => {...},
  processQueue: async () => {...},
  resolveConflict: (conflict) => {...},
}));

export const useDAOStore = create<DAOState>((set, get) => ({  // ✅ FROM BLUEPRINT
  // Proposals
  proposals: [],
  selectedProposal: null,
  
  // User's stake
  stakePosition: null,
  
  // Treasury
  treasuryBalance: 0n,
  
  // Voting power
  votingPower: 0,
  
  // Methods
  createProposal: async (proposal) => {...},
  vote: async (proposalId, support) => {...},
  stake: async (amount, duration) => {...},
  unstake: async (positionId) => {...},
  claimRewards: async () => {...},
}));

export const useStakingStore = create<StakingState>((set, get) => ({  // ✅ FROM BLUEPRINT
  // Pool info
  totalStaked: 0n,
  rewardRate: 0,
  
  // User positions
  positions: [],
  
  // Rewards
  pendingRewards: 0n,
  
  // Methods
  calculateAPY: () => {...},
  stake: async (amount, lockPeriod) => {...},
  unstake: async (positionId) => {...},
  compound: async () => {...},
}));
```

---

## 🧱 Abstraction Layer (Incredible)

### Platform Abstraction

```typescript
// packages/shared/src/types/platform.ts

// Universal platform interface
interface IPlatform {
  id: string;
  name: string;
  category: 'live' | 'content' | 'social' | 'communication';
  region?: 'global' | 'russia' | 'china' | 'local';
  
  // Auth
  authenticate(): Promise<AuthResult>;
  disconnect(): Promise<void>;
  
  // Capabilities
  capabilities: PlatformCapabilities;
}

// Live streaming
interface ILivePlatform extends IPlatform {
  scheduleSession(details: SessionDetails): Promise<Session>;
  startSession(sessionId: string): Promise<StreamConfig>;
  joinSession(sessionId: string): Promise<JoinUrl>;
  endSession(sessionId: string): Promise<void>;
  getRecording(sessionId: string): Promise<Recording>;
}

// Content
interface IContentPlatform extends IPlatform {
  search(query: string): Promise<Content[]>;
  importContent(contentId: string): Promise<ContentItem>;
  createFromTemplate(template: Template): Promise<ContentItem>;
}

// Communication (NEW)
interface ICommunicationPlatform extends IPlatform {
  sendMessage(recipient: string, message: string): Promise<void>;
  broadcast(message: string, recipients: string[]): Promise<void>;
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<Message[]>;
}

// WhatsApp Implementation (NEW)
class WhatsAppPlatform implements ICommunicationPlatform {
  id = 'whatsapp';
  name = 'WhatsApp';
  category = 'communication';
  
  // Uses WhatsApp Business API
  async sendMessage(recipient: string, message: string) {
    await whatsappApi.sendMessage({
      to: formatPhoneNumber(recipient),
      body: message,
      messagingServiceSid: process.env.TWILIO_SERVICE_SID,
    });
  }
  
  // Bulk messaging for parents
  async broadcast(message: string, recipients: string[]) {
    // Queue messages to avoid rate limits
    const queue = recipients.map(phone => 
      () => this.sendMessage(phone, message)
    );
    await processQueue(queue, { concurrency: 10 });
  }
}

// Plugin Registry
class PlatformRegistry {
  private platforms = new Map<string, IPlatform>();
  
  register(platform: IPlatform) {
    this.platforms.set(platform.id, platform);
  }
  
  getLivePlatforms(): ILivePlatform[] {
    return Array.from(this.platforms.values())
      .filter(p => p.category === 'live') as ILivePlatform[];
  }
  
  getCommunicationPlatforms(): ICommunicationPlatform[] {  // NEW
    return Array.from(this.platforms.values())
      .filter(p => p.category === 'communication') as ICommunicationPlatform[];
  }
}
```

### Offline Abstraction (NEW)

```typescript
// packages/offline-sync/src/sync-engine.ts

interface ISyncEngine {
  // Local operations
  create<T>(collection: string, data: T): Promise<LocalDocument<T>>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  
  // Sync operations
  sync(): Promise<SyncResult>;
  resolveConflict(conflict: Conflict): Promise<Resolution>;
  
  // Status
  getPendingCount(): number;
  getSyncStatus(): SyncStatus;
}

class CRDTSyncEngine implements ISyncEngine {
  private localDb: LocalDatabase;
  private remoteClient: SupabaseClient;
  
  async create<T>(collection: string, data: T) {
    // 1. Generate unique ID
    const id = generateId();
    
    // 2. Add metadata
    const doc: LocalDocument<T> = {
      id,
      data,
      _meta: {
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        revision: 1,
        status: 'pending',
      },
    };
    
    // 3. Save locally first
    await this.localDb.collection(collection).add(doc);
    
    // 4. Queue for sync
    await this.queueForSync(collection, 'create', doc);
    
    return doc;
  }
  
  async sync(): Promise<SyncResult> {
    // 1. Get pending actions
    const pending = await this.getPendingActions();
    
    // 2. Push to server
    for (const action of pending) {
      try {
        await this.pushAction(action);
        await this.markSynced(action.id);
      } catch (error) {
        await this.handleSyncError(action, error);
      }
    }
    
    // 3. Pull updates
    const serverUpdates = await this.pullUpdates();
    
    // 4. Resolve conflicts
    const conflicts = await this.detectConflicts(serverUpdates);
    for (const conflict of conflicts) {
      await this.resolveConflict(conflict);
    }
    
    return { pushed: pending.length, pulled: serverUpdates.length };
  }
}
```

---

## 🎯 Separation of Concerns (Fantastic)

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  Next.js Components, Pages, Hooks, Stores                      │
│  - UI components (shadcn/ui)                                    │
│  - Page components                                              │
│  - Custom hooks                                                 │
│  - Zustand stores                                               │
├─────────────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                             │
│  Use Cases, Application Services, DTOs                         │
│  - StartLiveSessionUseCase                                      │
│  - CreateContentUseCase                                         │
│  - SendWhatsAppMessageUseCase                    // NEW         │
│  - CreateProposalUseCase                         // DAO         │
│  - StakeTokensUseCase                            // STAKING     │
│  - SyncOfflineDataUseCase                        // NEW         │
├─────────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                                │
│  Entities, Value Objects, Domain Events, Domain Services       │
│  - Teacher, Student, Lesson, Content                           │
│  - WhatsAppConversation, Message                 // NEW         │
│  - Proposal, Vote, Treasury                      // DAO         │
│  - StakePosition, RewardDistribution             // STAKING     │
│  - SyncConflict, CRDTOperation                   // NEW         │
│  - Platform interfaces (ILivePlatform, etc.)                    │
├─────────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                           │
│  External Adapters, ICP Canisters, APIs, DB                    │
│  - ClassInAdapter, CanvaAdapter, etc.                          │
│  - WhatsAppBusinessAdapter                       // NEW         │
│  - LocalDatabaseAdapter (IndexedDB)              // NEW         │
│  - ICPAgent (canister clients)                                  │
│  - SupabaseClient                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Rule
```
Domain ← Application ← Infrastructure
Domain has NO external dependencies!
```

---

## ✅ WHAT'S ACTUALLY IN v7 (Confirmed)

| Feature | Status | Location |
|---------|--------|----------|
| **ClassIn** | ✅ | `apps/web/lib/live/classin.ts` |
| **Canva** | ✅ | `apps/web/lib/content/canva.ts` |
| **Skool** | ✅ | `apps/web/lib/content/skool.ts` |
| **Twinkl** | ✅ | `apps/web/lib/content/twinkl.ts` |
| **Pinterest** | ✅ | `apps/web/lib/content/pinterest.ts` |
| **Social Share** | ✅ | `apps/web/lib/social/share.ts` |
| **paricall** | ✅ | `apps/web/lib/live/paricall.ts` |
| **ICP Phase 2** | ✅ | `canisters/` |
| **STAKING** | ✅ | `canisters/teacher_token/staking.mo` |
| **DAO** | ✅ | `canisters/dao/` |
| **WhatsApp** | 🆕 NEW | `apps/web/lib/whatsapp/`, `canisters/whatsapp_bridge/` |
| **Offline-First** | 🆕 NEW | `packages/offline-sync/`, `apps/web/lib/offline/` |

---

## 🔥 WHAT ELSE WE NEED TO BUILD

### 1. **Critical Infrastructure**
- [ ] **Service Worker** for offline capability
- [ ] **Background Sync** API integration
- [ ] **Push Notifications** for WhatsApp + class reminders
- [ ] **IndexedDB schema** design
- [ ] **CRDT implementation** for conflict resolution

### 2. **WhatsApp Integration**
- [ ] **Twilio WhatsApp Business** setup
- [ ] **Message templates** (approval required)
- [ ] **Webhook handlers** for incoming messages
- [ ] **Contact sync** from Supabase
- [ ] **Broadcast system** for parent notifications

### 3. **Offline-First Features**
- [ ] **Optimistic UI** updates
- [ ] **Action queue** management
- [ ] **Conflict resolution** UI
- [ ] **Data seeding** for offline use
- [ ] **Sync status** indicator

### 4. **Staking & DAO (Detailed)**
- [ ] **Staking UI** (stake amount, duration selector)
- [ ] **Rewards calculator** (estimated APY)
- [ ] **Lock period** visualization
- [ ] **Proposal creation** form
- [ ] **Voting interface** (yes/no/abstain)
- [ ] **Treasury dashboard** (transparent spending)
- [ ] **Delegation** (vote by proxy)

### 5. **Mobile Experience**
- [ ] **PWA manifest** + icons
- [ ] **Mobile-optimized** layouts
- [ ] **Touch gestures** for common actions
- [ ] **Mobile offline** testing

### 6. **Load Shedding Resilience**
- [ ] **SMS fallback** when WhatsApp unavailable
- [ ] **Battery optimization** mode
- [ ] **Low-bandwidth** mode
- [ ] **Essential features** only toggle

### 7. **Russian Integration**
- [ ] VKontakte OAuth
- [ ] Telegram Bot setup
- [ ] Yandex.Zen API
- [ ] Odnoklassniki integration

### 8. **Testing**
- [ ] **Offline mode** testing (Chrome DevTools)
- [ ] **Sync conflict** scenarios
- [ ] **WhatsApp rate limiting** handling
- [ ] **ICP canister** integration tests

---

## 🚀 Implementation Priority

### Week 1: Foundation
1. Service Worker + Offline DB
2. WhatsApp Business API setup
3. Staking UI scaffold

### Week 2: Core Features
1. Offline sync engine
2. WhatsApp messaging
3. DAO voting interface

### Week 3: Polish
1. Conflict resolution UI
2. Mobile optimization
3. Load shedding resilience

---

**Now you have the COMPLETE architecture. What should we build first?** 🎯
