# CSP Ready — Claude Code Build Prompt

## Project Overview

CSP Ready is a mastery-based practice platform for AP Computer Science Principles, modeled after DeltaMath. Teachers assign topic-based question sets. Students work through randomized questions drawn from a pre-generated bank until they hit a mastery threshold. Developers (initially just the admin) write JavaScript question templates that generate the bank.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Cloud Functions)
- **Template Sandbox**: Monaco Editor (in-browser) + Web Worker for safe JS execution
- **Bank Generation**: Firebase Cloud Function triggered on topic publish
- **Auth**: Firebase Auth with custom claims for role assignment
- **Hosting**: Firebase Hosting or Vercel

---

## Three User Roles

| Role | Custom Claim | Access |
|------|-------------|--------|
| `admin` | `role: "admin"` | Everything — creates official topics/templates, promotes community content |
| `teacher` | `role: "teacher"` | Creates assignments, monitors student progress, optionally creates community templates |
| `student` | `role: "student"` | Works through assigned questions |

---

## Firestore Data Model

### `/users/{userId}`
```
{
  uid: string,
  email: string,
  displayName: string,
  role: "admin" | "teacher" | "student",
  createdAt: timestamp
}
```

### `/topics/{topicId}`
```
{
  id: string,
  name: string,
  description: string,
  tier: "official" | "community",
  createdBy: userId,
  createdAt: timestamp,
  published: boolean,
  templateIds: string[],         // ordered list of template IDs in this topic
  weights: { [templateId]: number }, // ratio 1–9
  bankSize: 125,
  bankGeneratedAt: timestamp | null
}
```

### `/templates/{templateId}`
```
{
  id: string,
  topicId: string,
  name: string,
  description: string,
  createdBy: userId,
  tier: "official" | "community",
  code: string,                  // the full JS template source code
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### `/questionBanks/{topicId}/questions/{index}` (0–124)
```
{
  index: number,
  templateId: string,
  prompt: string,                // may contain HTML including <code> tags
  promptType: "text" | "svg",    // if svg, prompt contains SVG markup
  answer: string,
  distractors: string[],         // 3 wrong answers for multiple-choice
  type: "multiple-choice" | "free-response",
  explanation: {
    steps: string[],
    summary: string
  },
  meta: object                   // raw generation data, for debugging
}
```

### `/classes/{classId}`
```
{
  id: string,
  name: string,
  teacherId: userId,
  studentIds: string[],
  joinCode: string,              // 6-char code students use to join
  createdAt: timestamp
}
```

### `/assignments/{assignmentId}`
```
{
  id: string,
  name: string,
  classId: string,
  teacherId: string,
  topicId: string,
  requiredCorrect: number,       // mastery threshold (e.g. 5 or 25)
  penalty: number,               // points deducted per wrong answer (e.g. 1)
  dueDate: timestamp,
  createdAt: timestamp,
  posted: boolean
}
```

### `/studentProgress/{userId}/{assignmentId}`
```
{
  userId: string,
  assignmentId: string,
  topicId: string,
  questionsAnswered: number,
  correctCount: number,
  incorrectCount: number,
  completed: boolean,
  completedAt: timestamp | null,
  lastActivityAt: timestamp,
  questionLog: [                 // array of answered questions
    {
      questionIndex: number,
      selectedAnswer: string,
      correct: boolean,
      answeredAt: timestamp
    }
  ]
}
```

---

## Template API Contract

Every template file must export a default object conforming to this interface:

```javascript
export default {
  id: string,           // unique slug, e.g. "binary-to-decimal"
  name: string,         // display name

  generate() {
    // Returns a Question object with randomized values.
    // Must be pure/deterministic given its own random calls.
    // Must never throw — handle all edge cases internally.
    return {
      prompt: string,          // question text, may include <code> tags or SVG
      promptType: "text",      // "text" | "svg"
      answer: string,          // the correct answer
      distractors: string[],   // exactly 3 wrong answers
      type: "multiple-choice", // "multiple-choice" | "free-response"
      meta: object             // raw data passed to explain()
    }
  },

  explain(question) {
    // Receives the full question object returned by generate().
    // Uses question.meta to produce a specific worked explanation.
    return {
      steps: string[],   // 2–5 step-by-step instructions
      summary: string    // one-sentence conclusion
    }
  }
}
```

---

## App Routes (Next.js App Router)

```
/                          → Landing / login page
/auth/login                → Firebase Auth UI
/auth/register             → Student self-register + class join code

/student/                  → Student dashboard (upcoming/past due/complete)
/student/assignment/[id]   → Active question session

