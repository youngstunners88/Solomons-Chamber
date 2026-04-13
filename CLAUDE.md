# 🚨🚨🚨 MANDATORY STARTUP PROTOCOL - READ THIS FIRST 🚨🚨🚨

## ⚠️ BEFORE YOU DO ANYTHING - FOLLOW THIS EXACTLY ⚠️

### STEP 1: READ CLAUDE.md (This File)
**You are reading it now. Good. Continue to Step 2.**

### STEP 2: CHECK SOLOMON'S CHAMBER FOR PREVIOUS WORK
```bash
# Run this IMMEDIATELY - NO EXCEPTIONS
ls -la /home/teacherchris37/Solomons-Chamber/09-Agent-Sessions/current/
cat /home/teacherchris37/Solomons-Chamber/memory/YBTM_WORKSPACE_STATE.md 2>/dev/null || echo "No YBTM state"
```

### STEP 3: CHECK FOR ACTIVE TASKS
- Look for `TASK-*.md` files in `09-Agent-Sessions/current/`
- If found, READ THEM before responding to user
- If incomplete tasks exist, ask user about them first

### STEP 4: CREATE TASK LOG BEFORE ANY WORK
```bash
# BEFORE executing ANY user request:
cd /home/teacherchris37/Solomons-Chamber
node 09-Agent-Sessions/session-logger.js init
```

Then create: `09-Agent-Sessions/current/TASK-{timestamp}-{description}.md`

---

## 🔴 NON-NEGOTIABLE RULES

1. **READ CLAUDE.md FIRST** - Every session, no exceptions
2. **CHECK SOLOMON'S CHAMBER SECOND** - See what we worked on before
3. **LOG EVERY TASK BEFORE STARTING** - Create task log file first
4. **LOG COMPLETION WHEN DONE** - Update task log with results
5. **NEVER ASSUME** - If unsure, read the files

**BREAKING THESE RULES = USER GETS PISSED OFF**

---

# Solomon's Chamber — Complete Guide

> Personal knowledge management, automation, and AI orchestration vault.
> This file is the authoritative guide for Claude Code operating inside this repo.

---

## What Is This Repo?

Solomon's Chamber is a structured personal vault that acts as:
- A **second brain** — capture, organize, and retrieve everything
- An **automation hub** — scripts, agents, and integrations
- An **AI creative studio** — voice, image, video, and story generation
- A **project command center** — for active real-world software projects

The vault lives at `~/Solomons-Chamber/`. The web dashboard runs on **port 4000**.

---

## Vault Layer Map

| Layer | Directory | Purpose |
|-------|-----------|---------|
| 00 | `00-Inbox/` | Capture everything first — raw notes, links, ideas |
| 01 | `01-Projects/` | Active and archived project workspaces |
| 02 | `02-Research/` | Topics, sources, reading notes, insights |
| 03 | `03-Trading/` | Signals, positions, analysis, trade logs |
| 04 | `04-Assets/` | Reusable skills, templates, adapters, prompts |
| 05 | `05-Self-Notes/` | Daily/weekly notes, journal entries, reflections |
| 06 | `06-Media/` | Voice memos, audio transcripts, media files |
| 07 | `07-Archive/` | Cold storage — old, inactive, or reference content |
| 08 | `08-Docs/` | Internal documentation for the vault itself |
| 10 | `10-Skills/` | Installed skill library (Claude Code skills) |
| 11 | `11-Voice-Agent/` | Voice-to-code, voice-to-web, voice-to-action agent |
| 12 | `12-Higgsfield-Studio/` | AI image and video generation via Higgsfield |
| — | `core/` | TypeScript runtime: router, state, events, layers |
| — | `web/` | Hono web dashboard at port 4000 |
| — | `scripts/` | Utility scripts (daily-note, rss-ingest, etc.) |

---

## Active External Projects

