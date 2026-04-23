# 05 Agent Execution Plan

## Why This Document Exists

The main risk is not lack of coding speed.

The main risk is agent drift:

- expanding scope
- rewriting stable parts
- mixing architecture and implementation
- generating inconsistent files
- introducing hidden bugs in auth and drag-and-drop

This execution plan exists to prevent that.

## Operating Principle

Do not ask the agent to "build the app."

Use the agent as a senior implementation copilot under a strict spec.

Correct control model:

1. define the contract
2. constrain the task
3. request a narrow deliverable
4. review the output
5. run locally
6. fix only what is broken
7. move to the next phase

## Source of Truth Hierarchy

The agent should treat these as authoritative, in this order:

1. project prompt and case requirements
2. `docs/specs/01-system-design.md`
3. `docs/specs/02-database-schema.md`
4. `docs/specs/04-dnd-algorithm.md`
5. `docs/specs/03-frontend-components.md`
6. `docs/specs/06-readme-submission.md`
7. your explicit current instruction
8. agent suggestions

If the agent proposes something that conflicts with the specs, the specs win.

## Execution Model

Work in phases, not one-shot generation.

Recommended phase sequence:

1. project bootstrap
2. Supabase setup
3. authentication
4. board CRUD
5. column and card CRUD
6. DnD utility layer
7. same-column reorder
8. cross-column move
9. persistence hardening
10. responsive polish
11. README and submission
12. final bug bash

This is the correct order because later phases depend on earlier stability.

## Agent Usage Rules

## Rule 1: Never ask for the whole app at once

Wrong:

> Build the full Trello clone.

Correct:

> Implement only the authentication layer, file-by-file, following the spec.

## Rule 2: Always ask for assumptions first

Before code generation, require the agent to state:

- what it is implementing
- assumptions
- files touched
- edge cases

## Rule 3: Demand file-by-file output

Always ask for:

- file path
- purpose
- full code

This prevents copy-paste chaos.

## Rule 4: Do not let the agent refactor unrelated code

If fixing DnD, it should not rewrite auth.

If fixing auth, it should not restructure the whole app.

## Rule 5: Validate locally after every phase

Do not continue if:

- TypeScript errors exist
- the current phase acceptance criteria are unmet
- a previously working flow is now broken

## Rule 6: Treat DnD as a separate engineering stream

DnD is not "just UI."

It is core domain logic and should be handled with narrow prompts only.

## Rule 7: Specs first, implementation second

Before writing substantial code for any new area:

- finish the spec for that area
- align it with the existing docs
- only then move into implementation

This is especially important for database and DnD work.

## Recommended Specs Folder

The repo should keep the specs in:

```text
docs/
  specs/
    01-system-design.md
    02-database-schema.md
    03-frontend-components.md
    04-dnd-algorithm.md
    05-agent-execution-plan.md
    06-readme-submission.md
```

You do not need to feed all specs on every prompt.

Feed only the relevant ones for the current phase.

## Default Prompting Framework

For any non-trivial task, use this pattern:

```text
Use the attached spec as the source of truth.

Before writing code, answer briefly:
1. What exactly are you implementing?
2. What assumptions are you making?
3. Which files will be created or modified?
4. What are the main edge cases?
5. What could go wrong in this implementation?

Then generate the code file-by-file.
Do not modify unrelated parts.
```

This should be the default pattern.

## Phase-by-Phase Plan

## Phase 1: Project Bootstrap

Goal:

- create the base application shell

Deliverables:

- Next.js app initialized
- TypeScript
- Tailwind CSS
- base folder structure
- required packages installed
- environment variable template created

Acceptance criteria:

- app runs locally
- no TypeScript errors
- folder structure is clean
- environment variable pattern is clear

Suggested agent prompt:

```text
You are implementing Phase 1 of TaskFlow.

Stack:
- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- dnd-kit
- Vercel

Use the project specs as the source of truth.

Do not implement features yet.

I need:
1. the exact npm commands to initialize the project,
2. the package list to install,
3. the recommended folder structure,
4. the environment variables template,
5. a minimal app shell structure.

Before writing code, briefly state assumptions, files, and risks.
Then return the result file-by-file where relevant.
```

