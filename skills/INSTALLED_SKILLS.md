# Installed Skills Summary

Date: 2026-03-27

## New Skills Added

### From External Repositories

| Skill | Source | Purpose |
|-------|--------|---------|
| `browser-use` | github.com/browser-use/browser-use | Browser automation library |
| `frontend-design` | github.com/anthropics/skills | Production-grade UI design |
| `agent-browser` | github.com/vercel-labs/agent-browser | Headless browser CLI |
| `ai-image-generation` | github.com/inference-sh/skills | 50+ AI image models |

### Created Skills

| Skill | Description |
|-------|-------------|
| `self-growth` | Self-improvement, self-healing, self-learning system |

## Self-Growth Skill Structure

```
skills/self-growth/
├── SKILL.md                  # Main skill documentation
├── references/
│   ├── error-patterns.md     # Documented mistake patterns
│   └── growth-log.md         # Chronological learning log
└── scripts/
    ├── log_mistake.py        # Log mistakes to growth log
    ├── analyze_patterns.py   # Find recurring patterns
    └── review_growth.py      # Spaced repetition review
```

## Installation Method

Since Kimi CLI doesn't support `npx skills add`, these were manually:
1. Cloned from source repos
2. SKILL.md files extracted/copied
3. Placed in `~/.kimi/skills/`

## Note

Kimi CLI skills are compatible with Claude Code's SKILL.md format but use
different installation mechanisms. Claude Code uses `npx skills add` while
Kimi requires manual installation.
