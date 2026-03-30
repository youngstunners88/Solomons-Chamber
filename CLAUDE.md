# CLAUDE.md - Persistent Context for Kimi/Claude

This file is automatically loaded at startup to provide persistent memory context.

---

## Recent Memory (Last 48 Hours)

```
LOAD: /home/teacherchris37/memory/recent-memory.md
```

### Current Session Context

**Active Project**: Solomon's Chamber / Universal Storage System
**Current Task**: Automatic session logging - capturing all agent activities
**Last User Intent**: Automatically store everything we do in Solomon's Chamber

### Key Facts (Last 48h)

- **User**: Teacher Chris (youngstunners88)
- **CLI Tool**: Kimi Code CLI (NOT Claude Code - avoid command confusion)
- **Primary Project**: RobeetsDay / iHhashi - Multi-agent food delivery ecosystem
- **Location**: South Africa focus, township infrastructure challenges
- **Technical Stack**: FastAPI, MongoDB, React, TypeScript, Capacitor, Blockchain (X1)

### Recent Mistake & Lesson

- **Pattern CONTEXT_002**: Tried using `npx skills add` (Claude Code command) in Kimi CLI
- **Lesson**: Always verify CLI capabilities before assuming feature parity
- **Action**: Manually adapted skills for Kimi format

---

## Long-Term Memory Reference

```
REFERENCE: /home/teacherchris37/memory/long-term-memory.md
```

This file contains:
- User preferences and communication style
- Technical stack details
- Project architecture (RobeetsDay/iHhashi)
- Error patterns and lessons learned
- Important URLs and resources
- Staged new learnings (from research-scout)

**Always check this file when**:
- Making architectural decisions
- Choosing tools or technologies
- Understanding user preferences
- Referencing past decisions

---

## Project Memory Reference

```
REFERENCE: /home/teacherchris37/memory/project-memory.md
```

This file contains:
- Active project statuses
- Current priorities and blockers
- Session state
- Pending tasks
- Quick reference commands

**Always check this file when**:
- Starting a new session
- Resuming work on existing projects
- Looking for current priorities

---

## Memory System Overview

### Automated Processes

| Process | Schedule | Purpose |
|---------|----------|---------|
| consolidate-memory | Daily 2:00 AM | Extract key info from conversations |
| research-scout | 3x nightly | Find new info challenging existing knowledge |
| promote-learnings | Sundays 10:00 AM | Promote confirmed patterns to main memory |

### Manual Commands

```bash
# Add fact to recent memory
python3 ~/skills/consolidate-memory/scripts/add_fact.py --recent "Key fact"

# Add fact to long-term memory
python3 ~/skills/consolidate-memory/scripts/add_fact.py --long-term "Permanent preference" --category "Preference"

# Run consolidation manually
python3 ~/skills/consolidate-memory/scripts/consolidate.py

# Run research scout
python3 ~/skills/research-scout/scripts/scout.py

# Promote learnings manually
python3 ~/skills/research-scout/scripts/promote-learnings.py
```

---

## Quick Start for Each Session

1. **Load Recent Context**: Read `~/memory/recent-memory.md`
2. **Reference Long-Term**: Check `~/memory/long-term-memory.md` for preferences/patterns
3. **Check Projects**: Review `~/memory/project-memory.md` for active work
4. **Proceed with Context**: Use loaded information to inform responses

---

## Memory Update Triggers

**Update memory when**:
- User expresses a preference ("I prefer...", "I like...")
- Important decision made ("Let's use...", "We decided...")
- Mistake identified and lesson learned
- New project started or status changed
- User says "remember this" or "important"

**Use scripts**:
```bash
python3 ~/skills/consolidate-memory/scripts/add_fact.py --recent "User prefers X over Y"
```

---

## Important Constraints

- **Kimi CLI ≠ Claude Code**: These are different tools with different commands
- **Skills location**: `~/.kimi/skills/` for Kimi, different for Claude
- **Memory is local**: Files are on this machine only
- **Git backup**: Memory files should be committed regularly

---

---

## Solomon's Chamber - Automatic Storage

> **🟢 ACTIVE**: All sessions are automatically logged to Solomon's Chamber

### Storage Locations

| Content Type | Location | Description |
|--------------|----------|-------------|
| Session Logs | `09-Agent-Sessions/archive/` | Complete conversation history |
| Daily Notes | `05-Self-Notes/daily/` | Daily activity summaries |
| Projects | `01-Projects/` | Active project work |
| Research | `02-Research/` | Research insights |
| Trading | `03-Trading/` | Trading analysis |
| Media | `06-Media/` | Voice memos, links, transcripts |

### Current Session

```
LOAD: /home/teacherchris37/Solomons-Chamber/09-Agent-Sessions/current/
```

Active sessions are stored in `current/` and moved to `archive/` when finalized.

### Logging Categories

- 👤 User Requests
- 🔧 Tool Calls
- 📊 Tool Results
- 💬 Agent Responses
- 📄 Files Created
- ✏️ Files Modified
- 🎯 Decisions
- ❌ Errors
- 🏆 Milestones

---

*This file is loaded at every session start. Last updated: 2026-03-30*