## Phase 2: Supabase Setup

Goal:

- set up schema, RLS, and client integration

Deliverables:

- SQL migration
- RLS policies
- Supabase server and client helpers
- typed row interfaces
- DB connection structure

Acceptance criteria:

- migration executes successfully
- tables exist
- RLS is enabled
- client helpers compile
- no unrelated app UI is added

Suggested agent prompt:

```text
Implement Phase 2 of TaskFlow using the Database Schema Spec as the source of truth.

I need:
1. the full Supabase SQL migration,
2. indexes,
3. triggers,
4. RLS policies,
5. TypeScript row types,
6. Supabase client helpers for server and client usage in Next.js.

Do not implement auth pages or Kanban UI yet.
Return everything file-by-file and separate SQL from TypeScript code.
```

## Phase 3: Authentication

Goal:

- implement registration, login, logout, and protected routes

Deliverables:

- login page
- register page
- session handling
- logout
- route protection

Acceptance criteria:

- user can register
- user can log in
- protected routes block unauthenticated users
- logout works
- board UI is not implemented yet

Suggested agent prompt:

```text
Implement Phase 3: authentication only.

Requirements:
- register page
- login page
- logout action
- protect authenticated routes
- redirect unauthenticated users away from protected pages
- keep the implementation minimal and reviewer-friendly

Use Supabase Auth.
Do not implement boards, columns, cards, or drag-and-drop yet.

Before coding, state assumptions, files, and edge cases.
Then return file-by-file code.
```

## Phase 4: Board CRUD

Goal:

- let authenticated users create and view boards

Deliverables:

- boards page
- create board flow
- board listing
- navigate to board detail page

Acceptance criteria:

- board can be created
- board appears immediately
- refresh persists the board
- unauthorized users cannot see others' boards

Suggested agent prompt:

```text
Implement Phase 4: board CRUD only.

Requirements:
- authenticated user can view their boards
- authenticated user can create a board
- clicking a board opens the board detail page
- use the database schema spec as the source of truth
- keep the UI simple

Do not implement columns, cards, or drag-and-drop yet.

Before coding, state assumptions, files, and acceptance risks.
Then return file-by-file code.
```

## Phase 5: Column and Card CRUD

Goal:

- render board detail with columns and cards

Deliverables:

- create column
- create card
- card edit modal or drawer
- board detail page with loaded columns and cards

Acceptance criteria:

- board page renders columns and cards correctly
- create and edit flows work
- refresh persists everything
- no drag code yet

Suggested agent prompt:

```text
Implement Phase 5: columns and cards CRUD.

Requirements:
- board detail page loads columns ordered by position
- cards load ordered by position
- user can create columns
- user can create cards inside columns
- user can edit card title and description
- use a simple modal or drawer for editing

Do not implement drag-and-drop yet.

Before coding, state assumptions, files, and edge cases.
Then return file-by-file code.
```

## Phase 6: DnD Utility Layer

Goal:

- implement the non-React DnD core logic first

Deliverables:

- helper functions
- position calculation
- reindex utility
- pure TypeScript logic
- test cases if time allows

Acceptance criteria:

- utility layer compiles
- position calculation handles empty, top, middle, and bottom cases
- reindex path exists
- logic is not embedded inside React handlers

Suggested agent prompt:

```text
Implement Phase 6: the pure TypeScript drag-and-drop utility layer.

Use the DnD Algorithm Spec as the source of truth.

I need:
- findCard
- findColumn
- removeCardFromColumn
- insertCardIntoColumn
- calculateNewPosition
- reindexPositions
- helper types
- example test cases

Do not generate React UI code yet.
Keep this layer framework-agnostic.
Return file-by-file code.
```

## Phase 7: Same-Column Reorder

Goal:

- implement the first safe slice of drag-and-drop

Deliverables:

- `dnd-kit` integration for same-column reorder only
- visual drag state
- persistence on drag end

Acceptance criteria:

- reorder works within one column
- refresh preserves the new order
- no cross-column behavior yet
- no giant monolithic handler

Suggested agent prompt:

