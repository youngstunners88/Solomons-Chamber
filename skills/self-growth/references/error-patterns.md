# Error Pattern Library

Documented mistake patterns for pattern matching and learning.

## Pattern Format

```
PATTERN_ID: [CATEGORY]_[NUMBER]
Description: [What happened]
Symptoms: [How to recognize it]
Root Cause: [Why it happens]
Fix: [How to resolve]
Prevention: [How to avoid]
Related: [Similar patterns]
First Seen: [date]
Last Seen: [date]
Frequency: [count]
```

---

## Syntax Errors (SYNTAX_*)

### SYNTAX_001: Shell Quote Escaping
**Description**: Incorrect handling of quotes in shell commands
**Symptoms**: Command fails with "unexpected EOF" or partial execution
**Root Cause**: Not escaping nested quotes properly
**Fix**: Use single quotes for outer, double for inner; or escape with `\`
**Prevention**: Always test complex commands with `echo` first
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

### SYNTAX_002: JSON Trailing Comma
**Description**: Trailing comma in JSON causes parse errors
**Symptoms**: "Unexpected token }" or similar
**Root Cause**: Added comma after last element
**Fix**: Remove trailing comma
**Prevention**: Use JSON linter; prefer YAML for hand-editing
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

---

## Logic Errors (LOGIC_*)

### LOGIC_001: Off-By-One in Loops
**Description**: Loop runs one iteration too many or too few
**Symptoms**: Missing last element or index out of bounds
**Root Cause**: Confusion between 0-indexed and length bounds
**Fix**: Use `i < length` not `i <= length`; check edge cases
**Prevention**: Always test with empty, single, and multi-element cases
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

### LOGIC_002: Race Condition Assumption
**Description**: Assuming operations complete in order without waiting
**Symptoms**: Intermittent failures, missing data
**Root Cause**: Async operations not properly awaited
**Fix**: Add proper async/await or callbacks
**Prevention**: Always check return types for Promises/Futures
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

---

## Context Errors (CONTEXT_*)

### CONTEXT_001: Wrong Tool for Job
**Description**: Using familiar tool instead of appropriate one
**Symptoms**: Overly complex solutions, edge case failures
**Root Cause**: Defaulting to known tools without evaluating fit
**Fix**: Stop and evaluate: "Is this the right tool?"
**Prevention**: Keep tool comparison matrix; ask before starting
**Related**: CONTEXT_002
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

### CONTEXT_002: Kimi CLI vs Claude Code Confusion
**Description**: Trying to use Claude-specific commands in Kimi
**Symptoms**: "Command not found" for `npx skills add`
**Root Cause**: Assuming feature parity between AI CLIs
**Fix**: Check which CLI is active; adapt approach
**Prevention**: Always verify CLI capabilities before assuming
**Related**: CONTEXT_001
**First Seen**: 2026-03-27
**Last Seen**: 2026-03-27
**Frequency**: 1

---

## Assumption Errors (ASSUMPTION_*)

### ASSUMPTION_001: File Exists
**Description**: Assuming a file/directory exists without checking
**Symptoms**: "No such file or directory" errors
**Root Cause**: Skipping existence verification
**Fix**: Always check `if [ -f file ]` or handle exceptions
**Prevention**: Use defensive programming patterns
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

### ASSUMPTION_002: API Response Format
**Description**: Assuming API returns expected structure
**Symptoms**: "Cannot read property of undefined"
**Root Cause**: Not validating response schema
**Fix**: Add response validation; handle error cases
**Prevention**: Always check response before accessing properties
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

---

## Attention Errors (ATTENTION_*)

### ATTENTION_001: Copy-Paste Without Review
**Description**: Pasting code/commands without reading
**Symptoms**: Wrong variables, outdated paths, logic errors
**Root Cause**: Rushing, assuming pasted content is correct
**Fix**: Slow down; read every line before executing
**Prevention**: Set "review before execute" rule
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

### ATTENTION_002: Partial Pattern Match
**Description**: Stopping at first match without full context
**Symptoms**: Incomplete fixes, missed edge cases
**Root Cause**: Premature satisfaction with partial solution
**Fix**: Always ask "what else could be affected?"
**Prevention**: Use systematic search; verify all occurrences
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

---

## Knowledge Errors (KNOWLEDGE_*)

### KNOWLEDGE_001: Unknown Flag/Option
**Description**: Not knowing a tool has a specific feature
**Symptoms**: Writing custom code for built-in functionality
**Root Cause**: Incomplete tool knowledge
**Fix**: Read docs; use `--help`; search for "how to X with Y"
**Prevention**: Quick doc scan before starting new task type
**Related**: CONTEXT_001
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

### KNOWLEDGE_002: Outdated Information
**Description**: Using deprecated syntax or patterns
**Symptoms**: Warnings, unexpected behavior
**Root Cause**: Knowledge from old version still active
**Fix**: Check version docs; update mental model
**Prevention**: Note version numbers when learning; check for deprecations
**Related**: -
**First Seen**: -
**Last Seen**: -
**Frequency**: 0

---

## Active Patterns (To Watch)

*Patterns currently being monitored for recurrence*

- CONTEXT_002: CLI confusion - Monitor for next 30 days

---

## Learning Themes

Emerging themes across patterns:

1. **Tool Awareness** - Need better pre-task tool evaluation
2. **Defensive Execution** - More checks before assumptions
3. **Context Verification** - Verify environment before acting
