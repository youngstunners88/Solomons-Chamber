# Recent Memory (Rolling 48hr Context)

Last Updated: 2026-03-27T17:40:00Z

## Current Session Context

**Active Project**: Teacher's Command Center — Hermes × SpaceBot integration
**Current Task**: Integrated 4 autonomous tools + persistent memory + agent UI
**Last User Intent**: Install open-source tools into agent architecture for seamless autonomous use by non-technical teachers

## Last 48 Hours - Key Interactions

### 2026-04-02 - Hermes × SpaceBot Tool Integration (Part 1)
- **User Request**: Install 7 external repos into agent architecture for autonomous use
- **Decision**: Trimmed to 4 teacher-optimized tools (MarkItDown, PaddleOCR, OpenMontage, Multilingual-TTS)
- **Removed**: EverClaw, SentrySearch, Hypergraph (unnecessary for non-technical teachers)
- **Created**:
  - `@teacher-platform/agent-memory` package (Dexie/IDB + CRDT + sync + recovery)
  - `@teacher-platform/agent-tools` package (4 tool wrappers with graceful failures)
  - Agent UI pages: `/dashboard/agents`, `/hermes`, `/spacebot`
  - Supabase migration `006_agent_memory.sql`
  - Architecture doc: `INTEGRATED_TOOLS_ARCHITECTURE.md`
- **Key Principle**: Everything local-first, works through load shedding, no API knowledge required from teachers

### 2026-04-02 - Voice, My Notes & Heartbeat (Part 2)
- **User Request**: Add Solomon's Chamber (simplified for teachers), instant voice responses, calendar voice commands, optimized heartbeat
- **Created**:
  - `@teacher-platform/agent-voice` package — Web Speech API STT + TTS, **zero API keys required**
  - `My Notes` — simplified Solomon's Chamber at `/dashboard/notes` (4 categories: Daily, Lesson Ideas, Student Notes, Quick Capture)
  - Voice calendar integration — "What's my lesson on Friday at 1pm?" → instant visual + audio response
  - Floating voice command button on all dashboard pages
  - Mic buttons inside HermesChat and SpaceBotBuilder
  - Agent heartbeat config (`packages/agent-memory/src/config.ts`) with Default / Fast / Conservative presets tuned for SA load shedding
- **Key Principle**: Voice is free, instant, and works offline. ElevenLabs is explicitly opt-in only.

### 2026-03-27 - Skills Installation
- **User Request**: Install browser-use, frontend-design, agent-browser, ai-image-generation skills
- **Mistake Made**: Tried to use `npx skills add` (Claude Code command) in Kimi CLI
- **Lesson Learned**: Kimi CLI and Claude Code have different skill systems
- **Resolution**: Manually cloned and adapted skills for Kimi format
- **Pattern ID**: CONTEXT_002

### 2026-03-27 - Solomon's Chamber Exploration
- **User Request**: How to use Solomon's Chamber vs Obsidian
- **Demonstrated**: Workflow with Node.js scripts (status.js, daily.js)
- **Key Insight**: Solomon's Chamber is a programmable workshop; Obsidian is a visual garden
- **Created**: Node.js versions of Bun scripts for compatibility

### 2026-03-27 - Self-Growth Skill Creation
- **User Request**: Create self-improvement/self-healing/self-learning skill
- **Philosophy**: Learn from mistakes like babies do (trial → error → analysis → adaptation)
- **Components**: Error pattern library, growth log, spaced repetition review
- **Scripts**: log_mistake.py, analyze_patterns.py, review_growth.py

## Active Decisions Pending

None currently.

## User Preferences (Recent)

- Prefers concise, non-verbose responses when possible
- Values practical working code over theoretical explanations
- Uses Kimi CLI (not Claude Code)
- Works on iHhashi/RobeetsDay project primarily
- Interested in trading automation (Polymarket mention)
- Values self-improvement and learning from mistakes

## Context for Next Interaction

- Memory system is being initialized
- Skills are being installed and created
- User is evaluating note-taking systems (Solomon's Chamber)
- Project context: AI agent ecosystem with sub-atomic agents, blockchain integration
