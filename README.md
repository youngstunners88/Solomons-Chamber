# Solomons Chamber

> **First and foremost: a place to think, write, and express yourself.**  
> The automation? That's just a helpful assistant that lives nearby.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://typescriptlang.org)
[![Obsidian Compatible](https://img.shields.io/badge/Obsidian-Compatible-7c3aed)](https://obsidian.md)
[![Multilingual Voice](https://img.shields.io/badge/Voice-22%20Languages-green)](11-Voice-Agent/)

## What This Is

**Primarily:** A digital space for your thoughts.

**Secondarily:** A living system that gathers, learns, and acts.

**Think of it as:** Your private chamber where ideas live, grow, and work for you — with optional AI superpowers.

## 🔬 Live Example

**This vault is actively used by its creator for:**
- [TurboQuant research](https://github.com/youngstunners88/Obsidian-Personal-Vault/tree/main/TurboQuant) — AI efficiency papers
- [Better Zillow analysis](https://github.com/youngstunners88/Obsidian-Personal-Vault/tree/main/Better-Zillow) — Real estate market research  
- Daily trading signals & voice memos

*See the real vault in action: [Obsidian-Personal-Vault](https://github.com/youngstunners88/Obsidian-Personal-Vault)*

## The Core Rule

**Human expression first. Automation second.**

The best part is the **05-Self-Notes** folder. The 22-language voice agent and AI media studio? Just helpful assistants.

## 📸 System in Action

### Voice Memo Flow
```
Record (any device) → Inbox → Transcribe → Tag → Archive
     "Morning thoughts"     → 00-Inbox/ → Whisper → 06-Media/tags/ → Done
```

### AI Media Generation (12-Higgsfield-Studio)
```
Text prompt → Higgsfield → Generated asset → Routed to project
"African sunset"  →  bun generate.ts  →  sunset.png  →  01-Projects/active/
```

## Directory Structure

```
00-Inbox/              — Capture everything here first
01-Projects/           — Active work (active/, archived/)
02-Research/           — Topics, sources, insights
03-Trading/            — Signals, positions, analysis
04-Assets/             — Skills, templates, adapters
05-Self-Notes/ ⭐      — THE MOST IMPORTANT FOLDER
06-Media/              — Voice memos, transcripts, images, videos
07-Archive/            — Cold storage
08-Docs/               — Documentation
09-Automation/         — Triggers, schedulers
10-Skills/             — Installed skill library
11-Voice-Agent/        — 🎙️ Voice commands in 22 languages
12-Higgsfield-Studio/  — 🎬 AI image/video/lip-sync generation
```

## Who Is This For?

- **Traders** — Capture observations, voice memos, track positions
- **Researchers** — Ingest papers, build knowledge bases  
- **Creators** — AI media generation, multilingual voice capture
- **Thinkers** — Daily notes, weekly reviews, long-term thinking

[📖 See full onboarding →](docs/onboarding/WHO_IT_IS_FOR.md)

## 📱 Mobile & Tablet

- **iOS:** Obsidian + Git plugin, Working Copy + iA Writer
- **Android:** MGit + Markor, Termux for full power
- **Web:** github.dev for browser editing

[📱 Mobile setup →](docs/onboarding/MOBILE_TABLET_GUIDE.md)

## 🚀 Quick Start (3 Paths)

### Path 1: The Minimalist (30 seconds)
```bash
# Clone
git clone https://github.com/youngstunners88/Solomons-Chamber.git
cd Solomons-Chamber/05-Self-Notes/daily

# Create today's note
touch "$(date +%Y-%m-%d)-thoughts.md"

# Write. That's it.
```

### Path 2: The Builder (2 minutes)
```bash
# Clone & setup
git clone https://github.com/youngstunners88/Solomons-Chamber.git
cd Solomons-Chamber

# Install Bun (once)
curl -fsSL https://bun.sh/install | bash

# Create daily note
bun scripts/daily-note.ts

# Try voice capture
bun scripts/voice-capture.ts ideas,planning

# Run tests
bun tests/living-rounds.ts
```

### Path 3: The Automator (Explore all layers)
```bash
# Voice agent in 22 languages
cd 11-Voice-Agent
ls locales/  # en, es, pt, zu, af, it, nl, ru, ko, tr, pl, id, vi, th, bn...

# AI media generation
cd 12-Higgsfield-Studio
ls skills/   # generate.ts, video.ts, lipsync.ts

# Explore all skills
ls 10-Skills/
```

## 🎙️ Voice Memos (Real Examples)

Created by the developer and stored in vault:
- `06-Media/Voice-Memos/Inbox/voice-memo-2026-03-26-182733.oga`
- `06-Memo-2026-03-26-183156.oga`

## Features Matrix

| Feature | What It Does | Status |
|---------|-------------|--------|
| **Voice ➜ Vault** | Record → transcribe → tag → archive | ✅ Live |
| **22-Language Voice** | Voice commands in 22 languages | ✅ Live |
| **AI Media Studio** | Image/video/lip-sync generation | ✅ Live |
| **Live Data** | RSS, API, DB adapters | ✅ Live |
| **Mobile Sync** | iOS/Android + Obsidian | ✅ Live |

## Philosophy

Expression over automation.  
Thinking over optimizing.  
Your words over algorithms.

**But when you want automation:** It's here, local-first, and speaks 22 languages.

## License

MIT — Make it yours. Write in it. Automate if you want.
