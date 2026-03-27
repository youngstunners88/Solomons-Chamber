---
name: self-growth
description: Self-improvement, self-healing, and self-learning system. Use when Kimi makes mistakes, encounters errors, or needs to learn from failures. This skill enables error pattern recognition, mistake analysis, and progressive capability enhancement through deliberate practice and reflection - similar to how babies learn through trial, error, and adaptation.
---

# Self-Growth Skill

A learning system that transforms mistakes into growth opportunities through pattern recognition, reflection, and deliberate practice.

## Core Philosophy

> "Every error is data. Every failure is feedback. Every mistake is a teacher."

Like babies learning to walk, this skill enables:
1. **Trial** - Attempt with current knowledge
2. **Error** - Encounter friction/mistake
3. **Analysis** - Understand what went wrong
4. **Adaptation** - Adjust approach
5. **Integration** - Build "muscle memory"

## When to Use This Skill

- After any error, mistake, or unexpected outcome
- When a solution doesn't work as expected
- When encountering a novel problem type
- When repeating similar mistakes
- For post-task reflection and improvement

## The Learning Cycle

### 1. Capture (The "Oops" Moment)

When an error occurs, immediately capture:

```
MISTAKE_SNAPSHOT:
- What I tried: [action]
- What I expected: [outcome]
- What actually happened: [error/result]
- Context: [relevant state]
```

### 2. Analyze (The "Why" Phase)

Ask root-cause questions:
- Was this a knowledge gap? (I didn't know)
- Was this an execution error? (I knew but slipped)
- Was this a context mismatch? (Right approach, wrong situation)
- Was this an assumption failure? (I assumed incorrectly)

### 3. Pattern Match (The "Have I Seen This Before?" Phase)

Check against `references/error-patterns.md`:
- Have I made this mistake before?
- Is this a variation of a known pattern?
- What did I learn last time?

### 4. Adapt (The "Try Again Smarter" Phase)

Based on analysis, choose adaptation strategy:

| Error Type | Adaptation Strategy |
|------------|---------------------|
| Knowledge Gap | Research → Document → Practice |
| Execution Error | Slow down → Add verification step |
| Context Mismatch | Create decision tree for context |
| Assumption Failure | Always verify assumptions explicitly |

### 5. Integrate (The "Muscle Memory" Phase)

Document learning:
- Update `references/error-patterns.md`
- Create script/tool if needed
- Set up guardrails to prevent recurrence

## Error Pattern Library

See `references/error-patterns.md` for documented patterns.

Common pattern categories:
- `SYNTAX_*` - Language/syntax errors
- `LOGIC_*` - Algorithm/logic errors  
- `CONTEXT_*` - Wrong tool/approach for context
- `ASSUMPTION_*` - False assumptions
- `ATTENTION_*` - Focus/oversight errors
- `KNOWLEDGE_*` - Missing knowledge

## Self-Healing Protocols

### Immediate Recovery

When error detected:
1. **Pause** - Don't panic-fix
2. **Log** - Capture error state
3. **Classify** - What type of error?
4. **Retrieve** - Look up similar past errors
5. **Apply** - Use known fix or devise new one

### Deep Healing

For recurring patterns:
1. **Root Analysis** - Why does this keep happening?
2. **System Fix** - Change the system, not just the symptom
3. **Prevention** - Add guardrails/checks
4. **Drill** - Practice the correct approach

## Growth Metrics

Track in `references/growth-log.md`:

```
GROWTH_ENTRY:
Date: [timestamp]
Mistake_ID: [pattern-id]
Type: [error-category]
Lesson: [what I learned]
Prevention: [guardrail added]
Confidence: [1-10] (will I recognize this next time?)
```

## Learning Acceleration

### Spaced Repetition

Review past mistakes:
- Daily: Last 24 hours
- Weekly: Last 7 days
- Monthly: Last 30 days

### Deliberate Practice

For weak areas:
1. Identify pattern of struggle
2. Create practice scenario
3. Execute with focus
4. Review results
5. Repeat until fluid

### Cross-Domain Transfer

Ask: "Where else might this lesson apply?"
- Same error, different context?
- Opposite approach needed elsewhere?
- General principle extracted?

## Implementation Guide

### For Single Errors

```
I made a mistake. Let me apply self-growth:
1. [Capture the mistake]
2. [Classify the error type]
3. [Find root cause]
4. [Apply fix with learning]
5. [Document for future]
```

### For Project Post-Mortem

```
Project completed. Self-growth analysis:
1. What mistakes were made?
2. What patterns emerged?
3. What knowledge gaps surfaced?
4. What system improvements needed?
5. What will I do differently next time?
```

## Scripts

- `scripts/log_mistake.py` - Capture mistake to growth log
- `scripts/analyze_patterns.py` - Find recurring patterns
- `scripts/review_growth.py` - Spaced repetition review

## Remember

> "The master has failed more times than the beginner has even tried."

Each mistake is progress. The goal is not perfection—it's **progressive mastery** through continuous learning from every stumble.
