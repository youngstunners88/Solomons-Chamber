# Solomons Chamber — Live Demo

Quick walkthrough of key features. [📹 Video coming soon — Loom link]

---

## 1. Daily Note Creation

```bash
$ bun scripts/daily-note.ts "Monday Focus"

✅ Created: /home/workspace/Solomons-Chamber/05-Self-Notes/daily/2026-03-26-monday-focus.md
```

Opens with:
- Today's date auto-filled
- Focus section ready for input
- End-of-day wins section

![Daily Note Screenshot](screenshots/daily-note.png)

---

## 2. Voice Memo Capture

```bash
$ bun scripts/voice-capture.ts meeting,urgent

🎙️ Voice memo created: 06-Media/Audio/Voice-Memos/voice-memo-2026-03-26...
   Duration: 300s | Tags: meeting,urgent

💡 Next steps:
   bun 10-Skills/voice-memo-system/scripts/process.ts
```

Workflow:
1. Hit record → speak your thoughts
2. Audio saved + markdown file created
3. Later processed via Whisper → transcript linked
4. Cross-referenced to daily notes

![Voice Capture Flow](screenshots/voice-flow.gif)

---

## 3. Auto-Routing

```bash
$ bun 07-Routing/vault-router.ts --process

🧭 Vault Router
============================================================
Found 3 item(s) to route:

📄 meeting-notes-2026-03-26.md
   → 01-Projects/active/
   💡 project-related content
   ✅ Moved successfully

📄 btc-analysis.md
   → 03-Trading/
   💡 contains trading keywords
   ✅ Moved successfully

📄 random-thought.md
   ⚠️ No route matched—staying in Inbox

============================================================
📊 Summary: 2 routed, 1 stayed
```

Content from `00-Inbox` automatically sorted by keywords to appropriate sections.

![Routing Demo](screenshots/routing.png)

---

## 4. State Dashboard

```bash
$ bun 08-State/state-manager.ts --dashboard

🏛️  Solomons Chamber — State Dashboard
==================================================

📊 Active Items:
   📝 Projects: 4
   🔬 Research: 2
   📈 Trading: 1
   📦 Total: 7

📍 Recent Activity (last 10):
   • [Projects] PROJ-001-blog-redesign.md
   • [Research] SRC-ai-voice-analysis.md
   • [Trading] SIG-2026-03-26-btc-long.md

💡 Quick actions:
   bun 07-Routing/vault-router.ts --process
   bun scripts/daily-note.ts
   bun scripts/voice-capture.ts
```

Real-time view of what's active across your vault.

![State Dashboard](screenshots/dashboard.png)

---

## 5. Voice Memo System (End-to-End)

Full workflow demo:

```bash
# 1. Capture
$ bun 10-Skills/voice-memo-system/scripts/capture.ts

# 2. List
$ bun 10-Skills/voice-memo-system/scripts/list.ts
📂 Voice Memos (3)
   2026-03-26-idea-for-trading.md
   2026-03-26-monday-retrospective.md
   2026-03-26-meeting-notes.md

# 3. Search
$ bun 10-Skills/voice-memo-system/scripts/search.ts "trading"
🔍 Found 1 memo:
   → 2026-03-26-idea-for-trading.md
   "...thinking about setting up alerts for btc..."

# 4. Tag
$ bun 10-Skills/voice-memo-system/scripts/tag.ts 2026-03-26-idea-for-trading urgent,btc
✅ Tagged: urgent, btc
```

---

## 6. Obsidian Skills Bridge

Integration with Obsidian plugin ecosystem:

```typescript
// Cursor: @voice capture
// Claude: /voice capture  
// OpenClaw: $voice capture
// Codex: $voice capture
```

Same command works across all AI coding tools.

---

## Directory Structure (Filled Example)

```
00-Inbox/
  ├── capture-2026-03-26.md
  └── (3 items awaiting routing)

01-Projects/active/
  ├── PROJ-001-blog-redesign.md
  ├── PROJ-002-trading-bot.md
  └── PROJ-003-knowledge-base.md

01-Projects/archived/
  └── PROJ-000-template-project.md

02-Research/
  ├── SRC-ai-voice-analysis.md
  └── SRC-obsidian-ecosystem.md

03-Trading/
  ├── SIG-2026-03-26-btc-long.md
  └── analysis/
      └── position-sizing-calc.md

04-Assets/skills/
  ├── voice-memo-system/
  │   ├── scripts/capture.ts
  │   ├── scripts/process.ts
  │   └── README.md
  └── template/

05-Self-Notes/daily/
  ├── 2026-03-25-reflections.md
  ├── 2026-03-24-week-review.md
  └── journal/
      ├── personal-2026-Q1.md
      └── ideas-dump.md

06-Media/
  ├── Audio/Voice-Memos/  ├── voice-memo-2026-03-26...

07-Archive/
  └── README.md

08-Docs/
  ├── Guides/
  │   ├── quick-start.md
  │   └── philosophy.md
  └── README.md

09-Automation/
  └── scheduled-tasks.md

10-Skills/
  └── (symlinks to installed capabilities)
```

---

## Performance

```
Cold start script:    ~50ms
Daily note creation:  ~10ms
Voice capture:        ~100ms (metadata file)
Vault routing:        ~200ms (10 files)
State dashboard:      ~30ms
Full test suite:      ~500ms
```

---

## Try It Yourself

```bash
git clone https://github.com/youngstunners88/Solomons-Chamber.git
cd Solomons-Chamber

# Quick setup
curl -fsSL https://bun.sh/install | bash
export VAULT_PATH=$(pwd)

# Run the demo
bun tests/living-rounds.ts
```

All 4 stages pass → you're good to go.

---

*[Last updated: 2026-03-26]*
*[Want to add your demo? Submit a PR!]*
