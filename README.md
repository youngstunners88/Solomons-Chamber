# Solomons Chamber

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-purple)]()
[![Bun](https://img.shields.io/badge/Bun-Runtime-orange)]()

**A vault architecture for humans first, automation second.**

This template bridges your native Obsidian/PKM practice with agent-powered automation — without losing the human expression that makes thinking valuable.

---

## Philosophy

> "Text as the primary interface — automation amplifies, never replaces."

Most PKM systems ask you to choose:
- **Pure manual** (Obsidian native) — expressive but labor-intensive
- **Pure automation** (AI agents) — productive but soulless

**Solomons Chamber is the third path:**
- Every day, you write in `05-Self-Notes/` — same as always
- At end of day, run `bun scripts/daily-note.ts` — it organizes, tags, routes
- Weekly, run `bun scripts/weekly-review.ts` — surfaces patterns, archives old work
- Meanwhile, agents populate `01-Projects/` and `02-Research/` from external sources

**You own the signal. The system handles noise.**

---

## 7-Layer Architecture

```
Solomons-Chamber/
├── 00-Inbox/           # Capture everything here first
├── 01-Projects/        # AI-populated + your manual edits
├── 02-Research/        # Auto-ingested + your insights
├── 03-Trading/         # Signal/position tracking
├── 04-Assets/          # Reusable skills, templates
├── 05-Self-Notes/      # THE CORE — your daily writing
├── 06-Media/           # Voice memos, transcripts, links
└── 07-Archive/         # Completed work, auto-archived
```

**The Rule:** Everything in `05-Self-Notes/` is yours, always, forever. Automation never touches that folder without explicit permission.

---

## Quick Start

### 1. Create your chamber (GitHub UI)

[Click this template button → Fork → Rename → Done]

### 2. Initialize locally

```bash
cd Solomons-Chamber
bun install  # if you want TypeScript automation
chmod +x scripts/*.ts
```

### 3. First day workflow

**Morning:**
- Write in `05-Self-Notes/daily/2026-03-27.md`
- Capture links in `00-Inbox/`

**Evening:**
```bash
bun scripts/daily-note.ts
cat 05-Self-Notes/weekly/2026-W13.md
```

**When you archive in `00-Inbox/`, the router sorts automatically.**

---

## Example Workflows

### Minimal (Daily Writer)
```
05-Self-Notes/daily/   ← You write here (morning pages, ideas)
07-Archive/             ← Moved after 7 days
```
*Everything else optional*

### Trader (Signal Processing)
```
03-Trading/signals/   ← Auto-populated from API
05-Self-Notes/daily/   ← Your context + analysis
01-Projects/active/     ← Position tracking
```

### Researcher (Knowledge Synthesis)
```
02-Research/sources/    ← RSS feeds, bookmarks
02-Research/insights/   ← Auto-extracted topics
05-Self-Notes/         ← Your synthesis, connections
```

---

## Automation Scripts (Optional)

| Script | What it does |
|--------|--------------|
| `daily-note.ts` | Creates dated entry, runs routing |
| `weekly-review.ts` | Archives old items, surfaces patterns |
| `rss-ingest.ts` | Pulls feeds into `02-Research/sources/` |
| `voice-capture.ts` | Records → transcribes → `06-Media/Transcripts/` |
| `vault-router.ts` | Sorts `00-Inbox/` by content type |

**None are required.** Your vault works as pure Markdown forever.

---

## State Management

Files have lifecycle:

```
00-Inbox/ → (routed) → 01-Projects/active/ or 02-Research/topics/
              ↓
05-Self-Notes/weekly/ (reviews)
              ↓
07-Archive/ (auto after 30 days)
```

**Status tracking:**
- `#active` — Currently working
- `#pending` — Scheduled
- `#completed` — Done, ready for archive
- `#archived` — Frozen, searchable

---

## Integration: Obsidian Skills (Optional)

This template **supplements** Obsidian Skills, *not replaces* them.

**Obsidian Skills users can:**
- Install Skills as usual in `.obsidian/plugins/`
- Let `04-Assets/skills/` hold skill descriptions + config
- Use `08-Plugins/obsidian-skills-bridge.ts` to sync data

**The difference:**
- **Obsidian Skills** = automation *inside* Obsidian
- **Solomons Chamber** = vault architecture *for* humans + automation

Use both. They're complementary.

---

## Git Workflow

```bash
# Commit your notes daily
git add 05-Self-Notes/
git commit -m "Daily reflection: $(date +%Y-%m-%d)"

# Push weekly
git push origin main
```

**Private by default.** Never commit:
- `03-Trading/signals/`
- API keys (`.env` — already gitignored)
- Voice memos (keep local)

---

## License

MIT — Use it, fork it, make it yours. Keep the human-first principle.
