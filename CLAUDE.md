# 🚨🚨🚨 MANDATORY STARTUP PROTOCOL - READ THIS FIRST 🚨🚨🚨

## ⚠️ BEFORE YOU DO ANYTHING - FOLLOW THIS EXACTLY ⚠️

### STEP 1: READ CLAUDE.md (This File)
**You are reading it now. Good. Continue to Step 2.**

### STEP 2: CHECK SOLOMON'S CHAMBER FOR PREVIOUS WORK
```bash
# Run this IMMEDIATELY - NO EXCEPTIONS
ls -la /home/teacherchris37/Solomons-Chamber/09-Agent-Sessions/current/
cat /home/teacherchris37/Solomons-Chamber/memory/YBTM_WORKSPACE_STATE.md 2>/dev/null || echo "No YBTM state"
```

### STEP 3: CHECK FOR ACTIVE TASKS
- Look for `TASK-*.md` files in `09-Agent-Sessions/current/`
- If found, READ THEM before responding to user
- If incomplete tasks exist, ask user about them first

### STEP 4: CREATE TASK LOG BEFORE ANY WORK
```bash
# BEFORE executing ANY user request:
cd /home/teacherchris37/Solomons-Chamber
node 09-Agent-Sessions/session-logger.js init
```

Then create: `09-Agent-Sessions/current/TASK-{timestamp}-{description}.md`

---

## 🔴 NON-NEGOTIABLE RULES

1. **READ CLAUDE.md FIRST** - Every session, no exceptions
2. **CHECK SOLOMON'S CHAMBER SECOND** - See what we worked on before
3. **LOG EVERY TASK BEFORE STARTING** - Create task log file first
4. **LOG COMPLETION WHEN DONE** - Update task log with results
5. **NEVER ASSUME** - If unsure, read the files

**BREAKING THESE RULES = USER GETS PISSED OFF**

---

## 📁 CRITICAL FILES TO CHECK

| Priority | File | Why |
|----------|------|-----|
| 1 | `Solomons-Chamber/CLAUDE.md` | This file - startup protocol |
| 2 | `Solomons-Chamber/09-Agent-Sessions/current/` | Active/incomplete tasks |
| 3 | `Solomons-Chamber/memory/YBTM_WORKSPACE_STATE.md` | Mr. Garcia's website state |
| 4 | `youbecamethemoney/.workspace-state.json` | Current website status |
| 5 | `Solomons-Chamber/01-Projects/` | Active projects |

---

## 🎯 CURRENT PROJECT STATUS (Auto-Update This)

**Last Updated**: 2026-04-10

### Mr. Garcia's Website (You Became The Money)
- **Status**: Foundation locked, awaiting user direction
- **Location**: `youbecamethemoney/`
- **Last Work**: April 9 - Foundation established
- **What's Missing**: UNKNOWN - user says incomplete but hasn't specified what

### Teacher's Chair
- **Status**: Stress tests complete, needs GitHub push
- **Location**: `teachers-command-center/`
- **Last Work**: April 5 - 3 series stress tests passed

### Solomon's Chamber
- **Status**: Active, logging system operational
- **Location**: `Solomons-Chamber/`

---

## 🧠 Memory System

### Automated Processes

| Process | Schedule | Purpose |
|---------|----------|---------|
| consolidate-memory | Daily 2:00 AM | Extract key info from conversations |
| research-scout | 3x nightly | Find new info challenging existing knowledge |
| promote-learnings | Sundays 10:00 AM | Promote confirmed patterns to main memory |

### Quick Commands
```bash
# Add fact to recent memory
python3 ~/skills/consolidate-memory/scripts/add_fact.py --recent "Key fact"

# Check active tasks
cd Solomons-Chamber && node 09-Agent-Sessions/session-logger.js status
```

---

## 👤 User Profile

- **Name**: Teacher Chris (youngstunners88)
- **CLI Tool**: Kimi Code CLI (NOT Claude Code)
- **Primary Project**: RobeetsDay / iHhashi
- **Secondary**: Mr. Garcia's website (You Became The Money)
- **Location**: South Africa focus
- **Constraint**: Token-sensitive (Windows 8, SSH to VM)
- **Communication**: Direct, no fluff, gets angry at mistakes

### User's Top Priorities
1. Follow instructions EXACTLY
2. Don't change things without permission
3. Log everything in Solomon's Chamber
4. Check previous work before starting
5. Don't waste tokens

---

## ❌ MISTAKES TO NEVER REPEAT

1. **Don't change fonts/design without asking** (April 9 incident)
2. **Don't move components without permission** (Ebook section incident)
3. **Don't break working features** (ElevenLabs, music player)
4. **Don't skip task logging** (This session)
5. **Don't assume - ASK**

---

## 📝 TASK LOGGING TEMPLATE

When creating a task log, use this format:

```markdown
# TASK LOG - {Brief Description}

## Status: 🟡 IN PROGRESS / ✅ COMPLETE

## Task Description
{What needs to be done}

## User Command (Exact Quote)
> "{exact user command}"

## Execution Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Files to Modify
| File | Action |
|------|--------|
| path/to/file | Create/Modify |

## Expected Outcome
{What success looks like}

## Started At
{ISO timestamp}

---

## Progress Log
- [timestamp] Started
- [timestamp] Progress update
- [timestamp] Completed

## Results
✅ What was accomplished
❌ What failed (if anything)

## Completed At
{ISO timestamp}
```

---

*This file MUST be read at the start of EVERY session. Last updated: 2026-04-10*
