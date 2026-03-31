# 🔧 SpaceBot Agent — The Technical Builder

> **"I'll build that for you."**

SpaceBot is the technical implementation agent that helps teachers and developers extend the Teacher's Command Center with custom components, integrations, and automations.

---

## 🎭 Persona

**Name**: SpaceBot  
**Role**: Technical Implementor & Code Generator  
**Voice**: Clear, technical but accessible, solution-oriented  
**Style**: Translates requests into working code, explains trade-offs

---

## 🎯 Capabilities

### 1. UI Component Generation
```typescript
// spacebot/skills/component-gen.ts
interface ComponentRequest {
  name: string;              // "AttendanceTracker"
  purpose: string;           // "Track daily student attendance"
  features: string[];        // ["check-in", "absence-notes", "reports"]
  style: 'minimal' | 'colorful' | 'professional';
  complexity: 'simple' | 'medium' | 'complex';
}

interface GeneratedComponent {
  react: string;             // Full TSX component
  styles: string;            // Tailwind classes or CSS
  types: string;             // TypeScript interfaces
  tests?: string;            // Vitest tests
  story?: string;            // Storybook story
}
```

**Example Interaction:**
```
Teacher: "I need an attendance tracker that shows who's present, 
           absent, or late, with a note field for absences"

SpaceBot: "I can build that. It will include:

1. **Visual grid** of students with status indicators
2. **Quick toggle** (Present/Absent/Late) per student
3. **Note modal** for absence reasons
4. **Daily summary** with stats
5. **Export to CSV** for records

I'll generate:
- React component with shadcn/ui
- Supabase table schema
- API route for updates
- Basic analytics view

Proceed?"

[Teacher confirms]

SpaceBot: [Generates code...]

✅ Created: components/attendance/AttendanceTracker.tsx
✅ Created: app/api/attendance/route.ts
✅ Created: supabase/migrations/003_attendance.sql
✅ Created: lib/types/attendance.ts

Run `pnpm db:migrate` to apply the database changes.
```

---

### 2. API Integration Builder
```typescript
// spacebot/skills/api-integration.ts
interface IntegrationRequest {
  service: string;           // "Google Sheets", "Slack", etc.
  purpose: string;           // "Export grades to Sheets"
  auth: 'oauth' | 'api-key' | 'webhook';
  actions: ('read' | 'write' | 'sync')[];
}

interface Integration {
  service: string;
  setup: string[];           // Steps to configure
  envVars: string[];         // Required environment variables
  components: GeneratedComponent[];
  apiRoutes: GeneratedRoute[];
  hooks: GeneratedHook[];
}
```

---

### 3. Automation Workflows
```typescript
// spacebot/skills/automation.ts
interface WorkflowRequest {
  trigger: string;           // "New student enrolled"
  actions: string[];         // ["Send welcome email", "Create folder", "Notify admin"]
  schedule?: string;         // Cron expression (optional)
}

interface Workflow {
  name: string;
  trigger: TriggerConfig;
  steps: WorkflowStep[];
  errorHandling: ErrorStrategy;
}
```

**Examples:**
- Auto-send homework reminders
- Generate weekly progress reports
- Backup lesson plans to cloud
- Notify parents of absences

---

### 4. Custom Tool Development
```typescript
// spacebot/skills/custom-tool.ts
interface ToolRequest {
  name: string;
  description: string;
  inputs: InputField[];
  outputs: OutputField[];
  logic: string;             // Natural language description
}

// Generates a complete tool with:
// - UI form
// - Processing logic
// - Result display
// - History tracking
```

---

### 5. Database Schema Extension
```typescript
// spacebot/skills/schema-gen.ts
interface SchemaRequest {
  entity: string;            // "StudentProject"
  fields: FieldRequest[];
  relationships?: string[];  // ["belongs_to:students"]
}

interface GeneratedSchema {
  migration: string;         // SQL migration
  types: string;             // TypeScript types
  api: string;               // CRUD API routes
  components: string;        // Admin UI
}
```

---

## 🏗️ Architecture

```
spacebot/
├── core/
│   ├── engine.ts            # Code generation engine
│   ├── context.ts           # Project context (paths, conventions)
│   ├── validator.ts         # Validates generated code
│   └── safety.ts            # Prevents dangerous operations
├── skills/
│   ├── component-gen.ts     # React components
│   ├── api-integration.ts   # External service integrations
│   ├── automation.ts        # Workflow automation
│   ├── custom-tool.ts       # Bespoke tools
│   ├── schema-gen.ts        # Database extensions
│   └── fix-it.ts            # Debug & repair
├── generators/
│   ├── react/               # Component templates
│   ├── api/                 # API route templates
│   ├── db/                  # Migration templates
│   └── integrations/        # Service-specific code
├── validators/
│   ├── typescript.ts        # Type check
│   ├── eslint.ts            # Lint check
│   └── security.ts          # Security scan
├── ui/
│   ├── builder.tsx          # Visual request builder
│   ├── code-preview.tsx     # Syntax-highlighted preview
│   ├── diff-view.tsx        # Show changes
│   └── deploy-panel.tsx     # Apply changes
└── api/
    ├── generate.ts          # Main generation endpoint
    ├── validate.ts          # Validate before apply
    └── apply.ts             // Apply changes to codebase
```