/teacher/                  → Teacher dashboard (classes overview)
/teacher/classes/[id]      → Class view (students + assignments)
/teacher/assignments/new   → Create assignment (topic picker + settings)
/teacher/assignments/[id]  → Assignment grade table (mirrors DeltaMath)
/teacher/topics/           → Browse official + community topics
/teacher/templates/new     → Community template builder (Monaco sandbox)

/admin/                    → Admin dashboard
/admin/topics/new          → Create official topic
/admin/topics/[id]         → Edit topic, manage templates, publish
/admin/templates/[id]      → Edit template, test sandbox, set weights
```

---

## Key Components to Build

### `<QuestionCard />`
The student-facing question renderer. Receives a question object and renders:
- Score + penalty header bar
- Segmented progress bar (one segment per required correct answer)
- Question prompt (text or SVG)
- Radio button answer choices
- Submit button
- Post-submit: correct/wrong feedback + "Show Explanation" toggle
- Explanation drawer with numbered steps

Props:
```typescript
{
  question: Question,
  score: number,
  required: number,
  onSubmit: (answer: string) => void
}
```

### `<TopicBrowser />`
Three-column grid of topic tiles. Two sections: Official (top) and Community (below a divider). Each tile shows topic name and template count. Clicking a tile in assignment-creation context adds it to the assignment.

### `<TemplateSandbox />`
The developer/admin template editor. Left: Monaco editor. Right: live preview of 5 generated questions with their explanations. A "Generate Preview" button runs the template code in a Web Worker and renders results. A "Publish" button sends the code to the Cloud Function for full bank generation.

### `<GradeTable />`
Teacher monitoring view. Columns: First, Last, Class, Grade%, Complete%, Problems (x/required), Time Estimate, Last Improvement. Sortable. Matches the DeltaMath layout exactly.

### `<AssignmentList />`
Teacher's list of all assignments. Columns: name, skills/topics, type, posted status, due date. Filter by class.

### `<StudentDashboard />`
Three tabs: Upcoming (with count badge), Past Due (with count badge), Complete. Each assignment card shows grade%, due date, and expands to show skill progress (x/required correct).

---

## Cloud Functions

### `generateQuestionBank(topicId)`
Triggered manually by admin on publish. Does the following:
1. Fetches the topic document and its templates
2. Loads each template's `code` string
3. Uses the `weights` map to determine how many of the 125 questions come from each template
4. Calls `generate()` on each template the appropriate number of times
5. Calls `explain()` on each generated question
6. Writes all 125 questions to `/questionBanks/{topicId}/questions/`
7. Updates `topic.bankGeneratedAt`

**Security**: Template code runs inside a `vm` sandbox (Node.js `vm` module) with a strict timeout and no access to `require` or file system.

### `setUserRole(userId, role)`
Admin-only callable function. Sets Firebase Auth custom claims and updates the `/users` doc.

---

## Security Rules (Firestore)

```
- /users/{userId}: read/write own doc only; admin can read all
- /topics: read by all authenticated; write by admin only (official), teacher (community)
- /templates: read by all authenticated; write by creator or admin
- /questionBanks: read by all authenticated; write by Cloud Functions only
- /classes: read/write by teacher owner; read by enrolled students
- /assignments: read by teacher + enrolled students; write by teacher
- /studentProgress: read/write by student owner; read by teacher of that class
```

---

## Build Order (Phase 1 — MVP)

Build in this exact order. Do not skip ahead.

1. **Firebase project setup**
   - Init Firebase project, enable Firestore + Auth + Functions
   - Set up Next.js 14 project with Tailwind
   - Install: `firebase`, `firebase-admin`, `monaco-editor`, `@monaco-editor/react`
   - Configure Firebase client in `lib/firebase.ts`

2. **Auth + role system**
   - Firebase Auth (email/password)
   - On first login, create `/users/{uid}` doc with role
   - Middleware in Next.js that reads custom claims and redirects to correct dashboard
   - `useAuth()` hook that exposes `user`, `role`, `loading`

3. **Firestore data layer**
   - Write typed service functions for each collection (no raw Firestore calls in components)
   - `topicsService.ts`, `templatesService.ts`, `assignmentsService.ts`, `progressService.ts`

4. **Student question session**
   - `/student/assignment/[id]` page
   - Fetches question bank, picks questions randomly (no repeats until bank exhausted)
   - `<QuestionCard />` with progress bar, submit, feedback, explanation
   - Writes to `studentProgress` on each answer

5. **Student dashboard**
   - Upcoming / Past Due / Complete tabs
   - Real-time listener on `studentProgress`

6. **Teacher grade table**
   - `/teacher/assignments/[id]` with `<GradeTable />`
   - Real-time listeners on all `studentProgress` docs for that assignment

7. **Teacher assignment creation**
   - Topic browser (official topics only at this stage)
   - Set required correct, penalty, due date
   - Post to class

8. **Admin template sandbox**
   - Monaco editor
   - Web Worker runner for `generate()` + `explain()` preview
   - Save template to Firestore

9. **Admin topic publish + bank generation**
   - Cloud Function `generateQuestionBank`
   - Admin UI trigger button

10. **Community templates**
    - Teacher template builder (same sandbox, saved as `tier: "community"`)
    - Community section in topic browser

---

## Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PRIVATE_KEY          (server-side only)
FIREBASE_ADMIN_CLIENT_EMAIL         (server-side only)
```

