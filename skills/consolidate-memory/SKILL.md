---
name: consolidate-memory
description: Consolidate conversation history into persistent memory. Reads past 24hrs of conversation logs from ~/.claude, extracts key decisions, preferences, and facts, updates recent-memory.md and long-term-memory.md, and promotes important facts from recent to long-term memory. Run nightly to maintain context continuity.
---

# Consolidate Memory Skill

Transforms ephemeral conversation history into persistent, structured memory.

## Purpose

Conversations are lost when sessions end. This skill:
1. Reads conversation logs from the past 24 hours
2. Extracts key facts, decisions, and preferences
3. Updates recent-memory.md (48hr rolling window)
4. Promotes important patterns to long-term-memory.md
5. Archives old recent-memory entries

## When to Run

- **Automatically**: Every night at 2 AM via cron
- **Manually**: After important sessions with significant decisions
- **Trigger**: User says "consolidate memory" or "remember this"

## How It Works

```
~/.claude/conversations/ → Parse → Extract → Update Memory Files
                                    ↓
                         recent-memory.md (48hr)
                         long-term-memory.md (permanent)
```

## Usage

```bash
# Run consolidation
python3 ~/skills/consolidate-memory/scripts/consolidate.py

# Dry run (see what would change without writing)
python3 ~/skills/consolidate-memory/scripts/consolidate.py --dry-run

# Force full reprocessing
python3 ~/skills/consolidate-memory/scripts/consolidate.py --full
```

## Extraction Rules

### What Gets Extracted

| Type | Example | Destination |
|------|---------|-------------|
| User Preferences | "I prefer concise responses" | long-term-memory.md |
| Key Decisions | "Use MongoDB over PostgreSQL" | both files |
| Important Facts | "Project deadline is Friday" | recent-memory.md |
| Mistakes & Lessons | Pattern IDs, learnings | long-term-memory.md |
| Active Projects | Status, blockers | project-memory.md |
| Technical Choices | Stack decisions, tool choices | long-term-memory.md |

### Promotion Criteria (Recent → Long-Term)

A fact gets promoted if:
- Mentioned in 3+ conversations
- Explicitly marked as "remember this" or "important"
- Related to user preferences or workflow patterns
- Part of an error pattern or lesson learned
- Project context that spans multiple days

## File Locations

- **Source**: `~/.claude/conversations/*.jsonl` (or equivalent Kimi logs)
- **Recent Memory**: `~/memory/recent-memory.md`
- **Long-Term Memory**: `~/memory/long-term-memory.md`
- **Project Memory**: `~/memory/project-memory.md`
- **Log**: `~/skills/consolidate-memory/logs/consolidation.log`

## Scheduling

```bash
# Add to crontab (runs nightly at 2 AM)
0 2 * * * /usr/bin/python3 /home/teacherchris37/skills/consolidate-memory/scripts/consolidate.py >> /home/teacherchris37/skills/consolidate-memory/logs/cron.log 2>&1
```

## Manual Memory Updates

For immediate memory updates without running full consolidation:

```bash
# Add to recent memory
python3 ~/skills/consolidate-memory/scripts/add_fact.py --recent "Key fact from today"

# Add to long-term memory
python3 ~/skills/consolidate-memory/scripts/add_fact.py --long-term "Permanent preference"

# Update project status
python3 ~/skills/consolidate-memory/scripts/update_project.py --name "Project X" --status "In Progress"
```

## Output Format

Recent memory entries include:
- Timestamp
- Context (what was happening)
- Key facts learned
- User preferences expressed
- Decisions made

Long-term memory entries include:
- Pattern/Category
- Fact/Preference
- First observed date
- Confirmation count (how many times observed)
- Related pattern IDs