### StoryChain
- **Location:** `~/wholesaling-system/StoryChain/`
- **Live URL:** http://104.198.196.174:3000/
- **What it is:** A collaborative storytelling platform where users contribute to branching narrative chains.
- **Stack:** Node.js/TypeScript, likely Express or similar.
- **Integration point:** The vault has a `storychain` layer in `core/state.ts` and a dedicated entry in `core/layers.ts`. The web dashboard links to it. When working on StoryChain tasks, navigate to `~/wholesaling-system/StoryChain/`.

### Wholesaling Real Estate Automation
- **Location:** `~/wholesaling-system/`
- **What it is:** Automated real estate wholesaling workflows — lead generation, skip tracing, outreach, deal analysis.
- **Integration:** Uses Retell AI for outbound calls (see memory for API key). Scripts and automations may live in `01-Projects/` or `~/wholesaling-system/` itself.

### Mr. Garcia's Website / YBTM System
- **Location:** `~/youbecamethemoney/`
- **What it is:** "You Became The Money" — Daniel Garcia's brand website + evolving command-center system.
- **Status:** Foundation website locked. Prototype React dashboard built. Morphing into full system (Hermes Agent + React Dashboard + PostgreSQL + FastMCP).
- **Planning docs:** `Solomons-Chamber/01-Projects/YBTM-System/`

---

## Core Runtime (`core/`)

| File | Purpose |
|------|---------|
| `core/router.ts` | Intent-based routing engine — maps raw input to vault layer actions |
| `core/state.ts` | JSON-backed state store — persists session info and recent activity |
| `core/events.ts` | In-process event bus — decoupled pub/sub for layer communication |
| `core/layers.ts` | Registry of all vault layers as typed objects |
| `core/chamber-state.json` | Auto-generated state file — do not edit manually |

---

## Conventions

### File Naming
- TypeScript files: `kebab-case.ts`
- Markdown notes: `YYYY-MM-DD-title.md` for dated notes, `title.md` for permanent notes
- Config files: lowercase with extension

### TypeScript Style
- Use `interface` for shapes, `type` for unions/aliases
- Prefer explicit return types on exported functions
- Use `unknown` not `any` — cast only when necessary
- All CLI entrypoints use the pattern: `if (import.meta.main) { ... }`

### Layer Operations
- Always route writes through the router (`core/router.ts`) when possible
- Log significant events via the event bus (`core/events.ts`)
- State changes should call `StateStore.logActivity()` so the audit trail stays current

### Notes / Inbox
- Daily notes: `05-Self-Notes/daily/YYYY-MM-DD.md`
- Quick inbox items: `00-Inbox/YYYY-MM-DD-HH-mm-{slug}.md`
- Research: `02-Research/{topic}/index.md` with source files alongside

---

## Running the Vault

```bash
# Start the web dashboard (port 4000)
bun run dev

# Create today's daily note
bun run note

# Check vault status
bun run status

# Route a command
bun run route dispatch "note" '{"content":"my idea"}'
```

---

## Adding New Integrations

1. Add a layer entry in `core/layers.ts`
2. Add an Intent type in `core/router.ts` and wire a Route
3. Update `ChamberState.layers` in `core/state.ts` if persistent state is needed
4. Optionally add an event constant in `core/events.ts`
5. Update the web dashboard in `web/server.ts` if a UI card is needed

---

## Environment & Tooling

- **Runtime:** Bun (preferred) — use `bun` not `node`/`npx`
- **Package manager:** Bun workspaces (see root `package.json`)
- **TypeScript:** No separate tsc step needed — Bun runs `.ts` directly
- **Port conventions:** Vault dashboard = 4000, StoryChain = 3000

---

## 📁 CRITICAL FILES TO CHECK

