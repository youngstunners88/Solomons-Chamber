---
name: voice-memo-system
description: |
  Complete voice memo capture system for Solomons Chamber.
  Records audio, transcribes with Whisper, auto-tags, links to daily notes.
  Includes CLI plugins for Cursor, Claude Code, OpenClaw, and Codex.
  
  One command workflow: record → transcribe → tag → archive → link

allowed-tools: Bash Read Write Edit RunSequential RunParallel

installation: |
  # Dependencies
  apt-get install sox libsox-fmt-all  # Linux recording
  pip install openai-whisper          # Transcription
  
  # Or use whisper.cpp for faster local processing:
  git clone https://github.com/ggerganov/whisper.cpp
  cd whisper.cpp && make
  
  # Environment setup
  export VAULT_PATH="/path/to/your/vault"
  export WHISPER_CMD="whisper"  # or whisper.cpp path

usage: |
  # Quick capture (5 min, auto-transcribe)
  bun /home/workspace/Skills/voice-memo-system/scripts/capture.ts
  
  # Quick 1-minute capture
  bun /home/workspace/Skills/voice-memo-system/scripts/capture.ts --quick
  
  # Capture with tags
  bun /home/workspace/Skills/voice-memo-system/scripts/capture.ts meeting,claude-code
  
  # List recent memos
  bun /home/workspace/Skills/voice-memo-system/scripts/list.ts
  
  # CLI Integration
  /voice              # Claude Code
  @voice capture      # Cursor  
  $voice capture      # OpenClaw/Codex

structure: |
  scripts/
    capture.ts       — Main capture workflow
    list.ts          — List recent memos
    tag.ts           — Add tags to memos
    search.ts        — Search transcripts
  
  plugins/
    cursor/          — Cursor extension
    claude-code/     — Claude Code skill
    openclaw/        — OpenClaw plugin
    codex/           — Codex CLI skill
  
  assets/
    templates/       — Transcript templates
    config.json      — Default settings
---

# Voice Memo System

## Quick Start

1. **Install dependencies** (see above)
2. **Set environment variables**
3. **Run your first capture:**
   ```bash
   bun scripts/capture.ts "first-test"
   ```

## Folder Structure

```
06-Media/Voice-Memos/
├── Inbox/        — Raw recordings
├── Processed/    — Transcribed text
├── Archived/     — Moved audio
└── tags/         — Tag index files
```

## CLI Integrations

### Claude Code
Copy `plugins/claude-code/` to `~/.claude/skills/voice-capture/`

### Cursor
Copy `plugins/cursor/` to `~/.cursor/extensions/voice-capture/`

### OpenClaw
Copy `plugins/openclaw/` to OpenClaw skills directory

## Advanced Usage

### Custom Transcription Model
```typescript
// In capture.ts, modify transcribe():
const whisperCmd = process.env.WHISPER_CMD || "whisper";
// Use whisper.cpp for speed:
// ./whisper.cpp/build/bin/whisper-cli
```

### Webhook Integration
```typescript
// Add to capture.ts run():
if (process.env.WEBHOOK_URL) {
  await fetch(process.env.WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({ transcript, tags })
  });
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No audio input | Check `rec` command: `which rec` |
| Transcription fails | Verify whisper install: `whisper --version` |
| Vault path error | Set `VAULT_PATH` environment variable |
| Tags not saving | Check folder permissions |

## License

MIT — Use, modify, distribute freely.