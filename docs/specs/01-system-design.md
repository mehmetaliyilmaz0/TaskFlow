# 01 System Design

## Goal

TaskFlow is a single-user-first Kanban application with secure authentication, private boards, column and card management, responsive layouts, and persistent card ordering.

The v1 target is a robust core flow:

1. Register or log in.
2. Create a board.
3. Create columns inside the board.
4. Create and edit cards inside columns.
5. Drag cards within a column or across columns.
6. Refresh the page and see the same order.

## Architectural Approach

Use Next.js App Router for the page shell and protected routes.

Use Supabase for:

- authentication
- Postgres storage
- Row Level Security
- SQL migrations

Use client components only where interactivity is required:

- login and register forms
- create board, column, and card inputs
- card modal
- drag-and-drop board surface

Keep reads and writes separated:

- server-rendered pages load canonical board state
- API route handlers validate payloads and perform mutations
- ordering math lives in a small data-layer utility, not in UI components

This keeps the code reviewer-friendly because the boundaries are explicit:

- pages render and compose
- feature components manage UI behavior
- server modules own data access
- ordering logic is isolated and testable

## Runtime Boundaries

## Browser

- renders board UI
- hosts drag sensors and overlay state
- performs optimistic updates
- sends mutation requests only on submit or drag end

## Next.js Server

- verifies the current user session
- loads board data for protected routes
- validates writes
- calls Supabase queries and mutations
- calculates persisted card position from neighboring cards

## Supabase Postgres

- stores boards, columns, and cards
- enforces ownership through RLS
- persists the final order state

## Proposed Folder Structure

```text
docs/
  specs/
    01-system-design.md
    02-database-schema.md
    03-frontend-components.md
    04-dnd-algorithm.md
    05-agent-execution-plan.md
    06-readme-submission.md
supabase/
  migrations/
src/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (app)/
      boards/page.tsx
      boards/[boardId]/page.tsx
      layout.tsx
    api/
      boards/route.ts
      boards/[boardId]/columns/route.ts
      columns/[columnId]/cards/route.ts
      cards/[cardId]/route.ts
      cards/move/route.ts
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/
      button.tsx
      input.tsx
      textarea.tsx
      modal.tsx
  features/
    auth/
      components/
    boards/
      components/
    columns/
      components/
    cards/
      components/
    dnd/
      components/
      hooks/
  server/
    auth/
      require-user.ts
    boards/
      queries.ts
      mutations.ts
    columns/
      queries.ts
      mutations.ts
    cards/
      queries.ts
      mutations.ts
      ordering.ts
  lib/
    supabase/
      browser.ts
      server.ts
      middleware.ts
    validation/
      board.ts
      column.ts
      card.ts
    ordering/
      calculate-new-position.ts
      rebalance-column.ts
    utils/
      cn.ts
  types/
    database.ts
middleware.ts
```

## Key Design Decisions

Use UUID primary keys for boards, columns, and cards.

Use `position` fields for ordered entities:

- `columns.position` orders columns inside a board
- `cards.position` orders cards inside a column

Use gap-based numeric ordering for cards.

Example spacing:

- `1000`
- `2000`
- `3000`

Insert behavior:

- insert at bottom: last position plus `1000`
- insert between cards: midpoint between neighbors
- insert at top: half of the next position or next minus a gap

Why this matches the task better than contiguous reindexing:

- it aligns with the assignment's recommended strategy
- most moves update one card row instead of an entire column
- it is easier to explain as a deliberate product-engineering tradeoff
- refresh-stable order still comes from the database

Column reorder remains out of scope, so column ordering can stay append-only in v1.

## Drag-and-Drop Library Decision

Use `dnd-kit`.

Why:

- modern and actively maintained
- flexible for Kanban interactions
- better touch support than native HTML5 drag-and-drop
- reviewer-friendly because it is a current React standard

Rejected alternatives:

- `@hello-pangea/dnd`: workable, but less flexible for custom interactions
- `SortableJS`: fast, but React state integration is less clean
- native HTML5 drag-and-drop: weaker mobile behavior and lower UX quality

## State Management Decision

Use:

- server state from Supabase queries and mutations
- React local state for dialogs, pending actions, and optimistic DnD updates
- no global store in v1

This is enough for the assignment and avoids accidental state complexity.

## Mobile Design Direction

The target is mobile-respectful, not mobile-perfect.

The v1 bar is:

- responsive layout that does not break on narrow screens
- horizontal board scrolling on mobile is acceptable
- touch drag uses an activation constraint to reduce accidental drags
- forms and modals remain usable on mobile sizes

## Non-Goals for v1

Do not implement:

- realtime collaboration
- board sharing with permissions
- comments
- attachments
- tags
- due dates
- assignees
- activity history
- advanced filtering
- notifications
- offline-first sync
- column drag-and-drop

Keeping these out preserves time for correctness in auth, DnD, persistence, and deployment.