---

## Coding Conventions

- TypeScript throughout. No `any` types.
- All Firestore calls go through service layer functions — never call `doc()`, `getDoc()` etc. directly in components or pages.
- Use React Server Components for data fetching where possible; use client components only when interactivity requires it.
- All question bank reads should fetch the full bank as a single collection query, not 125 individual reads.
- Web Worker for template execution — never `eval()` in the main thread.
- Every template `generate()` call must be wrapped in try/catch during bank generation. If it throws, log and skip that question.
- Use Tailwind utility classes only — no custom CSS files.
- Component files: PascalCase. Service files: camelCase. Route files: Next.js convention.

---

## Sample Template (Reference Implementation)

Use this as the gold standard for template structure. All future templates should follow this exact shape.

```javascript
// binary-to-decimal.template.js

export default {
  id: "binary-to-decimal",
  name: "Binary to Decimal Conversion",

  generate() {
    const bitLength = Math.random() < 0.5 ? 4 : 8;
    const max = Math.pow(2, bitLength) - 1;
    const value = Math.floor(Math.random() * (max + 1));
    const bits = value.toString(2).padStart(bitLength, '0');
    const distractors = this._generateDistractors(value, max);

    return {
      prompt: `What is the decimal value of the binary number <code>${bits}</code>?`,
      promptType: "text",
      answer: String(value),
      distractors,
      type: "multiple-choice",
      meta: { bits, value, bitLength }
    };
  },

  explain(question) {
    const { bits, value, bitLength } = question.meta;
    const placeValues = Array.from({ length: bitLength }, (_, i) =>
      Math.pow(2, bitLength - 1 - i)
    );
    const multiplications = bits.split('').map((bit, i) =>
      `${bit} × ${placeValues[i]}`
    );
    const contributions = bits.split('').map((bit, i) =>
      bit === '1' ? placeValues[i] : 0
    ).filter(v => v > 0);

    return {
      steps: [
        `Write the place values left to right: ${placeValues.join(', ')}`,
        `Multiply each bit by its place value: ${multiplications.join(' + ')}`,
        contributions.length === 0
          ? `All bits are 0, so the answer is 0`
          : `Sum the 1-bit contributions: ${contributions.join(' + ')} = ${value}`
      ],
      summary: `${bits} in binary equals ${value} in decimal.`
    };
  },

  _generateDistractors(correct, max) {
    const wrong = new Set();
    if (correct + 1 <= max) wrong.add(correct + 1);
    if (correct - 1 >= 0) wrong.add(correct - 1);
    const reversed = parseInt(
      correct.toString(2).split('').reverse().join(''), 2
    );
    if (reversed !== correct) wrong.add(reversed);
    while (wrong.size < 3) {
      const offset = Math.floor(Math.random() * 10) + 2;
      const candidate = Math.random() < 0.5 ? correct + offset : correct - offset;
      if (candidate >= 0 && candidate <= max && candidate !== correct) {
        wrong.add(candidate);
      }
    }
    return [...wrong].slice(0, 3).map(String);
  }
};
```

---

## What NOT to Build in Phase 1

- No video assignment support
- No print functionality
- No bulk edit
- No folder system for assignments
- No class join via Google Classroom
- No leaderboards
- No student-facing explanation before answering (add in Phase 2)

---

## First Task for Claude Code

> Bootstrap the project. Create the Next.js 14 + Tailwind + Firebase project structure. Set up Firebase Auth with email/password. Implement the `useAuth()` hook with role-based redirect middleware. Create the three dashboard shell pages (`/student`, `/teacher`, `/admin`) that render the user's name and role. Create the Firestore service layer files as empty typed stubs. Do not build any UI beyond basic shells — just get auth, routing, and the data layer scaffolded correctly.
