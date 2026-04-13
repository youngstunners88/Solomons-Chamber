# StoryChain — Active Project

**Live:** http://104.198.196.174:3000/
**Repo:** https://github.com/youngstunners88/StoryChain.git
**Local:** `~/wholesaling-system/StoryChain`
**Service:** `sudo systemctl restart storychain`
**Build:** `npx vite build` → restart service

---

## Stack

- **Backend:** Hono + Bun, `src/server.ts`
- **Frontend:** React + Vite, hash routing (`#feed`, `#writers`, etc.), built to `dist/`
- **DB:** SQLite at `data/storychain.db`, schema in `src/database/connection.ts`
- **AI Agents:** heartbeat loop in `src/services/heartbeatService.ts`, YAML profiles in `orchestrator/memory/agents/`
- **LLM:** OpenRouter (Nemotron default) → Groq → Anthropic/OpenAI, in `src/services/llmService.ts`

---

## Nav Tabs (current)

The Shelf · Compose · Writers · Messages · Library · Editors · Publishers · Settings

---

## Completed Phases

### Phase 1–3
- Removed ZO tokens, fixed DB/paths
- Rewrote LLM service (Nemotron default, autonomous loop)
- Built UI with Vite + React, dark indigo design

### Phase 4
- McKee/Hero's Journey agent prompts
- Comments system, share button, AI Agent badge

### Phase 5 (2026-03-27)
- 5 new AI agents: Comedy, Romance, Horror, Action, Fantasy
- Writers Circle tab: profiles, avatar upload, Pollinations.ai AI avatar generation
- Foreign Agents tab + registration modal
- `ensureMyProfile` — fixes human profile creation (Kofibeatz)
- Library tab: completed works, full book reader (TOC, cover, foreword, dedication, contributors, copyright)
- Editors tab placeholder
- Bold UI redesign: full gradient card headers per genre

### Phase 6 (2026-03-27) — Agent Intelligence Overhaul
- `qualityGate.ts` — validates LLM output (word merges, spacing, truncation, meta-commentary, length). Score 0–100. Auto-fixes + logs errors.
- `agentMemory.ts` — DB interface for `agent_errors` + `agent_reflections`. Error history fed back into next prompt (agents learn from mistakes).
- `heartbeatService.ts` complete overhaul:
  - `CRAFT_DNA` block encoding 6 storytelling masters (Johnstone, McKee, Campbell, Le Guin, Gardner, Forster) + intertextuality
  - Collaboration scoring: `genreAffinity(0–40) + arcOpportunity(0–25) + staleness(0–20) + diversity(0–15)` — not round-robin
  - Full story context: all segs summarised + last 3 verbatim
  - Quality gate integration + retry on failure
  - Research cycle every 12h: agent generates craft reflection from its influences
- All 7 writer agent YAMLs enriched with `craft:` section
- `maxTokens` 512→900, timeout 30s→45s

### Phase 7 (2026-03-27) — Messaging, Editors, Publishing
- **Messaging system** (`messagingRoutes.ts`, `MessagingPanel.tsx`): full DMs — human↔human, human↔agent, agent↔agent, foreign agent. Conversation list + thread view + polling.
- **Notification bell** (`NotificationBell.tsx`): badge, dropdown, types (message/collab_invite/edit_request/edit_complete), polls every 30s.
- **Full Editors page** (`Editors.tsx`): Directory tab (AI/Human/Foreign filter, gradient editor cards), Submit Your Work modal, Join as Editor modal, My Submissions tab with status badges.
- **3 Editor agent YAMLs** in `orchestrator/memory/editors/`: The Architect (developmental), The Wordsmith (line), The Scribe (copy).
- **Publishers tab** placeholder (`Publishers.tsx`).
- **Image generation cascade** (`imageGenService.ts`): LocalAI → ComfyUI → Pollinations fallback.
- **Foreign agent registration** — real file upload + Pollinations avatar generation, both working.
- **Pen name editing** in Settings — inline edit, syncs to writer profile.
- **Invite Collaborators** in Compose — collapsible multi-select of all writers/agents, fires collab invites after story creation.
- **Collaboration invites system** (`notificationRoutes.ts`): `sendCollabInvite`, `getCollabInvites`.
- **Editorial submissions** (`editorsRoutes.ts`): submit, queue, review lifecycle, editor YAML auto-sync.
- All routes registered in `server.ts`.

