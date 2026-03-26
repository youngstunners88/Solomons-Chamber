# Higgsfield Studio

AI-powered image and video generation integrated into Solomons Chamber.

## What This Is

Seamlessly connects Open Higgsfield AI capabilities to your vault:
- Generate images from text prompts
- Create videos from images or text
- Lip-sync portraits with audio
- Professional cinema controls

All outputs route into your vault structure automatically.

## Architecture

```
12-Higgsfield-Studio/
├── Image-Generation/     → Text-to-image outputs
├── Video-Generation/   → Text/Image-to-video outputs
├── Lip-Sync/            → Animated portrait outputs
├── Cinema-Studio/       → Professional camera shots
├── Assets/              → Prompts, templates, models
├── Projects/            → Organized by client/topic
├── Queue/               → Pending generation jobs
├── Completed/           → Finished outputs
├── routing/             → Smart routing logic
├── state/               → State management
└── skills/              → CLI integrations
```

## Quick Start

```bash
# Generate an image
bun 12-Higgsfield-Studio/skills/generate.ts image "sunset over trading desk"

# Create a video
bun 12-Higgsfield-Studio/skills/generate.ts video --from-image path/to/image.jpg

# Lip-sync portrait
bun 12-Higgsfield-Studio/skills/generate.ts lipsync --audio path/to/audio.mp3

# Check queue
bun 12-Higgsfield-Studio/state/queue-manager.ts status

# Route completed items
bun 12-Higgsfield-Studio/routing/output-router.ts --process
```

## Integration Points

### Routes into:
- `06-Media/` — Images and videos
- `07-Archive/{year}/` — Completed projects
- `02-Research/insights/` — Generated content as sources

### Consumes from:
- `00-Inbox/` — Prompts and ideas
- `03-Trading/signals/` — Visualize trading concepts
- `04-Assets/templates/` — Prompt templates

## Workflow

1. **Capture** — Idea/prompt lands in `00-Inbox/`
2. **Queue** — Routing system adds to `Queue/`
3. **Generate** — AI creates content
4. **Route** — Output sorted to appropriate folder
5. **Link** — Cross-referenced in daily notes

## Required Setup

```bash
# Add to .env
HIGGSFIELD_API_KEY=your_key_here
MUAPI_API_KEY=your_muapi_key_here
```
