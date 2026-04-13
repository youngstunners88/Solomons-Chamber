# Task Logging System - MANDATORY RULE

> **⚠️ CRITICAL RULE: Every task MUST be logged in Solomon's Chamber BEFORE execution and AFTER completion**

## Purpose
Prevent loss of work context across sessions. If system crashes or session ends unexpectedly, we know exactly what was being attempted.

## Workflow - FOLLOW EXACTLY

### Step 1: BEFORE Starting Any Task

**Create Task Log Entry:**
```bash
# File: Solomons-Chamber/09-Agent-Sessions/current/TASK-{timestamp}.md
```

**Template:**
```markdown
# TASK LOG - {timestamp}

## Status: 🟡 IN PROGRESS

## Task Description
{Clear description of what user asked for}

## User Command (Exact Quote)
> "{exact user command}"

## Execution Plan
1. {Step 1}
2. {Step 2}
3. {Step 3}

## Files to Modify
- {file1}
- {file2}

## Expected Outcome
{What success looks like}

## Started: {ISO timestamp}
## Agent: Kimi Code CLI
```

### Step 2: DURING Task Execution

**Update the same file with progress:**
- Mark steps as complete: `✅ Step 1`
- Add notes about issues encountered
- Document decisions made

### Step 3: AFTER Task Completion

**Update Task Log:**
```markdown
## Status: ✅ COMPLETE

## Results
- {What was accomplished}
- {Files created/modified}
- {Key outcomes}

## Issues Encountered
- {Any problems and solutions}

## Files Created/Modified
| File | Action | Lines |
|------|--------|-------|
| file.ts | Created | 150 |
| file2.ts | Modified | +20/-5 |

## Completion Time: {ISO timestamp}
## Duration: {X minutes}

## Next Steps (if any)
- {Step for next session}
```

**Move to Archive:**
```bash
mv TASK-{timestamp}.md ../archive/
```

---

## MANDATORY CHECKLIST

Before executing ANY user request:

- [ ] Create task log file with timestamp
- [ ] Quote exact user command
- [ ] Write execution plan
- [ ] List files to modify

After completing task:

- [ ] Update status to COMPLETE
- [ ] Document results
- [ ] List all files touched
- [ ] Record completion time
- [ ] Calculate duration
- [ ] Move to archive (optional)

---

## CRASH RECOVERY

### If Session Crashes:

1. **Check Current Tasks:**
```bash
ls -la Solomons-Chamber/09-Agent-Sessions/current/TASK-*
```

2. **Find Incomplete Tasks:**
```bash
grep -l "IN PROGRESS" Solomons-Chamber/09-Agent-Sessions/current/TASK-*
```

3. **Resume from Last Known State**

---

**This system is MANDATORY. No exceptions.**
