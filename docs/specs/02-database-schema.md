# 02 Database Schema

## Design Goals

This schema is optimized for these constraints:

- single-owner boards in v1
- reliable persistence of Kanban ordering
- simple authorization model
- minimal accidental complexity
- easy querying for `board -> columns -> cards`
- future extensibility without premature over-design

This is not trying to be Trello-complete. It is trying to be correct, durable, and deliverable.

## Domain Model Overview

The v1 domain model is intentionally small:

- `User`
- `Board`
- `Column`
- `Card`

Ownership chain:

- a user owns many boards
- a board has many columns
- a column has many cards

Logical hierarchy:

```text
User
 └── Board
      └── Column
           └── Card
```

## Core Architectural Decisions

## Single Ownership in v1

Each board belongs to exactly one authenticated user.

Why:

- minimizes access-control complexity
- avoids collaborator join tables
- simplifies RLS
- fits a 48-hour scope

Deferred:

- a later version can introduce `board_members`

## Position-Based Ordering

Both columns and cards have a `position` field.

Why:

- ordering must survive refresh and re-fetch
- array index is not durable
- a sortable numeric field is the simplest robust solution

Principle:

- initial positions are spaced apart
- insertions take midpoint when possible
- occasional reindex happens only when positions become dense

## Soft Simplicity Over Premature Normalization

Do not add tags, comments, due dates, assignees, audit logs, or collaboration tables in v1.

Why:

- every concept increases UI scope
- every concept increases DB scope
- every concept increases auth scope
- every concept increases test surface

## Application Tables

V1 uses three application tables:

- `boards`
- `columns`
- `cards`

Supabase Auth already provides authenticated users through `auth.users`.

## Table Specifications

## `boards`

Purpose:

- represents a Kanban board owned by a single user

Fields:

- `id`
- `user_id`
- `title`
- `created_at`
- `updated_at`

Semantics:

- `user_id` is the owner
- `title` is the user-visible board name
- timestamps support sorting and future features

SQL:

```sql
create extension if not exists pgcrypto;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Constraints rationale:

- `on delete cascade` removes owned boards if the auth user is removed
- non-empty `title` prevents junk rows

## `columns`

Purpose:

- represents a workflow column within a board

Fields:

- `id`
- `board_id`
- `title`
- `position`
- `created_at`
- `updated_at`

Semantics:

- belongs to exactly one board
- ordered within a board by `position`

SQL:

```sql
create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  position numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint columns_board_id_position_key unique (board_id, position)
);
```

Why `numeric(20,6)`:

- deterministic sorting
- midpoint insertion support
- fewer floating-point surprises than raw JS-style float persistence

Why the unique constraint:

- `(board_id, position)` is an ordering invariant
- duplicate positions inside one board should fail fast instead of silently corrupting column order

## `cards`

Purpose:

- represents a work item inside a column

Fields:

- `id`
- `column_id`
- `title`
- `description`
- `position`
- `created_at`
- `updated_at`

Semantics:

- belongs to exactly one column
- ordered within that column by `position`

SQL:

```sql
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  position numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_column_id_position_key unique (column_id, position)
);
```

Description choice:

- `description` defaults to empty string instead of nullable

Why:

- reduces null-handling complexity in UI and API code

Why the unique constraint:

- `(column_id, position)` is an ordering invariant
- duplicate card positions should be rejected at the database boundary

## Timestamp Update Strategy

We want `updated_at` to change automatically on row update.

SQL function:

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Triggers:

```sql
create trigger set_updated_at_boards
before update on public.boards
for each row
execute function public.set_updated_at();

create trigger set_updated_at_columns
before update on public.columns
for each row
execute function public.set_updated_at();