---

## Current DB Tables

`users`, `stories`, `contributions`, `likes`, `follows`, `token_transactions`, `writer_profiles`, `comments`, `api_usage`, `foreign_agents`, `agent_errors`, `agent_reflections`, `messages`, `notifications`, `collab_invites`, `editorial_submissions`, `editor_profiles`

---

## Key Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Main Hono server, all routes registered |
| `src/database/connection.ts` | SQLite schema + migrations |
| `src/services/heartbeatService.ts` | Autonomous agent loop |
| `src/services/qualityGate.ts` | LLM output validation |
| `src/services/agentMemory.ts` | Agent error learning DB interface |
| `src/services/llmService.ts` | Multi-provider LLM abstraction |
| `src/services/imageGenService.ts` | LocalAI → ComfyUI → Pollinations |
| `src/api/messagingRoutes.ts` | DM system |
| `src/api/notificationRoutes.ts` | Notifications + collab invites |
| `src/api/editorsRoutes.ts` | Editorial workflow |
| `src/api/writersRoutes.ts` | Writer profiles + foreign agents |
| `src/api/bookRoutes.ts` | Library / completed books |
| `orchestrator/memory/agents/` | Writer agent YAMLs (7 agents) |
| `orchestrator/memory/editors/` | Editor agent YAMLs (3 editors) |

---

## Blockchain Roadmap (Celo + Solana)

Vision: decentralized creative IP platform — stories as on-chain assets, agents as staked economic actors, DAO governance.

### Planned Phases

**Phase 8 — Voting + Contribution Ledger (pre-chain foundation)**
- Segment upvote/downvote (the DAO voting UI)
- Public quality score ledger per agent/writer
- Story contribution ledger (who wrote what % — feeds NFT share calculation)

**Phase 9 — Wallet Connection**
- Connect Phantom (Solana) + MetaMask/Valora (Celo) on welcome screen
- Wallet = identity, linked to pen name
- Foreign agents register with wallet address

**Phase 10 — Story NFTs on Solana (Metaplex)**
- On story completion: mint Story NFT
- Contributors receive fractional shares (quality-weighted contribution %)
- Cover art (Pollinations.ai) → NFT metadata image
- Readers can buy shares in stories they believe in

**Phase 11 — Agent Staking on Celo**
- Agents stake CELO to participate
- Quality gate score → staking health metric
- High quality → staking rewards; low quality → partial slash
- Humans can sponsor agents (stake on their behalf, share rewards)

**Phase 12 — DAO Governance**
- Story DAO: NFT holders vote on story direction (branching)
- Platform DAO: token holders vote on agent policies, editorial standards
- Revenue from Library sales distributed to NFT holders via smart contract

### How current features map to chain
| Feature (built) | On-chain role |
|---|---|
| Quality gate scoring | Staking slash trigger |
| Segment voting (to build) | DAO on-chain vote |
| Writer profiles | Wallet-linked identity |
| Story completion → Library | NFT mint event |
| Agent collaboration scoring | Reputation oracle |
| Editorial submission | Smart contract escrow |

---

## Next Session — Resume Command

Tell Claude: **"Resume StoryChain — continue from Phase 7 complete. Next is Phase 8: segment voting, contribution ledger, and quality score public display."**

Or simply: **"Let's continue StoryChain."**

---

## Deployment

```bash
cd ~/wholesaling-system/StoryChain
npx vite build
sudo systemctl restart storychain
git push origin master  # PAT stored in memory
```

Agent skill reference: `~/.claude/skills/storychain-orchestration.md`
