# TaskFlow

TaskFlow is a Trello-like Kanban board built for a 48-hour take-home project. It focuses on a reliable core flow: authentication, single-owner boards, column and card management, and persistent drag-and-drop card ordering across columns.

## Live Demo

- Live App: [Vercel Link](https://example.com)
- Repository: [GitHub Link](https://github.com/your-username/taskflow)

## Features

- User registration and login with Supabase Auth
- Protected app routes with authenticated redirects
- Board creation and board listing
- Board detail page with ownership validation
- Column creation inside a board
- Card creation inside a column
- Card title and description editing
- Same-column drag-and-drop reorder
- Cross-column drag-and-drop movement
- Empty-column drop support
- Persistent ordering across refreshes
- Optimistic drag updates with rollback and refresh-on-failure hardening

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- dnd-kit
- Vercel

## Architecture Overview

The codebase is organized to keep page components thin and isolate the most failure-prone logic.

- `src/app/`: route-level orchestration and redirects
- `src/components/`: presentational and interaction components
- `src/features/boards`, `src/features/cards`, `src/features/dnd`: domain queries, mutations, and framework-agnostic drag utilities
- `src/lib/supabase/`: Supabase client and server helpers
- `supabase/migrations/`: schema, indexes, triggers, and RLS policies

The drag-and-drop logic is intentionally split between:

- pure TypeScript utilities for ordering and move preparation
- a small UI orchestration layer in the Kanban components
- server actions for persistence

This keeps the handlers explainable and avoids burying ordering rules inside JSX.

## Data Model Summary

TaskFlow uses a deliberately small v1 relational model:

- `boards`: owned by a single authenticated user
- `columns`: belong to a board and are ordered by `position`
- `cards`: belong to a column and are ordered by `position`

Row Level Security is enabled on all three tables, and ownership is enforced through the board ownership chain. A user can only read or mutate boards, columns, and cards that belong to their own account.

## Drag-and-Drop Design Decisions

### Why `dnd-kit`

`dnd-kit` was chosen because it is flexible enough for custom Kanban behavior, works well with modern React patterns, and makes it easier to keep drag state separate from persistence logic. For this project, that mattered more than using a heavier, more opinionated drag-and-drop library.

### Why position-based ordering

Ordering is persisted with numeric `position` values rather than array indices. This makes refresh-safe ordering straightforward and allows most moves to be represented by updating only the moved card instead of rewriting an entire list.

The implementation uses midpoint insertion for most moves and local reindexing only when positions become too dense. That keeps the common path simple while still handling edge cases safely enough for the project scope.

### Persistence strategy

The UI updates optimistically on drop, but persistence happens only on drag end. This avoids excessive writes during hover, keeps the logic easier to reason about, and matches the actual source-of-truth boundary in the database.

If persistence fails, the UI rolls back immediately and refreshes from the server to restore consistency.

## Local Setup

1. Clone the repository
2. Install dependencies
3. Create a `.env.local` file
4. Add the required Supabase environment variables
5. Run the SQL migration in Supabase
6. Start the development server

```bash
git clone <repo-url>
cd taskflow
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The optional `NEXT_PUBLIC_APP_URL` is useful once local auth redirects and deployment URLs are wired.

## Supabase Setup

1. Create a Supabase project
2. Open the SQL Editor
3. Run the migration in `supabase/migrations/20260423120000_taskflow_schema.sql`
4. Confirm the `boards`, `columns`, and `cards` tables exist
5. Confirm RLS is enabled on all three tables

## Trade-Offs and Scope Decisions

This was built as a 48-hour project, so the priority was reliability of the core Kanban flow rather than feature breadth.

Intentionally prioritized:

- clean single-owner relational model
- Supabase Auth + RLS ownership enforcement
- persistent card ordering
- same-column and cross-column drag-and-drop
- reviewer-friendly structure and explainable logic

Intentionally deferred:

- realtime collaboration
- board sharing
- comments
- tags
- due dates
- assignees
- activity history
- column drag-and-drop
- DragOverlay and more advanced DnD polish

The goal was to make the core experience stable and easy to evaluate instead of partially implementing a broader feature set.

## Future Improvements

- Column drag-and-drop
- Collaboration and shared boards
- Richer card metadata such as tags or due dates
- Activity history for board changes
- Transactional or RPC-based batch persistence for complex reorder cases
- More advanced drag polish, including DragOverlay and richer hover feedback

## Reviewer Notes

For the quickest evaluation path, I recommend this flow:

1. Register a new account or sign in
2. Create a board
3. Open the board detail page
4. Add multiple columns
5. Add cards to multiple columns
6. Edit a card title and description
7. Reorder cards within the same column
8. Move a card across columns, including into an empty column
9. Refresh the page and confirm the order is preserved

## Verification Notes

The project currently includes:

- `npm run dev`
- `npm run build`
- `npm run typecheck`

Linting is not yet configured in this version, so there is no ESLint command documented here.
