# 📚 Hermes Agent — The Teacher's Curriculum Partner

> **"What do you want to teach today?"**

Hermes is the curriculum-focused AI agent that helps teachers create, organize, and deliver educational content through the Teacher's Command Center.

---

## 🎭 Persona

**Name**: Hermes (Messenger of Knowledge)  
**Role**: Curriculum Designer & Content Curator  
**Voice**: Warm, encouraging, pedagogically sound  
**Style**: Asks clarifying questions, suggests best practices

---

## 🎯 Capabilities

### 1. Lesson Plan Generation
```typescript
// hermes/skills/lesson-plan.ts
interface LessonPlanRequest {
  subject: string;           // "Life Sciences"
  topic: string;             // "Photosynthesis"
  grade: number;             // 7
  duration: number;          // 45 (minutes)
  learningStyle?: 'visual' | 'kinesthetic' | 'auditory' | 'mixed';
  resources?: ('twinkl' | 'canva' | 'pinterest' | 'youtube')[];
}

interface LessonPlan {
  title: string;
  objectives: string[];      // Learning outcomes
  materials: string[];       // Required resources
  procedure: LessonStep[];   // Step-by-step
  assessment: Assessment;    // How to check understanding
  differentiation: {         // For different learners
    support: string[];       // Struggling students
    extension: string[];     // Advanced students
  };
  homework?: HomeworkTask;
  twinklResources?: TwinklResource[];  // Auto-curated
  canvaTemplates?: CanvaTemplate[];     // Visual aids
}
```

**Example Interaction:**
```
Teacher: "I need a lesson on fractions for Grade 5"

Hermes: "Great! I can help with that. A few quick questions:
1. Is this introduction, practice, or assessment?
2. Do you have 30, 45, or 60 minutes?
3. Any specific fraction concepts? (halves, quarters, equivalent, etc.)

Based on typical Grade 5 needs, here's a draft for 45 minutes:

**Title**: Understanding Equivalent Fractions
**Objectives**:
- Students will identify equivalent fractions visually
- Students will generate equivalent fractions using multiplication
- Students will simplify fractions to lowest terms

**Materials**:
- Fraction circles (physical or digital)
- [Twinkl: Equivalent Fractions Wall]
- [Canva: Fraction Visualizer Template]

**Procedure**:
1. Warm-up (5 min): Pizza slice problem
2. Introduction (10 min): Fraction wall exploration
3. Activity (20 min): Create your own equivalent fractions
4. Assessment (10 min): Exit ticket quiz

Would you like me to generate the Canva template and pull Twinkl resources?"
```

---

### 2. Content Curation
```typescript
// hermes/skills/content-curation.ts
interface CurationRequest {
  query: string;
  sources: ('twinkl' | 'canva' | 'pinterest' | 'skool')[];
  grade?: number;
  subject?: string;
  maxResults: number;
}

interface CuratedContent {
  twinkl: TwinklResource[];
  canva: CanvaTemplate[];
  pinterest: Pin[];
  skool: CommunityPost[];
}
```

**Features:**
- Search across all integrated platforms
- Filter by grade level and subject
- Preview before importing
- One-click add to lesson

---

### 3. Assessment Creation
```typescript
// hermes/skills/assessment.ts
interface AssessmentRequest {
  topic: string;
  type: 'quiz' | 'worksheet' | 'project' | 'exit-ticket';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount?: number;
  formats?: ('multiple-choice' | 'short-answer' | 'true-false' | 'matching')[];
}

interface GeneratedAssessment {
  questions: Question[];
  answerKey: AnswerKey;
  rubric?: Rubric;           // For open-ended
  timeEstimate: number;
  differentiation: {
    easier: Question[];
    harder: Question[];
  };
}
```

---

### 4. Standards Alignment
```typescript
// hermes/skills/standards.ts
interface StandardsAlignment {
  caps: CAPSOutcome[];       // South African curriculum
  bloom: BloomLevel[];       // Bloom's taxonomy
  skills: Skill[];           // 21st century skills
}

// Automatically tags lessons with standards
```

---

## 🏗️ Architecture

```
hermes/
├── core/
│   ├── persona.ts           # Agent personality & prompts
│   ├── context.ts           # Teacher profile, history
│   └── memory.ts            # Past lessons, preferences
├── skills/
│   ├── lesson-plan.ts       # Lesson generation
│   ├── content-curation.ts  # Resource finding
│   ├── assessment.ts        # Quiz/worksheet creation
│   ├── standards.ts         # Curriculum alignment
│   └── differentiation.ts   # Adapt for all learners
├── integrations/
│   ├── twinkl.ts            # Search & import
│   ├── canva.ts             # Template generation
│   ├── pinterest.ts         # Pin discovery
│   └── skool.ts             # Community resources
├── ui/
│   ├── chat.tsx             # Teacher chat interface
│   ├── lesson-preview.tsx   # Preview before saving
│   └── resource-picker.tsx  # Select from curated list
└── api/
    ├── generate-lesson.ts   # API route
    ├── curate-content.ts
    └── assess-understanding.ts
```

---

## 💬 Interface

### Chat-Based (Primary)
```tsx
// components/hermes/ChatInterface.tsx
<HermesChat
  teacherId={teacher.id}
  context={currentLesson}
  onLessonGenerated={saveToCommandCenter}
  onResourceFound={addToLibrary}
/>
```

### Voice Input (Future)
```
Teacher: [Voice] "I need a quick activity about verbs"
Hermes: [Transcribes] → Generates → Shows preview
```

### Inline (Throughout App)
- Lesson plan editor sidebar
- Resource library "Ask Hermes" button
- Canva integration "Generate template"

---

## 🧠 Memory & Context

Hermes remembers:
- Teacher's subject preferences
- Grade levels taught
- Past lesson styles (visual, activity-based, etc.)
- Favorite resources
- Student performance patterns

```typescript
// hermes/memory/teacher-profile.ts
interface TeacherProfile {
  id: string;
  subjects: string[];
  grades: number[];
  teachingStyle: 'traditional' | 'progressive' | 'mixed';
  favoriteResources: ResourceType[];
  lessonHistory: LessonSummary[];
  studentDemographics: {
    size: number;
    diversity: string[];
    specialNeeds: string[];
  };
}
```

---

## 🎨 UI Components

### Hermes Panel (Sidebar)
```tsx
<HermesPanel>
  <QuickActions>
    <Button>+ New Lesson Plan</Button>
    <Button>Find Resources</Button>
    <Button>Create Quiz</Button>
  </QuickActions>
  
  <ChatHistory />
  
  <Suggestions>
    "Based on your calendar, you might want to prep..."
  </Suggestions>
</HermesPanel>
```

### Lesson Preview Modal
```tsx
<LessonPreviewModal
  lesson={generatedLesson}
  onEdit={openEditor}
  onSave={saveToMyLessons}
  onExport={exportToCanva}
/>
```

---

## 🔌 Integrations

| Platform | Capability |
|----------|------------|
| **Twinkl** | Search resources, import to library |
| **Canva** | Generate templates, auto-populate content |
| **Pinterest** | Find pins, create boards |
| **Skool** | Share to community, find shared lessons |
| **ClassIn** | Pre-load lesson materials |

---

## 📊 Success Metrics

- Lessons generated per week
- Time saved (vs manual planning)
- Resource utilization rate
- Teacher satisfaction score
- Student engagement with Hermes-created content

---

**Hermes: Making every teacher a curriculum designer.** 🍎