```text
Implement Phase 7: same-column card reorder only.

Requirements:
- use dnd-kit
- cards can be reordered within the same column
- no cross-column moves yet
- persist ordering on drag end only
- use the DnD Algorithm Spec and existing utility layer
- keep handlers modular

Before coding, state assumptions, files, and failure modes.
Then return file-by-file code.
Do not rewrite unrelated app structure.
```

## Phase 8: Cross-Column Move

Goal:

- extend DnD to full required behavior

Deliverables:

- move across columns
- empty-column drop
- drop on card vs column container
- persist `column_id + position`

Acceptance criteria:

- cross-column move works
- empty-column drop works
- refresh preserves state
- persistence logic is correct

Suggested agent prompt:

```text
Implement Phase 8: cross-column card movement.

Requirements:
- cards can move across columns
- cards can be dropped into empty columns
- dropping over a column container appends to the end if non-empty
- persist column_id and position on drag end
- use optimistic UI updates
- explain failure recovery strategy

Use the DnD Algorithm Spec as the source of truth.
Return only modified or new files.
Do not refactor unrelated parts.
```

## Phase 9: Persistence Hardening

Goal:

- handle failure scenarios and edge cases

Deliverables:

- refetch or rollback strategy
- toast or error feedback
- dense-position handling
- batch persistence for reindex

Acceptance criteria:

- failed save does not leave the board permanently inconsistent
- reindex path persists correctly
- user gets error feedback

Suggested agent prompt:

```text
Implement Phase 9: persistence hardening for drag-and-drop.

Requirements:
- handle persistence failures safely
- if a save fails, restore consistency via refetch or rollback
- support reindex-based persistence when positions become too dense
- keep the implementation minimal and robust

Before coding, explain the chosen failure-recovery strategy and why.
Then return only the changed files.
```

## Phase 10: Responsive Polish

Goal:

- make the app reviewer-friendly on different screen sizes

Deliverables:

- responsive board layout
- sensible mobile behavior
- visual feedback improvements
- empty states
- loading states

Acceptance criteria:

- mobile layout does not break
- drag still works
- UX looks intentional

Suggested agent prompt:

```text
Implement Phase 10: responsive and UX polish.

Requirements:
- board layout should be usable on mobile widths
- horizontal scroll for columns is acceptable
- improve visual feedback during drag
- add basic empty states and loading states
- do not redesign the app or add new features

Return only modified files.
```

## Phase 11: README and Submission

Goal:

- produce reviewer-facing documentation

Deliverables:

- README
- setup instructions
- architecture decisions
- trade-offs
- deployment instructions
- submission summary

Acceptance criteria:

- README matches reality
- trade-offs are explicit
- no fake claims

Suggested agent prompt:

```text
Write the README for TaskFlow.

It must include:
- project overview
- features
- stack
- setup instructions
- environment variables
- database model summary
- why dnd-kit was chosen
- why position-based ordering was chosen
- what was intentionally deferred due to the 48-hour constraint
- deployment instructions
- future improvements

Tone: professional, concise, reviewer-friendly.
Do not invent features that are not implemented.
```

## Phase 12: Final Bug Bash

Goal:

- use the agent as a debugger, not a re-architect

Suggested bug prompt template:

```text
We have a bug.

Current behavior:
[describe exact issue]

Expected behavior:
[describe exact expected behavior]

Relevant implementation details:
[include the files/functions involved]

Analyze the likely root causes first.
Then propose the minimal fix.
Do not rewrite unrelated parts.
Return only the changed files.
```

Acceptance criteria:

- fixes stay small and targeted
- working code is not destabilized

## Review Checkpoints After Each Phase

After every phase, do not continue until you have checked:

## Build checkpoint

- `npm run dev` works
- no compile errors
- no runtime crash on load

## Logic checkpoint

- the current phase flow actually works
- the previous phase still works

## Scope checkpoint

- the agent did not sneak in unrelated features
- file structure still matches the specs

## Cleanliness checkpoint

- no giant utility dumping ground
- no duplicated logic everywhere
- no unused packages accumulating

## Local Validation Checklist

Validate manually in this order:

## Auth

- register
- login
- protected redirect
- logout

## Data

- create board
- create column
- create card
- edit card

## DnD