create trigger set_updated_at_cards
before update on public.cards
for each row
execute function public.set_updated_at();
```

Why:

- avoids forgetting timestamp maintenance in application code

## Ordering Model Specification

This is the most important data behavior in the system.

## Column Ordering

Columns are ordered within a board by `position asc`.

Column creation rule:

- first column in a board gets `1000`
- appended columns use `last.position + 1000`

Column reorder is out of scope for v1, so column positions are append-only after creation.

## Card Ordering

Cards are ordered within a column by `position asc`.

Initial card positions use spaced values:

- `1000`
- `2000`
- `3000`

## Position Allocation Rules

## First item in empty container

Set position to `1000`.

## Insert at bottom

Set position to `last.position + 1000`.

## Insert at top

Set position to `first.position / 2` if safe.

Example:

- if first is `1000`, new top can be `500`

## Insert between two items

Set position to midpoint:

```text
(prev.position + next.position) / 2
```

## Dense ordering recovery

If adjacent positions get too close, reindex the affected container only:

- `1000`
- `2000`
- `3000`
- `...`

Explicit v1 threshold:

- with `numeric(20,6)`, the minimum safe distinct gap is greater than `0.000001`
- if `next.position - prev.position <= 0.000001`, rebalance before inserting
- also rebalance if the computed midpoint would round to either neighbor at scale `6`

Why container-local reindex:

- only the impacted board or column needs repair
- global reindex is unnecessary and risky

## Indexing Strategy

Indexes should reflect actual read patterns.

## Boards by owner

```sql
create index idx_boards_user_id on public.boards(user_id);
```

## Columns by board and sort order

```sql
create index idx_columns_board_id_position on public.columns(board_id, position);
```

## Cards by column and sort order

```sql
create index idx_cards_column_id_position on public.cards(column_id, position);
```

Why these indexes:

- get all boards for user
- get ordered columns for a board
- get ordered cards for a column or set of columns

## Recommended Query Shapes

## Fetch boards for current user

```sql
select *
from public.boards
where user_id = auth.uid()
order by created_at desc;
```

## Fetch columns for a board

```sql
select *
from public.columns
where board_id = :board_id
order by position asc;
```

## Fetch cards for a set of columns

```sql
select *
from public.cards
where column_id in (...)
order by column_id, position asc;
```

## Referential Integrity and Deletion Semantics

Deleting a board:

- deletes all columns and cards via cascade

Deleting a column:

- deletes all cards via cascade

Why this is correct for v1:

- avoids orphan data
- keeps the mental model simple
- supports future delete features without cleanup jobs

## Row Level Security Strategy

RLS is mandatory for a production-sensible Supabase design.

Enable RLS on all application tables:

```sql
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;
```

Authorization principle:

- a user may access only data that belongs to boards they own

This means:

- boards: owner only
- columns: only if parent board belongs to the user
- cards: only if parent column's board belongs to the user

## RLS Policies for `boards`

Select:

```sql
create policy "boards_select_own"
on public.boards
for select
using (user_id = auth.uid());
```

Insert:

```sql
create policy "boards_insert_own"
on public.boards
for insert
with check (user_id = auth.uid());
```

Update:

```sql
create policy "boards_update_own"
on public.boards
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

Delete:

```sql
create policy "boards_delete_own"
on public.boards
for delete
using (user_id = auth.uid());
```

## RLS Policies for `columns`

Select:

```sql
create policy "columns_select_via_board_owner"
on public.columns
for select
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);
```

Insert:

```sql
create policy "columns_insert_via_board_owner"
on public.columns
for insert
with check (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);
```

Update:

```sql
create policy "columns_update_via_board_owner"
on public.columns
for update
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);
```

Delete:

```sql
create policy "columns_delete_via_board_owner"
on public.columns
for delete
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);
```

## RLS Policies for `cards`

Select:

```sql
create policy "cards_select_via_board_owner"
on public.cards
for select
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);
```

Insert:

```sql
create policy "cards_insert_via_board_owner"
on public.cards
for insert
with check (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);
```

Update:

```sql
create policy "cards_update_via_board_owner"
on public.cards
for update
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);
```

Delete:

```sql
create policy "cards_delete_via_board_owner"
on public.cards
for delete
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);
```

## RLS Design Note

Why inherited ownership instead of duplicating `user_id` on child tables:

- duplicating `user_id` would simplify some policies
- but it creates duplicate source-of-truth risk
- for v1, inherited ownership through joins is cleaner and more principled

## TypeScript Domain Types

Base primitives:

```ts
export type UUID = string;
export type ISODateString = string;
export type Position = string;
```

Why `Position = string`:

- Supabase/Postgres `numeric` often arrives as string in JS clients
- the persisted transport type should acknowledge that reality

Database row types:

```ts
export interface BoardRow {
  id: UUID;
  user_id: UUID;
  title: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ColumnRow {
  id: UUID;
  board_id: UUID;
  title: string;
  position: Position;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CardRow {
  id: UUID;
  column_id: UUID;
  title: string;
  description: string;
  position: Position;
  created_at: ISODateString;
  updated_at: ISODateString;
}
```

Insert types:

```ts
export interface CreateBoardInput {
  title: string;
}

export interface CreateColumnInput {
  boardId: UUID;
  title: string;
  position: Position;
}

export interface CreateCardInput {
  columnId: UUID;
  title: string;
  description?: string;
  position: Position;
}
```

Update types:

