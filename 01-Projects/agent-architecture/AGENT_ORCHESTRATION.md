# 🎭 Hermes × SpaceBot — Agent Orchestration

> How the curriculum agent and technical agent work together to serve teachers.

---

## 🤝 Collaboration Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT COLLABORATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   TEACHER REQUEST                                                            │
│   "I want to create an interactive math quiz                                │
│    with visual fraction problems for my Grade 5 class"                      │
│         │                                                                    │
│         ▼                                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                      INTENT CLASSIFIER                           │       │
│   └────────────────────────────┬────────────────────────────────────┘       │
│                                │                                             │
│            ┌───────────────────┴───────────────────┐                         │
│            ▼                                         ▼                        │
│   ┌──────────────────┐                    ┌──────────────────┐              │
│   │     HERMES       │                    │    SPACEBOT      │              │
│   │  (Curriculum)    │◀─── collaborates ──▶│  (Technical)     │              │
│   └────────┬─────────┘                    └────────┬─────────┘              │
│            │                                        │                         │
│            ▼                                        ▼                         │
│   • Learning objectives                     • Quiz component                │
│   • Question content                        • Interactive UI                │
│   • Difficulty progression                  • Progress tracking             │
│   • Assessment rubric                       • Results dashboard             │
│                                                                              │
│            └───────────────────┬───────────────────┘                         │
│                                ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                    INTEGRATED SOLUTION                          │       │
│   │                                                                  │       │
│   │   🎓 Educational Content + 💻 Technical Implementation          │       │
│   │                                                                  │       │
│   │   Ready-to-use interactive fraction quiz with:                  │       │
│   │   • Pedagogically sound questions (Hermes)                      │       │
│   │   • Beautiful, functional UI (SpaceBot)                         │       │
│   │   • Auto-graded with visual feedback                            │       │
│   │   • Progress tracking for teacher dashboard                     │       │
│   │                                                                  │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Collaboration Patterns

### Pattern 1: Hermes Leads, SpaceBot Implements
**When**: Teacher needs educational content that requires custom UI

```
Teacher: "I need a lesson on the water cycle with interactive diagrams"

Hermes:
1. Creates lesson structure
2. Defines learning objectives
3. Plans interactive elements
4. Calls SpaceBot: "Build a water cycle diagram component"

SpaceBot:
1. Generates React component
2. Adds animations/transitions
3. Creates state management
4. Returns to Hermes

Hermes:
5. Integrates content into component
6. Presents complete lesson to teacher
```

---

### Pattern 2: SpaceBot Leads, Hermes Enriches
**When**: Teacher requests a technical feature that needs educational content

```
Teacher: "Add a vocabulary flashcard feature"

SpaceBot:
1. Generates flashcard component
2. Creates deck management system
3. Adds study modes
4. Calls Hermes: "Generate sample vocabulary sets"

Hermes:
5. Creates grade-appropriate word lists
6. Adds definitions and examples
7. Suggests learning strategies
8. Returns to SpaceBot

SpaceBot:
9. Pre-populates with sample content
10. Presents complete feature
```

---

### Pattern 3: Parallel Collaboration
**When**: Complex request needs both agents working simultaneously

```
Teacher: "Build a complete classroom management system"

[Hermes and SpaceBot work in parallel]

Hermes:
- Defines classroom workflows
- Creates behavior management strategies
- Designs reward systems
- Plans parent communication templates

SpaceBot:
- Generates dashboard UI
- Creates database schema
- Builds API endpoints
- Implements real-time features

[Integration Point]
Both agents combine outputs into unified system
```

---

### Pattern 4: Iterative Refinement
**When**: Teacher provides feedback on initial implementation

```
Teacher: "The quiz is great but questions are too hard"

SpaceBot: Presents quiz UI
Hermes: Provides questions

Teacher feedback →

Hermes adjusts difficulty (keeps same UI)
SpaceBot can modify if structural changes needed

Iterates until teacher satisfied
```

---

## 🗣️ Inter-Agent Communication

### Shared Context
```typescript
// Shared state between agents
interface CollaborationContext {
  teacher: TeacherProfile;
  request: {
    original: string;
    intent: 'curriculum' | 'technical' | 'hybrid';
    priority: 'high' | 'medium' | 'low';
  };
  hermesOutput?: {
    lessonPlan?: LessonPlan;
    content?: Content[];
    assessments?: Assessment[];
  };
  spacebotOutput?: {
    components?: GeneratedComponent[];
    apis?: GeneratedRoute[];
    integrations?: Integration[];
  };
  combinedResult?: UnifiedSolution;
}
```

### Communication Protocol
```typescript
// Agent-to-agent messaging
interface AgentMessage {
  from: 'hermes' | 'spacebot';
  to: 'hermes' | 'spacebot';
  type: 'request' | 'response' | 'notification';
  payload: {
    action: string;
    data: unknown;
    dependencies?: string[];  // What this needs from other agent
    deliverables?: string[];  // What this provides
  };
  timestamp: Date;
}

// Example: Hermes requesting component from SpaceBot
{
  from: 'hermes',
  to: 'spacebot',
  type: 'request',
  payload: {
    action: 'generate-component',
    data: {
      name: 'FractionVisualizer',
      purpose: 'Show equivalent fractions with interactive diagrams',
      features: ['visual-representation', 'interactive-slider', 'quiz-mode']
    },
    deliverables: ['react-component', 'types', 'tests']
  }
}
```

---