- reorder within the same column
- move across columns
- empty-column drop
- invalid drop no-op
- refresh persistence

## UI

- desktop layout
- narrower viewport layout
- loading states
- error states

## When to Stop the Agent and Inspect Manually

Stop and inspect manually if:

- the agent proposes large refactors
- multiple unrelated files are changed for a small bug
- auth starts breaking after DnD work
- utility functions and UI handlers become intertwined
- the agent contradicts the spec
- persistence logic becomes hard to explain in the README

This is where projects usually get unstable.

## Red Flags in Agent Output

Reject and correct output if you see:

- "I rewrote the architecture for simplicity"
- giant component files with business logic mixed in
- DnD logic embedded entirely in JSX component handlers
- persistence during `onDragOver`
- array index persisted instead of `position`
- auth bypass assumptions
- fake placeholder implementations presented as done

## Minimal Prompt Correction Patterns

Use these when the agent drifts.

## If scope expands

```text
This exceeds v1 scope. Remove everything unrelated to the current phase and regenerate only the required files.
```

## If the output is too broad

```text
Narrow this down. I only want the implementation for [specific feature]. Do not modify unrelated files.
```

## If logic is too implicit

```text
Explain the assumptions, data flow, and edge cases before generating code.
```

## If the code is too monolithic

```text
Refactor this into smaller utilities and keep the React event handlers thin. Do not change behavior.
```

## If the agent ignores the spec

```text
Your proposal conflicts with the spec. Use the spec as the source of truth and regenerate the solution accordingly.
```

## Suggested Working Rhythm

Use this cadence:

1. prompt the agent for one narrow phase
2. review the response
3. apply or integrate the code
4. run locally
5. fix compile or runtime issues
6. confirm acceptance criteria
7. move to the next phase

Do not queue multiple large agent prompts back-to-back without local validation.

## What You Should Do Yourself vs What the Agent Should Do

## You should do

- architecture decisions
- scope enforcement
- local validation
- final feature cuts
- final README truth check
- final demo and submission

## Agent should do

- boilerplate generation
- SQL drafting
- component scaffolding
- utility implementation
- targeted fixes
- documentation drafts

This division keeps you in control.

## First Three Prompts You Should Actually Send

## Prompt 1: Planning

```text
You are acting as a principal-level full-stack engineer. We are building a 48-hour take-home project called TaskFlow, a Trello-like Kanban board.

Stack:
- Next.js
- TypeScript
- Tailwind CSS
- Supabase (Auth + Postgres)
- dnd-kit
- Vercel

Core requirements:
- user registration/login
- create boards
- create columns
- create cards
- edit card title/description
- drag-and-drop cards within and across columns
- persist ordering across refreshes

Out of scope for v1:
- realtime collaboration
- board sharing
- comments
- tags
- due dates
- assignees
- activity history
- column drag-and-drop

Important constraints:
- prioritize a robust core flow over extra features
- architecture must be clean and reviewer-friendly
- use position-based ordering with persistent storage
- assume deployment to Vercel
- assume Supabase Row Level Security is required

Do not write code yet.

First, produce:
1. an implementation plan broken into phases,
2. the proposed folder structure,
3. the database table responsibilities,
4. the critical risks,
5. the exact build order for the first 48 hours.

Be concrete and practical.
```

## Prompt 2: Bootstrap

```text
Implement Phase 1 only.

I need:
- project initialization commands
- package installation commands
- folder structure
- environment variable template
- minimal app shell

Before writing code, state assumptions, files, and risks.
Then return the result file-by-file where relevant.
Do not implement features yet.
```

## Prompt 3: Database

```text
Implement Phase 2 using the following as the source of truth:
- single-owner boards
- tables: boards, columns, cards
- position-based ordering
- Supabase RLS required
- updated_at triggers required

I need:
1. the full SQL migration,
2. indexes,
3. triggers,
4. RLS policies,
5. TypeScript row types,
6. mapping-layer recommendations,
7. Supabase client helper structure for Next.js.

Do not implement auth pages or app UI yet.
Return everything file-by-file and keep SQL separate from TypeScript.
```

## Final Principle

The correct way to use the agent is:

> spec first, phase second, code third

If you reverse that order, the project becomes unstable.