```ts
export interface UpdateBoardInput {
  title?: string;
}

export interface UpdateColumnInput {
  title?: string;
  position?: Position;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  columnId?: UUID;
  position?: Position;
}
```

UI-level normalized types:

```ts
export interface Card {
  id: UUID;
  columnId: UUID;
  title: string;
  description: string;
  position: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Column {
  id: UUID;
  boardId: UUID;
  title: string;
  position: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  cards: Card[];
}

export interface Board {
  id: UUID;
  title: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  columns: Column[];
}
```

Important boundary note:

- at the DB boundary, `position` may be string
- at the UI domain boundary, normalize to number
- this is safe in v1 because positions remain in a JS-safe range through container-local rebalance
- this boundary should stay explicit and should not leak across layers

## Mapping Layer Specification

Do not leak raw DB row shapes everywhere in the UI.

Mapper examples:

```ts
export function parsePosition(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid position value: ${value}`);
  }
  return parsed;
}

export function mapCardRow(row: CardRow): Card {
  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    position: parsePosition(row.position),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapColumnRow(row: ColumnRow, cards: Card[] = []): Column {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    position: parsePosition(row.position),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cards,
  };
}

export function mapBoardRow(row: BoardRow, columns: Column[] = []): Board {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    columns,
  };
}
```

## Query Assembly Strategy

Recommended v1 approach:

- fetch board
- fetch columns ordered
- fetch cards for those columns ordered
- assemble in the application layer

Why:

- predictable typing
- easier debugging
- easier control over ordering

Example assembly function:

```ts
export function assembleBoardData(
  boardRow: BoardRow,
  columnRows: ColumnRow[],
  cardRows: CardRow[]
): Board {
  const cardsByColumnId = new Map<string, Card[]>();

  for (const cardRow of cardRows) {
    const card = mapCardRow(cardRow);
    const current = cardsByColumnId.get(card.columnId) ?? [];
    current.push(card);
    cardsByColumnId.set(card.columnId, current);
  }

  for (const cards of cardsByColumnId.values()) {
    cards.sort((a, b) => a.position - b.position);
  }

  const columns = columnRows
    .map((columnRow) =>
      mapColumnRow(columnRow, cardsByColumnId.get(columnRow.id) ?? [])
    )
    .sort((a, b) => a.position - b.position);

  return mapBoardRow(boardRow, columns);
}
```

## Database Migration Order

The migration order should be:

1. extension setup
2. tables
3. indexes
4. trigger function
5. triggers
6. RLS enable
7. policies

This keeps migrations deterministic.

## Full SQL Migration Block

```sql
create extension if not exists pgcrypto;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  position numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint columns_board_id_position_key unique (board_id, position)
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  position numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_column_id_position_key unique (column_id, position)
);

create index idx_boards_user_id on public.boards(user_id);
create index idx_columns_board_id_position on public.columns(board_id, position);
create index idx_cards_column_id_position on public.cards(column_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_boards
before update on public.boards
for each row
execute function public.set_updated_at();

create trigger set_updated_at_columns
before update on public.columns
for each row
execute function public.set_updated_at();

create trigger set_updated_at_cards
before update on public.cards
for each row
execute function public.set_updated_at();

alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;

create policy "boards_select_own"
on public.boards
for select
using (user_id = auth.uid());

create policy "boards_insert_own"
on public.boards
for insert
with check (user_id = auth.uid());

create policy "boards_update_own"
on public.boards
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "boards_delete_own"
on public.boards
for delete
using (user_id = auth.uid());

create policy "columns_select_via_board_owner"
on public.columns
for select
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "columns_insert_via_board_owner"
on public.columns
for insert
with check (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "columns_update_via_board_owner"
on public.columns
for update
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "columns_delete_via_board_owner"
on public.columns
for delete
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_select_via_board_owner"
on public.cards
for select
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_insert_via_board_owner"
on public.cards
for insert
with check (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_update_via_board_owner"
on public.cards
for update
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_delete_via_board_owner"
on public.cards
for delete
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);
```

## Acceptance Criteria for This Schema

This schema is acceptable only if all of the following are true:

- users cannot access each other's boards
- column and card access inherits correctly through board ownership
- deleting a board cleans up descendants
- ordering is queryable via `position`
- UI can rebuild board state from relational rows
- drag-and-drop persistence can be expressed as `column_id + position` updates

## Known v1 Trade-Offs

No `board_members`:

- collaboration is intentionally out of scope

No audit log:

- activity history is intentionally out of scope

No database-level reindex job:

- reindex remains an application utility in v1

No denormalized owner ids on child tables:

- cleaner relational ownership is preferred over marginal policy simplification
