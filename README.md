# Solomons Chamber

A folder-based note-taking system. Write in Markdown. Organize with files.

## What Actually Works Today

**📝 Daily Notes** — `bun scripts/daily-note.ts "title"`  
Creates a dated Markdown file in `05-Self-Notes/daily/`

**📊 Status Dashboard** — `bun scripts/status.ts`  
Shows how many notes you have and quick commands to run

**🔗 Link Capture** — `bun scripts/media-link-capture.ts "URL"`  
Saves a URL with metadata to `06-Media/Links/`

**🎙️ Voice Memo Stub** — `bun scripts/voice-capture.ts`  
Creates a Markdown template in `06-Media/Audio/Voice-Memos/Inbox/`  
*(Does NOT record audio — you transcribe manually or provide your own Whisper setup)*

**🚀 One-Command Setup** — `bash ONE-CLICK-SETUP.sh`  
Clones, installs Bun if needed, creates your first note

## Quick Start

```bash
# One command to get started
bash ONE-CLICK-SETUP.sh

# Or manually:
git clone https://github.com/youngstunners88/Solomons-Chamber.git
cd Solomons-Chamber
bun scripts/daily-note.ts
```

## Directory Structure (What It Is)

```
00-Inbox/              — Random stuff you haven't organized yet
01-Projects/active/    — Things you're actively working on
02-Research/           — Topics you're learning about  
03-Trading/            — Market notes (if you trade)
04-Assets/             — Templates and reusable bits
05-Self-Notes/daily/   — ⭐ Daily notes go here
06-Media/              — Voice memos (stubs), links, transcripts
07-Archive/            — Old completed stuff
08-Docs/               — Documentation
09-Automation/         — Hooks for scheduling (empty)
10-Skills/             — Skill library (mostly scaffolding)
```

## What This Is NOT

- ❌ **NOT a full "second brain"** — It makes files. You organize them.
- ❌ **NOT automated** — Scripts create templates; you fill them in
- ❌ **NOT an Obsidian replacement** — No backlinks, no graph view, no plugins
- ❌ **NOT production-ready** — Some scripts reference files that don't exist yet

## What's Actually Implemented vs TODO

| Feature | Status | Reality |
|---------|--------|---------|
| Daily notes | ✅ Works | Creates Markdown files |
| Status dashboard | ✅ Works | Counts files, shows stats |
| Link capture | ✅ Works | Saves URLs with metadata |
| Voice memos | ⚠️ Partial | Creates stubs only, no recording |
| Archive old notes | ❌ Broken | Needs vault.ts library |
| RSS ingestion | ❌ Broken | Needs vault.ts library |
| Voice processing | ❌ Stub | Console messages, no real audio |
| Social sharing | ❌ Stub | README only |
| Multi-channel bots | ❌ Stub | README only |

See [ROADMAP.md](ROADMAP.md) for the vision vs reality.

## Philosophy

**Human expression first.**  
This system makes files. You write in them. That's it.

**Automation is optional.**  
The scripts save you 30 seconds of `touch` and `cat`. They're helpers, not magic.

**Text files over apps.**  
Markdown in folders. No lock-in. No cloud. If GitHub dies tomorrow, you still have your notes.

## Requirements

- Git
- [Bun](https://bun.sh/) (auto-installed by ONE-CLICK-SETUP.sh if missing)

## License

MIT — Do what you want. Keep it honest.
