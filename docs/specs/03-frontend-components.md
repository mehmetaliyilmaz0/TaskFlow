# 03 Frontend Components

## Why This Document Exists

Most take-home projects do not fail because the candidate cannot write UI.

They fail because the UI layer becomes:

- a dumping ground for business logic
- tightly coupled to DB response shapes
- hard to debug
- hard to extend
- difficult to explain in the README or in review

This spec exists to prevent that.

The frontend must be:

- simple
- layered
- easy to review
- easy to debug
- aligned with the database and DnD specs

## Frontend Design Goals

The frontend architecture should optimize for:

1. clarity over cleverness
2. small components with explicit responsibility
3. thin page components
4. explicit separation of UI, data access, and DnD logic
5. safe state boundaries
6. fast implementation under 48 hours

## Architectural Principles

## Pages coordinate, components render, utilities compute

- pages orchestrate
- components render and emit events
- utilities hold algorithmic logic
- the data layer talks to Supabase

This separation is the core of reviewer-friendly structure.

## Do not leak raw Supabase row shapes through the UI

The UI should consume normalized domain types, not raw snake_case rows.

Wrong:

```ts
card.column_id
card.created_at
```

Preferred:

```ts
card.columnId
card.createdAt
```

This is one of the easiest ways to make the app feel engineered rather than improvised.

## DnD logic must not live entirely inside JSX event handlers

Event handlers should stay thin and call utility functions.

## Modal state and edit state should be local unless proven otherwise

Do not introduce Zustand or Redux unless there is a clear need.

## Server and client boundaries should be intentional

Use session-aware server helpers where appropriate, but avoid overcomplicating the app with premature server actions everywhere.

## App-Level UI Structure

Recommended top-level route structure:

```text
src/app/
  (auth)/
    login/
      page.tsx
    register/
      page.tsx
  (app)/
    boards/
      page.tsx
    boards/[boardId]/
      page.tsx
```

This route grouping makes intent clearer.

## Recommended Folder Structure

This frontend spec should align with the broader system design while staying specific about the UI slice.

```text
src/
  app/
    (auth)/
      login/
        page.tsx
      register/
        page.tsx
    (app)/
      boards/
        page.tsx
      boards/[boardId]/
        page.tsx
    layout.tsx
    globals.css

  components/
    auth/
      auth-form.tsx
      logout-button.tsx
    boards/
      board-list.tsx
      board-list-item.tsx
      create-board-dialog.tsx
    kanban/
      board-view.tsx
      column-list.tsx
      column-item.tsx
      create-column-form.tsx
      card-list.tsx
      card-item.tsx
      create-card-form.tsx
      card-detail-dialog.tsx
      drag-overlay-card.tsx
    ui/
      button.tsx
      input.tsx
      textarea.tsx
      dialog.tsx
      spinner.tsx
      empty-state.tsx
      toast.tsx

  features/
    auth/
      actions.ts
      queries.ts
      types.ts
    boards/
      actions.ts
      queries.ts
      types.ts
    columns/
      actions.ts
      queries.ts
      types.ts
    cards/
      actions.ts
      queries.ts
      types.ts
    dnd/
      types.ts
      utils.ts
      board-state.ts

  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    taskflow/
      mappers.ts
    utils/
      cn.ts
      dates.ts
      positions.ts

  types/
    taskflow.ts
```

Notes:

- `src/types/taskflow.ts` remains the canonical domain and DB type entry point
- `src/lib/taskflow/mappers.ts` remains the DB-row to domain mapping layer
- feature modules may add feature-specific types like `BoardSummary`, but should not replace the shared TaskFlow domain model

## Layer Responsibilities

## `app/`

Contains pages and route-level orchestration only.

Responsibilities:

- fetch route data
- wire up top-level page structure
- redirect unauthenticated users if needed
- pass data into the feature and component layers

Should not contain:

- large UI blocks
- position algorithms
- reusable modal implementations
- raw DnD utility logic

## `components/`

Contains reusable presentational and interaction components.

Responsibilities:

- rendering
- handling local input state
- emitting user intent events
- simple UI composition

Should not contain:

- Supabase query logic
- persistence rules
- cross-feature domain knowledge
- complex ordering algorithms

## `features/`

Contains domain-aware logic grouped by problem area.

Responsibilities:

