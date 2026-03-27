# Solomon's Chamber — CLAUDE.md

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

## What Claude Code Should Know

- This is a **single-user personal system** — no auth, no multi-tenancy concerns
- Prefer **editing existing files** over creating new ones unless adding a new layer
- The vault is **append-friendly** — don't delete things, archive them to `07-Archive/`
- When in doubt about where something goes, drop it in `00-Inbox/` first
- `core/chamber-state.json` is auto-generated — never commit it with sensitive data
- The Retell API key is in the user's memory (see `~/.claude/projects/.../memory/retell_api.md`)
