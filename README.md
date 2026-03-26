# Solomons Chamber

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]
[![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-black?logo=bun)]
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue?logo=typescript)]

**Personal AI Operating System**

A vault architecture for thinkers, creators, and traders. 
Gathers information, learns patterns, takes action, improves over time.

---

## Quick Start

```bash
# Clone and setup
git clone https://github.com/youngstunners88/Solomons-Chamber.git
cd Solomons-Chamber

# Install Bun runtime (once)
curl -fsSL https://bun.sh/install | bash

# Set your vault path
export VAULT_PATH=$(pwd)

# Create your first capture
bun scripts/voice/capture.ts "first-memo"
```

---

## What This Is

**Not a static note-taking app.** This is a living system that:
- Gathers information **automatically**
- Learns from **patterns**
- Takes **action** on your behalf
- **Improves itself** over time

It's a digital chamber where intelligence lives, grows, and works for you.

---

## The 10 Layers

```
00-Inbox/              — Capture everything here first
01-Projects/           — Active work (with archived)
02-Research/           — Topics, sources, insights
03-Trading/            — Signals, positions, analysis
04-Assets/             — Reusable skills, templates, adapters
05-Self-Notes/         — Daily, weekly, reflections, journal
06-Media/              — Audio, transcripts, links
07-Archive/            — Done → move here
08-Docs/               — How everything works
09-Automation/         — Triggers, schedulers, watchers
10-Skills/             — Installed capabilities (like voice-memo-system)
```

---

## 🎙️ Voice Capture System

One of the key features: **seamless voice memo integration**.

### Quick Capture

```bash
# Full 5-minute capture with tags
bun 10-Skills/voice-memo-system/scripts/capture.ts meeting,ideas,planning

# Quick 1-minute capture
bun 10-Skills/voice-memo-system/scripts/capture.ts --quick

# List recent memos
bun 10-Skills/voice-memo-system/scripts/list.ts

# Search transcripts
bun 10-Skills/voice-memo-system/scripts/search.ts "claude code"

# Add tags to existing memo
bun 10-Skills/voice-memo-system/scripts/tag.ts "memo-2024-03-26" important
```

### CLI Integration

**Claude Code:**
```
/voice capture meeting
/voice quick
/voice list
/voice search "project"
```

**Cursor:**
```
@voice capture ideas,notes
@voice quick
@voice list
```

**OpenClaw / Codex:**
```
$voice capture
$voice quick
$voice search "keyword"
```

### How Voice Memos Work

1. **Record** → `06-Media/Voice-Memos/Inbox/`
2. **Transcribe** using Whisper → `06-Media/Voice-Memos/Processed/`
3. **Tag** → Links created in `06-Media/Voice-Memos/tags/`
4. **Link** → Cross-reference added to `05-Self-Notes/Daily/`
5. **Archive** → Audio moved to `06-Media/Voice-Memos/Archived/`

---

## What's a Skill?

Skills are **repeatable capabilities**. Example skills in `04-Assets/skills/`:

- Check Bitcoin price every hour
- Summarize unread emails
- Track competitors on X
- Alert when flights drop
- Capture voice memos → transcribe → tag

Each skill = one script + description. The system runs them.

See `04-Assets/skills/template/` to create your first skill.

---

## Adapters

Adapters connect external data to your vault:

- **RSS feeds** → auto-ingested daily
- **APIs** → structured and searchable
- **Databases** → queried and analyzed
- **Documents** → parsed and stored

See `04-Assets/adapters/examples/` for templates.

---

## Is This a "Second Brain"?

**Better.** A second brain remembers. This **acts**.

Traditional second brain:
- You save things
- You organize things  
- You retrieve things

Solomons Chamber:
- It **finds** things for you
- It **organizes** itself
- It takes action **while you sleep**

---

## Philosophy

**Text as interface.** Everything is human-readable Markdown.

**Files over apps.** No lock-in. No subscriptions. Fork it, modify it, own it.

**Your data stays yours.** Local first. Private always.

---

## Requirements

- [Bun](https://bun.sh/) runtime
- Optional: `sox` for audio recording (`apt-get install sox`)
- Optional: `whisper` for transcription
- Optional: API keys for external data (stored in `.env`)

---

## Privacy First

**Nothing sensitive in Git.** The `.gitignore` blocks:
- Trading data & positions
- API keys & tokens
- Wallet addresses
- Personal finances
- All credentials

Keep secrets in `.env` files (never committed).

---

## Structure at a Glance

```
00-Inbox/              → Today's thoughts, links, captures
01-Projects/           → Active work with analysis & notes
02-Research/           → Deep research with sources
03-Trading/            → Live market data & signals
04-Assets/skills/      → Reusable automations
04-Assets/templates/   → Starting points for new notes
04-Assets/adapters/    → External data connectors
05-Self-Notes/daily/   → Daily reflections
05-Self-Notes/weekly/  → Weekly reviews
05-Self-Notes/journal/ → Personal journal
06-Media/Audio/        → Voice recordings
06-Media/Transcripts/  → Whisper transcriptions
06-Media/Links/        → Saved URLs with metadata
07-Archive/            → Completed projects
08-Docs/               → Documentation & guides
09-Automation/         → Scripts that run on schedule
10-Skills/             → Installed capability modules
```

---

## License

MIT — Make it yours