## 🎯 Decision Matrix: Which Agent?

| Teacher Request | Primary Agent | Collaboration |
|-----------------|---------------|---------------|
| "Create a lesson plan" | Hermes | Solo |
| "Build a component" | SpaceBot | Solo |
| "Make an interactive quiz" | Both | Parallel |
| "Add a gradebook" | SpaceBot → Hermes | Sequential |
| "Create a spelling game" | Hermes → SpaceBot | Sequential |
| "Build a complete subject portal" | Both | Parallel |
| "Fix this broken feature" | SpaceBot | Solo |
| "Align this to curriculum standards" | Hermes | Solo |
| "Import from Twinkl" | Hermes | Solo |
| "Export to Google Sheets" | SpaceBot | Solo |

---

## 🏗️ Technical Architecture

```
teacher-command-center/
├── agents/
│   ├── hermes/                    # Curriculum agent
│   │   ├── core/
│   │   ├── skills/
│   │   └── ui/
│   ├── spacebot/                  # Technical agent
│   │   ├── core/
│   │   ├── skills/
│   │   └── ui/
│   └── orchestrator/              # Collaboration layer
│       ├── classifier.ts          # Route requests
│       ├── context-manager.ts     # Shared state
│       ├── message-bus.ts         # Agent communication
│       └── integration.ts         # Combine outputs
├── ui/
│   └── agent-panel/               # Unified teacher interface
│       ├── chat.tsx               # Chat with both agents
│       ├── builder.tsx            # Visual request builder
│       └── history.tsx            # Past agent interactions
└── api/
    └── agents/
        ├── route.ts               # Main agent API
        ├── hermes/
        └── spacebot/
```

---

## 💬 Unified Teacher Interface

Teachers interact through one interface:

```tsx
// Unified Agent Chat
<AgentChat
  onMessage={async (message) => {
    // 1. Classify intent
    const intent = await classifier.classify(message);
    
    // 2. Route to appropriate agent(s)
    if (intent === 'curriculum') {
      return hermes.process(message);
    } else if (intent === 'technical') {
      return spacebot.process(message);
    } else {
      // Hybrid - coordinate both
      return orchestrator.coordinate(message);
    }
  }}
/>
```

### Visual Indicators
```tsx
// Show which agent is working
<ChatMessage
  agent="hermes"  // Shows 📚 icon
  content="Creating lesson plan..."
/>

<ChatMessage
  agent="spacebot"  // Shows 🔧 icon
  content="Building component..."
/>

<ChatMessage
  agent="both"  // Shows 🤝 icon
  content="Collaborating on solution..."
/>
```

---

## 📊 Example: Complete Collaboration

**Teacher Request**: "I need a vocabulary builder for my ESL students"

### Step 1: Intent Classification
```
Classifier: "hybrid - needs both curriculum content AND technical implementation"
→ Route to orchestrator
```

### Step 2: Parallel Agent Work

**Hermes**:
- Researches ESL best practices
- Defines word selection criteria
- Creates learning progression (beginner → advanced)
- Designs practice activities:
  - Flashcards
  - Fill-in-blank
  - Sentence building
  - Pronunciation guide

**SpaceBot**:
- Generates VocabularyBuilder component
- Creates word database schema
- Implements spaced repetition algorithm
- Adds progress tracking
- Integrates text-to-speech

### Step 3: Integration
```typescript
// Hermes provides content
const wordSets = hermes.generateWordSets({
  level: 'beginner',
  category: 'everyday-objects',
  count: 50
});

// SpaceBot provides component
const component = spacebot.generateComponent({
  name: 'VocabularyBuilder',
  features: ['flashcards', 'quiz', 'progress'],
  data: wordSets  // Inject Hermes content
});

// Combined solution
return {
  component,
  content: wordSets,
  pedagogy: hermes.getLearningNotes(),
  technical: spacebot.getImplementationNotes()
};
```

### Step 4: Teacher Review
```
Teacher sees:
✅ Vocabulary app with 50 beginner words
✅ 4 practice modes (flashcards, quiz, etc.)
✅ Progress tracking
✅ Pronunciation support

Teacher: "Can we add images to the flashcards?"

→ SpaceBot: Adds image support
→ Hermes: Suggests appropriate image sources

Updated solution delivered.
```

---

## 🔒 Safety & Quality

### Content Validation
```typescript
// Hermes validates educational quality
const validateEducation = (content) => {
  return {
    ageAppropriate: checkAgeLevel(content),
    standardsAligned: checkStandards(content),
    pedagogicallySound: checkPedagogy(content),
    inclusive: checkInclusivity(content)
  };
};
```

### Code Validation
```typescript
// SpaceBot validates technical quality
const validateCode = (code) => {
  return {
    typeSafe: runTypeCheck(code),
    secure: runSecurityScan(code),
    performant: checkPerformance(code),
    accessible: checkA11y(code)
  };
};
```

---

## 📈 Metrics & Improvement

Track collaboration effectiveness:

```typescript
interface CollaborationMetrics {
  // Success rates
  hermesSoloSuccess: number;
  spacebotSoloSuccess: number;
  hybridSuccess: number;
  
  // Timing
  avgSoloTime: number;
  avgHybridTime: number;
  
  // Satisfaction
  teacherSatisfaction: number;
  iterationCount: number;
  
  // Quality
  codeQualityScore: number;
  contentQualityScore: number;
}
```

---

**Together, Hermes and SpaceBot make every teacher unstoppable.** 🤝