- queries
- mutations
- feature-specific types
- state transformations
- DnD utilities and board interaction helpers

This is where the app starts feeling professional instead of improvised.

## `lib/`

Contains cross-cutting utilities and framework setup.

Responsibilities:

- Supabase clients
- generic helpers
- shared TaskFlow mappers
- common utility functions

Should not contain:

- board-specific presentation logic
- card-specific UI state

## Page-Level Specification

## `/login`

Purpose:

- allow existing users to authenticate

Responsibilities:

- render login form
- submit email/password
- surface auth errors
- redirect on success

Components used:

- `AuthForm`

## `/register`

Purpose:

- allow new users to create an account

Responsibilities:

- render register form
- submit credentials
- surface auth errors
- redirect on success

Components used:

- `AuthForm`

## `/boards`

Purpose:

- show the current user's boards and allow board creation

Responsibilities:

- fetch current-user boards
- display list
- allow creation
- navigate to board details

Components used:

- `BoardList`
- `CreateBoardDialog`
- `BoardListItem`

This page should stay very small.

## `/boards/[boardId]`

Purpose:

- render the Kanban board

Responsibilities:

- fetch board, columns, and cards
- pass normalized board state to `BoardView`
- handle loading and error states
- optionally provide `onReloadBoard` for failed persistence recovery

Components used:

- `BoardView`

This page should coordinate, not implement DnD details itself.

## Auth Component Specification

## `AuthForm`

Purpose:

- reusable auth form for login and register

Props:

```ts
interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}
```

Responsibilities:

- render email and password inputs
- manage local form state
- submit values upward
- show inline errors

Should not:

- talk directly to Supabase if the page or feature layer owns the submit flow

## `LogoutButton`

Purpose:

- log the current user out

Responsibilities:

- call logout action
- redirect or refresh as needed

Keep it small and self-contained.

## Boards UI Specification

## `BoardList`

Purpose:

- render all user boards

Props:

```ts
interface BoardListProps {
  boards: BoardSummary[];
}
```

Responsibilities:

- render empty state
- render list structure
- delegate item rendering

## `BoardListItem`

Purpose:

- represent one board in the list

Props:

```ts
interface BoardListItemProps {
  board: BoardSummary;
}
```

Responsibilities:

- clickable navigation card
- board title
- optional created or updated date

Keep it simple and polished.

## `CreateBoardDialog`

Purpose:

- create a new board

Props:

```ts
interface CreateBoardDialogProps {
  onCreate: (title: string) => Promise<void>;
}
```

Responsibilities:

- local input state
- basic validation
- loading state
- success close and reset

Should not:

- know board listing details
- contain navigation logic

## Kanban UI Specification

This is the heart of the app.

## `BoardView`

Purpose:

- top-level Kanban presentation and interaction component

Props:

```ts
interface BoardViewProps {
  board: Board;
  onCreateColumn: (input: { boardId: string; title: string }) => Promise<void>;
  onCreateCard: (input: { columnId: string; title: string }) => Promise<void>;
  onUpdateCard: (input: {
    cardId: string;
    title?: string;
    description?: string;
  }) => Promise<void>;
  onMoveCard: (input: {
    cardId: string;
    toColumnId: string;
    position: number;
  }) => Promise<void>;
  onBatchReindex?: (updates: Array<{
    cardId: string;
    columnId: string;
    position: number;
  }>) => Promise<void>;
  onReloadBoard?: () => Promise<void>;
}
```

Responsibilities:

- host DnD context
- manage `activeCardId`
- manage local optimistic board state
- manage selected card state for the detail dialog
- delegate rendering to child components
- coordinate drag end -> utility layer -> persistence flow

Should not:

- talk directly to the raw Supabase client
- contain SQL or raw fetch logic
- render every tiny piece inline

This will likely be the most complex frontend component. Keep it structured.

## `ColumnList`

Purpose:

- render all columns of the board in order

Props:

```ts
interface ColumnListProps {
  columns: Column[];
  activeCardId?: string | null;
  onCreateCard: (input: { columnId: string; title: string }) => Promise<void>;
  onEditCard: (card: Card) => void;
}
```

Responsibilities:

- layout columns horizontally
- loop through columns
- render `ColumnItem`

This helps keep `BoardView` smaller.

## `ColumnItem`

Purpose:

