# Social Share Module

Quick share any vault content to social platforms.

## Supported Platforms

- ✅ Facebook
- ✅ Instagram
- ✅ X.com (Twitter)
- ✅ Snapchat
- ✅ WhatsApp
- ✅ Telegram

## Usage

```bash
# Share a note
bun 13-Social-Share/share.ts --file "05-Self-Notes/daily/2026-03-27-thoughts.md" --platforms x,telegram,whatsapp

# Share with custom message
bun 13-Social-Share/share.ts --file "note.md" --message "Check this out" --platforms all
```

## Web Component

```html
<button onclick="shareVault('note-path')">Share</button>
```
