# 🤖 Teacher Platform Implementor Agents

> **Hermes** & **SpaceBot** — AI agents that help teachers build, customize, and extend their command center.

---

## 🎯 Purpose

These are **internal implementor agents** for the Teacher's Command Center. They help with:
- Building custom lesson content
- Creating UI components
- Integrating new tools
- Automating workflows

---

## 📚 Agent Documentation

| Document | Description |
|----------|-------------|
| [`HERMES_AGENT.md`](HERMES_AGENT.md) | Curriculum & content agent (teacher-facing) |
| [`SPACEBOT_AGENT.md`](SPACEBOT_AGENT.md) | Technical implementation agent (dev-facing) |
| [`AGENT_ORCHESTRATION.md`](AGENT_ORCHESTRATION.md) | How they work together |

---

## 🎭 Agent Personas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEACHER COMMAND CENTER                               │
│                              AI AGENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────┐        ┌──────────────────────┐                  │
│   │       HERMES         │        │      SPACEBOT        │                  │
│   │   📚 The Teacher     │        │   🔧 The Builder     │                  │
│   │                      │        │                      │                  │
│   │  "What do you want   │◀──────▶│  "I'll build that    │                  │
│   │   to teach today?"   │        │   for you."          │                  │
│   │                      │        │                      │                  │
│   │  • Lesson plans      │        │  • UI components     │                  │
│   │  • Content creation  │        │  • API integrations  │                  │
│   │  • Resource curation │        │  • Automation        │                  │
│   │  • Assessments       │        │  • Custom tools      │                  │
│   └──────────────────────┘        └──────────────────────┘                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Usage

### For Teachers (Hermes)
```
Teacher: "I need a lesson plan about photosynthesis for Grade 7"
Hermes: Creates structured lesson + suggests Twinkl resources + generates quiz
```

### For Developers/Teachers (SpaceBot)
```
Teacher: "Can you add a custom attendance tracker?"
SpaceBot: Generates React component + API route + database migration
```

---

## 📁 Project Context

**Base Project**: `teachers-command-center/`
- Next.js 15 + Tailwind + shadcn/ui
- Supabase backend
- ICP canisters (Phase 2)
- Integrations: ClassIn, Canva, Twinkl, Pinterest, Skool

**Created**: 2026-03-31  
**Location**: `Solomons-Chamber/01-Projects/agent-architecture/`