- render one Kanban column

Props:

```ts
interface ColumnItemProps {
  column: Column;
  activeCardId?: string | null;
  onCreateCard: (input: { columnId: string; title: string }) => Promise<void>;
  onEditCard: (card: Card) => void;
}
```

Responsibilities:

- render column header
- render cards via `CardList`
- render `CreateCardForm`
- expose empty drop zone if no cards exist

Should not:

- compute cross-column move rules
- call persistence directly

## `CardList`

Purpose:

- render ordered cards inside a column

Props:

```ts
interface CardListProps {
  columnId: string;
  cards: Card[];
  activeCardId?: string | null;
  onEditCard: (card: Card) => void;
}
```

Responsibilities:

- provide sortable context for cards
- render each `CardItem`
- preserve empty-state drop surface when needed

## `CardItem`

Purpose:

- render one draggable card

Props:

```ts
interface CardItemProps {
  card: Card;
  onEdit: (card: Card) => void;
  isDragging?: boolean;
}
```

Responsibilities:

- draggable wrapper
- card content display
- click to edit
- visual drag state

Should not:

- persist anything
- know global board rules

## `DragOverlayCard`

Purpose:

- render the card shown in `DragOverlay`

Props:

```ts
interface DragOverlayCardProps {
  card: Card;
}
```

Responsibilities:

- visual clone of the card while dragging

Pure presentation only.

## `CreateColumnForm`

Purpose:

- add a new column

Props:

```ts
interface CreateColumnFormProps {
  boardId: string;
  onCreate: (input: { boardId: string; title: string }) => Promise<void>;
}
```

Responsibilities:

- local title state
- submit
- reset
- loading feedback

## `CreateCardForm`

Purpose:

- add a new card into a column

Props:

```ts
interface CreateCardFormProps {
  columnId: string;
  onCreate: (input: { columnId: string; title: string }) => Promise<void>;
}
```

Responsibilities:

- local title state
- submit
- reset
- loading feedback

Keep it simple and fast.

## `CardDetailDialog`

Purpose:

- edit card title and description

Props:

```ts
interface CardDetailDialogProps {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    cardId: string;
    title?: string;
    description?: string;
  }) => Promise<void>;
}
```

Responsibilities:

- hold local editable state derived from the selected card
- allow title and description edits
- submit changes
- close and reset correctly

Should not:

- own board refresh logic
- manage DnD

## UI Primitive Specification

You may use `shadcn/ui` or lightweight custom primitives.

Recommended primitives:

- `Button`
- `Input`
- `Textarea`
- `Dialog`
- `Spinner`
- `EmptyState`
- `Toast`

These should remain generic and reusable.

Do not overbuild a design system for a 48-hour project.

## Data Layer Component Boundaries

The UI should not call Supabase directly from every component.

Recommended pattern:

- pages or feature actions own data access
- pages pass normalized data and handlers downward

Example:

- `boards/[boardId]/page.tsx` fetches board data
- `BoardView` receives normalized `Board` data and action handlers
- `CardDetailDialog` receives `onSave`

This is simple and highly reviewable.

## Suggested Feature-Layer Contracts

## `features/boards/types.ts`

```ts
export interface BoardSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
```

## `features/boards/queries.ts`

Responsibilities:

- fetch board list
- fetch one board aggregate
- map DB rows to domain objects

## `features/boards/actions.ts`

Responsibilities:

- create board
- optionally rename board later

## `features/columns/queries.ts`

Responsibilities:

- fetch columns by board
- return them ordered by position

## `features/columns/actions.ts`

Responsibilities:

- create column

## `features/cards/queries.ts`

Responsibilities:

- fetch cards by column ids
- return them ordered by position

## `features/cards/actions.ts`

Responsibilities:

- create card
- update card
- move card
- batch position update when reindexing

## `features/dnd/utils.ts`

Responsibilities:

- position calculations
- insert and remove helpers
- reindex helpers
- event-related utility helpers

This module must remain framework-agnostic.

## State Management Specification

This is where many implementations overcomplicate.

## Global state library

Not required for v1.

## Recommended state split

### Server-backed route data

Owned by page-level fetch or query flow

### Local interactive state in `BoardView`

Owned by `BoardView`:

- optimistic board state
- active dragged card
- selected card for modal
- loading and error flags related to board interactions

