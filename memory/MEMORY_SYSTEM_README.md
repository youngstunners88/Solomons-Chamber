# Persistent Memory System

A comprehensive memory layer for AI assistants that persists across sessions.

## Overview

This system transforms ephemeral conversations into persistent, structured memory through:

1. **Three Memory Files** - Rolling recent context, distilled long-term facts, active project state
2. **Automated Consolidation** - Extracts key info from conversations nightly
3. **Continuous Research** - Monitors for new information challenging existing knowledge
4. **Weekly Promotion** - Reviews and integrates validated findings

## Memory Files

### recent-memory.md
**Purpose**: Rolling 48-hour context window
**Content**: Recent interactions, session context, temporary state
**Updated**: By consolidate-memory skill (nightly) or manually

### long-term-memory.md
**Purpose**: Distilled facts, preferences, patterns
**Content**: User profile, technical stack, error patterns, relationships, staged new_learnings
**Updated**: By consolidation (promotions), manual edits, research-scout (staging)

### project-memory.md
**Purpose**: Active project state
**Content**: Current priorities, blockers, session state, quick references
**Updated**: Manually or via project tracking scripts

## Skills

### consolidate-memory
**Location**: `/skills/consolidate-memory/`

Extracts key decisions, preferences, and facts from conversations.

**Scripts**:
- `consolidate.py` - Main extraction and update logic
- `add_fact.py` - Quick manual fact addition
- `setup-cron.sh` - Install scheduled tasks

**Schedule**: Daily at 2:00 AM

**Usage**:
```bash
# Run manually
python3 ~/skills/consolidate-memory/scripts/consolidate.py

# Dry run
python3 ~/skills/consolidate-memory/scripts/consolidate.py --dry-run

# Add fact quickly
python3 ~/skills/consolidate-memory/scripts/add_fact.py --recent "Key fact"
```

### research-scout
**Location**: `/skills/research-scout/`

Monitors web sources for new information challenging existing knowledge.

**Sources**: Web search, Hacker News, Reddit

**Scripts**:
- `scout.py` - Main research logic
- `promote-learnings.py` - Weekly promotion of validated findings
- `config/topics.json` - Monitored topics

**Schedule**: 3x nightly (00:00, 04:00, 08:00)
**Weekly**: Sundays at 10:00 AM (promotion)

**Usage**:
```bash
# Run full scout
python3 ~/skills/research-scout/scripts/scout.py

# Scout specific topic
python3 ~/skills/research-scout/scripts/scout.py --topic "FastAPI updates"

# Dry run
python3 ~/skills/research-scout/scripts/scout.py --dry-run

# Promote learnings manually
python3 ~/skills/research-scout/scripts/promote-learnings.py
```

## CLAUDE.md Integration

**File**: `CLAUDE.md` (in Solomons-Chamber root)

Provides startup context for AI assistants:
- Loads recent-memory.md inline (48hr context)
- References long-term-memory.md by path
- Documents memory system commands
- Lists update triggers and constraints

## How Information Flows

```
Conversation → consolidate-memory → recent-memory.md
                                    ↓ (promotion criteria)
                              long-term-memory.md

Web/Reddit/HN → research-scout → new_learnings (staging)
                                         ↓ (weekly review)
                              long-term-memory.md (main sections)
```

## Scheduling

All managed via cron:

```bash
# View
 crontab -l

# Edit
 crontab -e

# Current schedule:
0 2 * * *    # consolidate-memory (daily)
0 0,4,8 * * * # research-scout (3x daily)
0 10 * * 0   # promote-learnings (weekly Sunday)
```

## Manual Memory Management

### Adding Facts

```bash
# Quick add to recent
python3 ~/skills/consolidate-memory/scripts/add_fact.py \
  --recent "User prefers dark mode in all UIs"

# Quick add to long-term
python3 ~/skills/consolidate-memory/scripts/add_fact.py \
  --long-term "Always use TypeScript strict mode" \
  --category "Preference"
```

### Direct Editing

Memory files are plain Markdown - edit directly:

```bash
# Edit recent context
nano ~/memory/recent-memory.md

# Edit long-term facts
nano ~/memory/long-term-memory.md

# Edit project state
nano ~/memory/project-memory.md
```

### Forcing Consolidation

```bash
# Process last 7 days instead of 24 hours
python3 ~/skills/consolidate-memory/scripts/consolidate.py --full

# See what would change without writing
python3 ~/skills/consolidate-memory/scripts/consolidate.py --dry-run
```

## new_learnings Section

Located in `long-term-memory.md`, this staging area holds findings from research-scout:

```markdown
## new_learnings

- **[2026-03-27 08:15]** | Source: [HN](https://...) | Finding: Bun 1.2 adds S3 support | Impact: Could replace AWS SDK
- **[2026-03-27 04:00]** | Source: [Reddit](https://...) | Finding: FastAPI recommends Pydantic v2 | Impact: Migration needed
```

**Weekly promotion** automatically:
- Moves confirmed patterns to main sections
- Flags breaking changes for review
- Clears processed entries
- Keeps recent/unconfirmed findings staged

## Best Practices

1. **Let automation handle routine updates** - Nightly consolidation captures most context
2. **Manually add critical preferences immediately** - Don't wait for consolidation
3. **Review new_learnings weekly** - Promote valuable findings
4. **Commit memory files to git** - Backup and track changes
5. **Update topics.json periodically** - Add/remove monitored topics as projects change

## Troubleshooting

### No conversations found
- Check if `~/.claude/conversations/` exists
- Conversation logging must be enabled in CLI tool
- Use `--full` flag to search wider time range

### Scout returns no results
- Check internet connectivity
- Some sources (Reddit) may rate-limit
- Try `--force` to bypass redundancy checks

### Cron jobs not running
- Check `crontab -l` shows entries
- Verify Python3 path: `/usr/bin/python3`
- Check log files in `~/skills/*/logs/`

## File Locations

```
~/memory/
├── recent-memory.md
├── long-term-memory.md
└── project-memory.md

~/skills/
├── consolidate-memory/
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── consolidate.py
│   │   ├── add_fact.py
│   │   └── setup-cron.sh
│   └── logs/
└── research-scout/
    ├── SKILL.md
    ├── scripts/
    │   ├── scout.py
    │   └── promote-learnings.py
    ├── config/
    │   └── topics.json
    └── logs/

~/CLAUDE.md  (startup context)
```

## License

MIT - Part of Solomons-Chamber knowledge management system
