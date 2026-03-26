# 11-Voice-Agent

Your voice-controlled AI companion. Speak in any language, control your vault, browse the web, generate code.

## What It Does

- **Voice-to-Code**: "Write a Python script to fetch Bitcoin price"
- **Voice-to-Web**: "Login to Robinhood" → Browse → "Show my portfolio"
- **Voice-to-Query**: "What did I capture yesterday about Ethereum?"
- **Voice-to-Action**: "Archive all completed projects"

## Languages Supported

10 languages with native voice commands:
- 🇺🇸 English (en)
- 🇪🇸 Spanish (es) 
- 🇧🇷 Portuguese (pt)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇨🇳 Chinese/Mandarin (zh)
- 🇯🇵 Japanese (ja)
- 🇮🇳 Hindi (hi)
- 🇸🇦 Arabic (ar)
- 🇹🇿 Swahili (sw)

## Quick Start

```bash
# Start voice agent
bun 11-Voice-Agent/skills/voice-orchestrator.ts --listen

# Or use CLI shorthand
alias solomon="bun /home/workspace/Solomons-Chamber-V2/11-Voice-Agent/skills/voice-orchestrator.ts"
solomon --listen
```

## Voice Commands

| Intent | English Example | Spanish Example | Hindi Example |
|--------|----------------|-----------------|---------------|
| Capture | "Capture this" | "Captura esto" | "रिकॉर्ड करो" |
| Code | "Write code" | "Escribe código" | "कोड लिखो" |
| Web | "Search Tesla" | "Busca Tesla" | "टेसला खोजो" |
| Query | "What is..." | "Qué es..." | "क्या है..." |

See `locales/voice-commands.json` for all 10 languages.

## Safety

- Browser automation requires confirmation
- Financial actions need 2FA
- All sessions logged to `06-Media/voice-sessions/`

## Architecture

```
Voice Input → Transcribe → Parse Intent → Route → Execute
     ↑                                                 ↓
     └─────────────── Voice Feedback ←──────────────────┘
```