| Priority | File | Why |
|----------|------|-----|
| 1 | `Solomons-Chamber/CLAUDE.md` | This file - startup protocol |
| 2 | `Solomons-Chamber/09-Agent-Sessions/current/` | Active/incomplete tasks |
| 3 | `Solomons-Chamber/memory/YBTM_WORKSPACE_STATE.md` | Mr. Garcia's website state |
| 4 | `youbecamethemoney/.workspace-state.json` | Current website status |
| 5 | `Solomons-Chamber/01-Projects/` | Active projects |

---

## 🎯 CURRENT PROJECT STATUS

**Last Updated**: 2026-04-10

### Mr. Garcia's Website (You Became The Money)
- **Status**: Foundation locked, prototype dashboard built, system planning complete
- **Location**: `youbecamethemoney/`
- **Last Work**: April 10 - React dashboard prototype + system docs pushed
- **Planning**: `Solomons-Chamber/01-Projects/YBTM-System/`

### Teacher's Chair
- **Status**: Stress tests complete
- **Location**: `teachers-command-center/`
- **Last Work**: April 5 - 3 series stress tests passed

### Solomon's Chamber
- **Status**: Active, logging system operational
- **Location**: `Solomons-Chamber/`

---

## 🧠 Memory System

### Automated Processes

| Process | Schedule | Purpose |
|---------|----------|---------|
| consolidate-memory | Daily 2:00 AM | Extract key info from conversations |
| research-scout | 3x nightly | Find new info challenging existing knowledge |
| promote-learnings | Sundays 10:00 AM | Promote confirmed patterns to main memory |

### Quick Commands
```bash
# Add fact to recent memory
python3 ~/skills/consolidate-memory/scripts/add_fact.py --recent "Key fact"

# Check active tasks
cd Solomons-Chamber && node 09-Agent-Sessions/session-logger.js status
```

---

## 👤 User Profile

- **Name**: Teacher Chris (youngstunners88)
- **CLI Tool**: Kimi Code CLI (NOT Claude Code)
- **Primary Project**: RobeetsDay / iHhashi
- **Secondary**: Mr. Garcia's website (You Became The Money)
- **Location**: South Africa focus
- **Constraint**: Token-sensitive (Windows 8, SSH to VM)
- **Communication**: Direct, no fluff, gets angry at mistakes

### User's Top Priorities
1. Follow instructions EXACTLY
2. Don't change things without permission
3. Log everything in Solomon's Chamber
4. Check previous work before starting
5. Don't waste tokens

---

## ❌ MISTAKES TO NEVER REPEAT

1. **Don't change fonts/design without asking** (April 9 incident)
2. **Don't move components without permission** (Ebook section incident)
3. **Don't break working features** (ElevenLabs, music player)
4. **Don't skip task logging** (This session)
5. **Don't assume - ASK**

---

## 📝 TASK LOGGING TEMPLATE

When creating a task log, use this format:

```markdown
# TASK LOG - {Brief Description}

## Status: 🟡 IN PROGRESS / ✅ COMPLETE

## Task Description
{What needs to be done}

## User Command (Exact Quote)
> "{exact user command}"

## Execution Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Files to Modify
| File | Action |
|------|--------|
| path/to/file | Create/Modify |

## Expected Outcome
{What success looks like}

## Started At
{ISO timestamp}

---

## Progress Log
- [timestamp] Started
- [timestamp] Progress update
- [timestamp] Completed

## Results
✅ What was accomplished
❌ What failed (if anything)

## Completed At
{ISO timestamp}
```

---

## What Claude Code Should Know

- This is a **single-user personal system** — no auth, no multi-tenancy concerns
- Prefer **editing existing files** over creating new ones unless adding a new layer
- The vault is **append-friendly** — don't delete things, archive them to `07-Archive/`
- When in doubt about where something goes, drop it in `00-Inbox/` first
- `core/chamber-state.json` is auto-generated — never commit it with sensitive data
- The Retell API key is in the user's memory (see `~/.claude/projects/.../memory/retell_api.md`)

---

*This file MUST be read at the start of EVERY session. Last updated: 2026-04-10*
