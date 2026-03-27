---
name: research-scout
description: Find new information that challenges or updates existing knowledge. Uses web search, Reddit, Hacker News, and Quora to hunt for new strategies, tools, announcements, and workflow changes relevant to current documentation and project context. Cross-references findings against existing docs, discards redundant info, and stores validated findings in new_learnings section of long-term-memory.md.
---

# Research Scout Skill

Continuous intelligence gathering to keep knowledge current and challenge assumptions.

## Purpose

Most AI knowledge has a cutoff date. This skill:
1. Monitors multiple sources for new information
2. Cross-references against existing documentation
3. Identifies genuinely new or contradictory findings
4. Stages validated learnings for review
5. Runs continuously (3x nightly) to catch updates

## When to Run

- **Automatically**: 3x nightly (00:00, 04:00, 08:00) via cron
- **Manually**: Before major decisions, when user asks "what's new?"
- **Trigger**: User says "scout for updates" or "research X"

## Data Sources

| Source | What It Provides | Query Types |
|--------|------------------|-------------|
| **Web Search** (DuckDuckGo/Bing) | General news, documentation updates | Tool announcements, version releases |
| **Reddit** (r/programming, r/MachineLearning, etc.) | Community discussions, real-world experiences | Workflow patterns, tool comparisons |
| **Hacker News** | Tech industry trends, startup launches | New projects, funding news |
| **Quora** | Explanations, best practices | Strategy questions, how-to guides |

## How It Works

```
Existing Docs ←→ Scout searches sources → Finds candidates
                                      ↓
                            Cross-reference against docs
                                      ↓
                            New/Contradictory? → Stage in new_learnings
                            Redundant? → Discard
```

## Search Strategy

### 1. Extract Topics from Context

Reads from:
- `~/memory/long-term-memory.md` (technical stack, preferences)
- `~/memory/project-memory.md` (active projects, blockers)
- `~/AGENTS.md` (project documentation)
- `~/README.md` (current setup)

### 2. Generate Search Queries

Based on extracted topics, generates queries like:
- `"{technology} new features 2026"`
- `"{tool} alternative"`
- `"best {category} 2026 reddit"`
- `"{project} vs {competitor}"`

### 3. Validate Findings

Before staging, checks:
- Is this already in our docs? (exact match skip)
- Does this contradict existing knowledge? (flag for review)
- Is this a minor version bump or major change? (prioritize)
- Is the source credible? (filter)

### 4. Stage Findings

Valid findings stored in `new_learnings` section:

```markdown
## new_learnings

- **[2026-03-27 08:15]** | Source: [HN](https://...) | Finding: Bun 1.2 adds built-in S3 support | Impact: Could replace separate AWS SDK dependency
- **[2026-03-27 04:00]** | Source: [Reddit](https://...) | Finding: FastAPI now recommends Pydantic v2 by default | Impact: Migration needed from v1 models
```

## Usage

```bash
# Run full scout (all sources)
python3 ~/skills/research-scout/scripts/scout.py

# Scout specific topic
python3 ~/skills/research-scout/scripts/scout.py --topic "fastapi authentication"

# Scout specific source only
python3 ~/skills/research-scout/scripts/scout.py --source reddit

# Dry run (don't write to memory)
python3 ~/skills/research-scout/scripts/scout.py --dry-run

# Force include even if seems redundant
python3 ~/skills/research-scout/scripts/scout.py --force
```

## Output Format

Each finding includes:
- **Timestamp**: When discovered
- **Source**: URL and platform (HN, Reddit, etc.)
- **Finding**: One-line summary
- **Impact**: What it changes or adds
- **Contradiction**: If it conflicts with existing docs

## Weekly Promotion

Every Sunday, `promote-learnings.py`:
1. Reviews all staged findings in `new_learnings`
2. For confirmed patterns: promotes to main memory sections
3. For contradictions: flags for user review
4. Clears processed entries from staging

## Scheduling

```bash
# Scout 3x nightly
0 0 * * * /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/scout.py
0 4 * * * /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/scout.py
0 8 * * * /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/scout.py

# Weekly promotion (Sundays at 10 AM)
0 10 * * 0 /usr/bin/python3 /home/teacherchris37/skills/research-scout/scripts/promote-learnings.py
```

## Topics Currently Monitored

Auto-extracted from your context:
- FastAPI, MongoDB, Celery (backend stack)
- React, TypeScript, Tailwind (frontend stack)
- Polymarket, Kalshi, trading automation
- Sub-atomic agents, mesh networking
- South Africa tech ecosystem
- Kimi CLI, Claude Code (AI tooling)
- Docker, Railway, Render (deployment)

## Manual Topic Addition

```bash
# Add a topic to monitor
python3 ~/skills/research-scout/scripts/add_topic.py "Rust async runtime"

# List monitored topics
python3 ~/skills/research-scout/scripts/list_topics.py

# Remove a topic
python3 ~/skills/research-scout/scripts/remove_topic.py "deprecated-tech"
```