### Local form state

Owned by form and dialog components

This is enough for v1.

## `BoardView` Internal State Model

Recommended internal state:

```ts
interface BoardViewState {
  optimisticBoard: Board;
  activeCardId: string | null;
  selectedCard: Card | null;
  isCardDialogOpen: boolean;
  isPersistingMove: boolean;
}
```

Optional:

```ts
lastStableBoard: Board | null;
```

If you want rollback support.

For v1, `onReloadBoard` is often enough.

## Event Ownership Rules

Create column:

- triggered in `CreateColumnForm`
- handled upward through `BoardView`

Create card:

- triggered in `CreateCardForm`
- handled upward through `BoardView`

Edit card:

- triggered in `CardDetailDialog`
- persisted via passed handler

Drag card:

- triggered in `BoardView` through `dnd-kit`
- delegated to DnD utilities
- persisted via passed handlers

This keeps business logic centralized and reviewable.

## Error Handling UX Specification

Minimum expectations:

- forms show errors or disable while saving
- failed save operations show a toast or inline error
- drag persistence failure restores consistency via refetch
- empty states are intentional, not blank screens

## Loading State Specification

Minimum:

- page-level loading state for the boards page
- board detail loading state
- disabled buttons while submitting
- optional subtle "saving..." indicator during drag persistence

Do not over-engineer skeletons if time is short.

## Responsive Layout Specification

## Desktop

- horizontal Kanban board
- each column has fixed or minimum width
- clear gaps between columns
- comfortable drag area

## Mobile or narrow viewport

- horizontal scroll for columns is acceptable
- column width should remain usable
- dialog should fit the viewport
- buttons and inputs should remain tappable

The reviewer does not expect a mobile app.

They do expect a non-broken interface.

## Styling Priorities

You do not need visual originality.

You need intentional polish.

Priorities:

1. spacing consistency
2. readable typography
3. card elevation and contrast
4. visible drag state
5. empty states
6. sane form controls

Do not spend time on branding.

## Accessibility Baseline

Even in a take-home, basic accessibility helps.

Minimum:

- buttons are real buttons
- inputs have labels or at least clear placeholders
- dialog has a title
- focus behavior is sensible
- color contrast is not terrible

Do not promise full accessibility if it is not implemented.

## Reviewer-Facing Frontend Rationale

If asked why this UI structure was chosen, the answer is:

> The frontend was split into route-level orchestration, presentational components, domain feature modules, and framework-agnostic DnD utilities. This keeps the board page readable, prevents drag-and-drop logic from being buried inside JSX handlers, and makes the system easier to extend and debug. Under a 48-hour constraint, the goal was to keep responsibilities explicit and avoid overintroducing global state or unnecessary abstractions.

That is a strong defense.

## Anti-Patterns to Avoid

Reject agent output if you see:

- one giant `board-page.tsx` with all logic inline
- raw Supabase calls in every component
- DnD utilities mixed into card rendering code
- snake_case DB fields leaking all over the UI
- modal state managed from multiple unrelated components
- unnecessary Zustand or Redux setup
- duplicated form logic everywhere

## Component Acceptance Criteria

This frontend architecture is acceptable only if:

- page files stay relatively small
- `BoardView` owns interaction orchestration but not raw DB querying
- DnD utility logic is externalized
- forms and dialogs own their own local input state
- raw DB shapes are mapped before deep UI use
- components have single, understandable responsibilities

## What the Agent Should Build in This Order

The UI should be built in this order:

1. auth pages
2. boards list page
3. board detail static layout
4. create column form
5. create card form
6. card detail dialog
7. static card rendering
8. DnD integration
9. responsive polish

This sequence minimizes rework.

## AI Agent Prompt for This Spec

When it is time to implement the UI, use something like:

```text
Use the Frontend Component Spec as the source of truth.

I want you to implement the frontend structure for TaskFlow with these rules:
- keep page components thin
- keep DnD logic out of JSX as much as possible
- use feature-layer query/action modules
- do not leak raw DB row types through the UI
- local form state should stay inside forms/dialogs
- do not introduce a global state library unless absolutely necessary

Before coding, provide:
1. the files you will create or modify,
2. the responsibility of each file,
3. any assumptions or simplifications.

Then generate the implementation file-by-file.
Do not modify unrelated architecture.
```