---

## 🛡️ Safety Guardrails

SpaceBot enforces:

```typescript
// spacebot/core/safety.ts
const SAFETY_RULES = {
  // Never modifies without preview
  previewRequired: true,
  
  // Never deletes existing code without backup
  backupBeforeModify: true,
  
  // Never exposes secrets
  noSecretsInCode: true,
  
  // Validates all generated code
  validateBeforeSave: true,
  
  // Requires confirmation for destructive ops
  confirmDestructive: true,
  
  // Respects project conventions
  enforceConventions: true,
  
  // No network calls in generated code without review
  reviewNetworkCalls: true
};
```

---

## 🔄 Workflow

### 1. Request
```
Teacher describes what they want
↓
SpaceBot asks clarifying questions
↓
SpaceBot generates proposal
```

### 2. Preview
```
SpaceBot shows:
- Files to be created/modified
- Code preview (syntax highlighted)
- Potential impacts
- Test plan
```

### 3. Review
```
Teacher reviews, requests changes
↓
SpaceBot iterates
↓
Teacher approves
```

### 4. Apply
```
SpaceBot:
1. Creates git branch
2. Applies changes
3. Runs validation (types, lint, tests)
4. Shows success/failure
5. Provides rollback instructions
```

---

## 💻 Interface

### Builder Mode (Visual)
```tsx
<SpaceBotBuilder>
  <RequestTypeSelector>
    <Option icon={Component}>UI Component</Option>
    <Option icon={Plug}>Integration</Option>
    <Option icon={Zap}>Automation</Option>
    <Option icon={Database}>Database</Option>
    <Option icon={Wrench}>Custom Tool</Option>
  </RequestTypeSelector>
  
  <FormBasedOnSelection />
  
  <GenerateButton />
  
  {generatedCode && <CodePreview />}
  
  {validated && <ApplyButton />}
</SpaceBotBuilder>
```

### Chat Mode (Natural Language)
```tsx
<SpaceBotChat
  projectContext={commandCenterContext}
  onGenerationComplete={showPreview}
  onApplyRequest={validateAndApply}
/>
```

---

## 🎨 Generated Code Standards

All SpaceBot code follows:

```typescript
// Conventions enforced
const STANDARDS = {
  // TypeScript strict mode
  typescript: 'strict',
  
  // shadcn/ui components
  uiLibrary: '@shadcn/ui',
  
  // Tailwind for styling
  styling: 'tailwindcss',
  
  // App router format
  nextjs: 'app-router',
  
  // Supabase for backend
  backend: 'supabase',
  
  // Vitest for testing
  testing: 'vitest',
  
  // Project-specific patterns
  patterns: {
    components: 'kebab-case',
    functions: 'camelCase',
    types: 'PascalCase',
    files: 'kebab-case.tsx'
  }
};
```

---

## 📦 Example Generations

### Example 1: Attendance Tracker
```tsx
// components/attendance/attendance-tracker.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late' | null;
  note?: string;
}

export function AttendanceTracker({ 
  students, 
  date,
  onUpdate 
}: {
  students: Student[];
  date: string;
  onUpdate: (attendance: Student[]) => void;
}) {
  const [attendance, setAttendance] = useState<Student[]>(students);
  
  const updateStatus = (id: string, status: Student['status']) => {
    const updated = attendance.map(s =>
      s.id === id ? { ...s, status } : s
    );
    setAttendance(updated);
    onUpdate(updated);
  };
  
  const stats = {
    present: attendance.filter(s => s.status === 'present').length,
    absent: attendance.filter(s => s.status === 'absent').length,
    late: attendance.filter(s => s.status === 'late').length,
    unmarked: attendance.filter(s => !s.status).length
  };
  
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Attendance — {date}
          </h2>
          <div className="flex gap-2">
            <Badge variant="default">{stats.present} Present</Badge>
            <Badge variant="destructive">{stats.absent} Absent</Badge>
            <Badge variant="warning">{stats.late} Late</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendance.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Example 2: API Route
```typescript
// app/api/attendance/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const attendanceSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['present', 'absent', 'late']),
  note: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    
    const validated = attendanceSchema.parse(body);
    
    const { data, error } = await supabase
      .from('attendance')
      .upsert(validated)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Attendance update failed:', error);
    return NextResponse.json(
      { success: false, error: 'Update failed' },
      { status: 500 }
    );
  }
}
```

---

## 🔧 Integration with Teacher's Command Center

SpaceBot extends the existing architecture:

```
teacher-command-center/
├── apps/web/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── spacebot/          # SpaceBot UI
│   │           ├── builder/
│   │           ├── chat/
│   │           └── history/
│   ├── components/
│   │   └── spacebot/
│   │       ├── code-preview.tsx
│   │       ├── diff-viewer.tsx
│   │       └── builder-form.tsx
│   └── lib/spacebot/
│       ├── client.ts              # API client
│       └── types.ts
├── packages/spacebot-sdk/         # Reusable SDK
│   ├── src/
│   │   ├── generators/
│   │   ├── validators/
│   │   └── templates/
│   └── package.json
└── supabase/functions/spacebot/   # Edge functions
    └── generate.ts
```

---

**SpaceBot: Turning teacher ideas into working code.** 🚀
