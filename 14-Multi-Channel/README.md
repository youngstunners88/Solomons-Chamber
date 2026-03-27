# Multi-Channel Interaction

Interact with Solomons Chamber through any messaging platform.

## Supported Channels

- ✅ Telegram (like this conversation)
- ✅ WhatsApp
- ✅ Facebook Messenger
- ✅ Signal
- ✅ WeChat

## How It Works

Each channel has an adapter that:
1. Receives your message
2. Routes to Solomons Chamber
3. Executes commands
4. Returns results

## Example Interactions

**Via Telegram/WhatsApp:**
```
You: /note Today I learned...
Bot: ✅ Saved to 05-Self-Notes/daily/2026-03-27.md

You: /search "bitcoin"
Bot: Found 3 notes: ...

You: /capture https://youtube.com/watch?v=...
Bot: ✅ Video saved, transcript extracted
```

## Setup

```bash
# Start your preferred channel
bun 14-Multi-Channel/bots/telegram-bot.ts
bun 14-Multi-Channel/bots/whatsapp-bot.ts
```
