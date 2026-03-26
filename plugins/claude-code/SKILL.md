---
name: voice-capture

model: claude-code

description: |
  Capture voice memos and transcribe them into your vault.
  Use /voice to start a recording, /voice-quick for a 1-minute capture,
  or /voice-list to see recent memos.

commands:
  voice:
    description: "Start a 5-minute voice memo"
    args:
      tags: "optional tags, comma-separated"
    example: "/voice meeting,planning"
    
  voice-quick:
    description: "Quick 1-minute capture"
    example: "/voice-quick"
    
  voice-list:
    description: "Show recent voice memos"
    example: "/voice-list"
    
  voice-tag:
    description: "Add tags to a memo"
    args:
      memo: "memo filename or date"
      tags: "comma-separated tags"
    example: "/voice-tag 2024-03-26 important,idea"

installation: |
  1. Copy this SKILL.md to ~/.claude/skills/voice-capture/
  2. Copy scripts/voice/ folder to ~/.claude/skills/voice-capture/scripts/
  3. Run: /voice to test

requirements:
  - sox (for recording: apt-get install sox on Linux)
  - whisper (for transcription)
  - VAULT_PATH environment variable set
---

# Voice Capture for Claude Code

## What This Does

Records audio from your microphone, transcribes it using Whisper,
and saves it to your Solomons Chamber vault with automatic tagging
and linking to your daily notes.

## Usage

```
# Start a 5-minute recording
/voice

# Capture with tags
/voice meeting,claude-code,project-alpha

# Quick 1-minute capture
/voice-quick

# View recent memos
/voice-list
```

## How It Works

1. Records audio to `06-Media/Voice-Memos/Inbox/`
2. Transcribes using Whisper → saves to `Processed/`
3. Creates tag links in `tags/`
4. Links to daily note in `05-Self-Notes/Daily/`
5. Archives audio file to `Archived/`

## Integration

This works seamlessly with your existing Claude Code workflow.
Voice memos become searchable notes in your vault.