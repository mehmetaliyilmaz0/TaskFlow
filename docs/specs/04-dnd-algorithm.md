# 04 DnD Algorithm

## Why This Document Exists

This is the most failure-prone part of TaskFlow.

A Kanban app can look complete and still fail review if:

- drag feels broken
- cross-column move is inconsistent
- refresh loses order
- empty-column drops fail
- persisted order differs from UI order

This document exists to prevent that.

## Non-Negotiable Requirements

The DnD system must support:

1. reordering cards within the same column
2. moving cards across columns
3. dropping into an empty column
4. preserving order after refresh
5. visual feedback during drag
6. persistence only when the drag operation is complete

## Explicit v1 Scope Boundary

## In scope

- card drag within a column
- card move across columns
- persistent `column_id + position` update
- optimistic UI update on drop
- server persistence on drag end

## Out of scope

- column drag-and-drop
- multi-select drag
- keyboard drag interactions
- realtime collaborative ordering
- drag history or audit trail
- auto-scroll perfection beyond sensible defaults

This matters because many implementations fail by trying to do too much.

## Core Design Principles

## Persist only on drag end

Do not write to the database during `onDragOver`.

Why:

- too many writes
- race conditions
- jittery UX
- harder debugging

## UI may update during drag, but persistence happens only after final drop

Use in-memory preview state if needed, but backend persistence happens only after the user completes the drop.

## Position-based persistence is the contract

The DnD layer does not persist array indices.

It persists:

- `column_id`
- `position`

This is essential.

## The dragged entity in v1 is always a card

Do not build a generic drag engine yet.

## Data Contracts

At the UI layer, use normalized types like this:

```ts
export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  columns: Column[];
}
```

Important boundary note:

- at the database boundary, Supabase may return `position` as a string
- at the UI domain boundary, DnD logic should work with normalized `number` positions
- this matches the mapping rules in the database spec

## DnD Identity Model

`dnd-kit` needs stable ids and metadata.

## Draggable ids

Each card draggable id should be the card id.

## Droppable ids

The implementation needs:

- card-level sortable target ids
- column container ids for empty-column drops and append-to-end drops

Recommended pattern:

```ts
type DragItemType = "card";
type DropTargetType = "card" | "column";

interface CardDragData {
  type: "card";
  cardId: string;
  columnId: string;
}

interface CardDropOnCardData {
  type: "card";
  cardId: string;
  columnId: string;
}

interface CardDropOnColumnData {
  type: "column";
  columnId: string;
}
```

Why metadata matters:

- ids alone are brittle
- the handler must distinguish hovering over a card vs hovering over a column body

## State Model

The board UI state should stay simple:

```ts
interface BoardState {
  board: Board;
  activeCardId: string | null;
}
```

Optional lookup maps:

```ts
interface BoardLookups {
  columnById: Map<string, Column>;
  cardById: Map<string, Card>;
}
```

Do not over-normalize prematurely. The board size in this project is small enough for readable local state.

## Event Lifecycle

The DnD lifecycle in v1 is:

1. `onDragStart`
2. optional `onDragOver`
3. `onDragEnd`
4. `onDragCancel`

## `onDragStart` Specification

Responsibilities:

- identify the active card
- store `activeCardId`
- optionally render a `DragOverlay`

Pseudocode:

```ts
onDragStart(event) {
  const { active } = event;
  if (active.data.current?.type !== "card") return;

  setActiveCardId(active.id as string);
}
```

## `onDragCancel` Specification

Responsibilities:

- clear temporary drag state
- do not persist anything

Pseudocode:

```ts
onDragCancel() {
  setActiveCardId(null);
}
```

## `onDragOver` Strategy

There are two valid strategies:

## Strategy A: conservative

Do not mutate board order during hover.

Only:

- show overlay
- highlight column or card target

Pros:

- simpler
- fewer bugs
- easier reasoning

Cons:

- less live-preview feel

## Strategy B: light preview

Temporarily rearrange UI during hover with strictly local state.

Pros:

- richer interaction

Cons:

- more logic
- more bug surface
- easier to desync from final persistence logic

## Recommendation for v1

Use conservative or light preview only.

Do not implement aggressive hover mutation that tries to persist or fully reconcile state during every pointer move.

Reliability beats flourish in a 48-hour project.

## `onDragEnd` Responsibilities

This is the core event.

It must:

1. validate source and target
2. detect whether the drop is meaningful
3. compute the destination column
4. compute the destination index
5. compute the new position
6. update UI optimistically
7. persist to the backend
8. recover if persistence fails
9. clear active drag state

## Critical Scenarios to Handle

The implementation must explicitly support:

## Same-column reorder

Move card from index `i` to index `j` within the same column.

## Cross-column move to non-empty column

Card goes from source column to target column near a target card.

## Cross-column move to empty column

Card becomes the first item in the target column.

## Drop over card

Target should be interpreted relative to that card.

## Drop over column container

Target should be interpreted as:

- index `0` if the column is empty
- append to end if the column already has cards

## Drop outside any valid target

No change.

## Helper Functions You Must Have

Do not bury the whole algorithm inside the React handler.

Minimum helper surface:

```ts
findCard(board: Board, cardId: string): { card: Card; column: Column; cardIndex: number } | null;
findColumn(board: Board, columnId: string): { column: Column; columnIndex: number } | null;

removeCardFromColumn(column: Column, cardId: string): Card[];
insertCardIntoColumn(cards: Card[], card: Card, index: number): Card[];

calculateNewPosition(params: {
  destinationCards: Card[];
  targetIndex: number;
}): { position: number; needsReindex: boolean };

reindexPositions(cards: Card[]): Card[];
```

This keeps the implementation modular and reviewable.

## Position Calculation Contract

Function contract:

```ts
interface CalculateNewPositionParams {
  destinationCards: Array<{ position: number }>;
  targetIndex: number;
}

interface CalculateNewPositionResult {
  position: number;
  needsReindex: boolean;
}
```

## Position Calculation Rules

This section must align with the database spec.

Default spacing:

- `1000`
- `2000`
- `3000`

## Case 1: Empty destination

If `destinationCards.length === 0`

```ts
position = 1000
needsReindex = false
```

## Case 2: Insert at top

If `targetIndex === 0`

Let `next = destinationCards[0]`

Preferred result:

```ts
position = next.position / 2
```

If this is too dense or rounds unsafely at the DB precision boundary, mark `needsReindex = true`.

## Case 3: Insert at bottom

If `targetIndex === destinationCards.length`

Let `prev = destinationCards[destinationCards.length - 1]`

```ts
position = prev.position + 1000
needsReindex = false
```

## Case 4: Insert in middle

Let:

- `prev = destinationCards[targetIndex - 1]`
- `next = destinationCards[targetIndex]`

Then:

```ts
position = (prev.position + next.position) / 2
```

## Case 5: Dense positions

The database spec uses `numeric(20,6)`, so this DnD spec must use the same safety rule.

Use:

```ts
const MIN_POSITION_GAP = 0.000001;
```

Set `needsReindex = true` if:

- `Math.abs(next.position - prev.position) <= MIN_POSITION_GAP`
- or the computed midpoint would round to either neighbor at scale `6`

This is stricter than a coarse `1` threshold, but it is the correct aligned rule for the chosen schema.

## Reindex Policy

When positions become too dense:

## Reindex only the affected container

- same-column reorder: reindex that column only
- cross-column move: reindex the destination column only

Do not reindex the whole board.

## Reindex strategy

Assign:

- `1000`
- `2000`
- `3000`
- `...`

Then recompute the moved card's intended slot.

Why this is correct:

- local repair
- low complexity
- predictable persistence

## Determining Destination Index

This is one of the easiest places to introduce bugs.

## Hovering over a card

Destination index is relative to that card.

Simplified v1 rule:

- treat hovered card's index as the insertion index
- let `SortableContext` and sortable helpers do the heavy lifting where possible

## Hovering over a column container

Then:

- if the column is empty, destination index is `0`
- if the column is not empty, append to the end

This is acceptable and reviewer-friendly for v1.

## Recommended v1 Simplification

For same-column reorder:

- use sortable logic

For cross-column move:

- dropping over a card inserts near that card
- dropping over a column body appends to the end

This reduces ambiguity and implementation risk.

## Same-Column Reorder Algorithm

Inputs:

- source column id
- source index
- destination index

Behavior:

- remove dragged card from the source array
- insert it at the destination index
- calculate the new position from its new neighbors
- persist only the dragged card position unless reindex is required

Important:

- you do not need to rewrite all cards if the position system works

Pseudocode:

```ts
function reorderWithinSameColumn(column, activeCardId, targetIndex) {
  const sourceIndex = column.cards.findIndex((card) => card.id === activeCardId);
  if (sourceIndex === -1) return null;
  if (sourceIndex === targetIndex) return null;

  const newCards = [...column.cards];
  const [movedCard] = newCards.splice(sourceIndex, 1);
  newCards.splice(targetIndex, 0, movedCard);

  const { position, needsReindex } = calculateNewPosition({
    destinationCards: newCards.filter((card) => card.id !== movedCard.id),
    targetIndex,
  });

  movedCard.position = position;

  if (needsReindex) {
    const reindexed = reindexPositions(newCards);
    return { updatedCards: reindexed, movedCardId: movedCard.id, reindexed: true };
  }

  return { updatedCards: newCards, movedCardId: movedCard.id, reindexed: false };
}
```

## Cross-Column Move Algorithm

Inputs:

- source column id
- destination column id
- source index
- destination index

Behavior:

- remove dragged card from the source column
- change `columnId`
- insert into destination at the target index
- compute the new position in the destination
- persist `column_id + position`
- source column positions do not need updates unless you explicitly choose to rebalance there, which v1 should avoid

Pseudocode:

```ts
function moveAcrossColumns(board, activeCardId, sourceColumnId, destinationColumnId, targetIndex) {
  const sourceColumn = findColumn(board, sourceColumnId)?.column;
  const destinationColumn = findColumn(board, destinationColumnId)?.column;
  if (!sourceColumn || !destinationColumn) return null;

  const sourceCards = [...sourceColumn.cards];
  const sourceIndex = sourceCards.findIndex((card) => card.id === activeCardId);
  if (sourceIndex === -1) return null;

  const [movedCard] = sourceCards.splice(sourceIndex, 1);

  const destinationCards = [...destinationColumn.cards];
  destinationCards.splice(targetIndex, 0, {
    ...movedCard,
    columnId: destinationColumnId,
  });

  const insertedCard = destinationCards[targetIndex];

  const { position, needsReindex } = calculateNewPosition({
    destinationCards: destinationCards.filter((_, index) => index !== targetIndex),
    targetIndex,
  });

  insertedCard.position = position;

  if (needsReindex) {
    const reindexedDestination = reindexPositions(destinationCards);
    return {
      sourceCards,
      destinationCards: reindexedDestination,
      movedCardId: insertedCard.id,
      reindexed: true,
    };
  }

  return {
    sourceCards,
    destinationCards,
    movedCardId: insertedCard.id,
    reindexed: false,
  };
}
```

## Optimistic UI Update Strategy

Decision:

- apply the final board mutation locally immediately on drop
- then persist

Why:

- better UX
- feels instant
- standard product behavior

## Failure Recovery Strategy

If persistence fails:

- clear drag state
- show toast or inline error feedback
- restore consistency

Recommended v1 choice:

- refetch canonical board data from the backend

Why this is preferred over rollback-by-default:

- simpler than maintaining a full rollback engine
- guarantees consistency with DB truth
- aligns with the delivery plan's preference for `rollback or refetch on failure`, with refetch as the safer default

Rollback via a previous snapshot is still acceptable as an optimization, but not required for v1.

## Persistence Contract

After drop, persist:

## Same-column reorder

Update dragged card:

- `position`

## Cross-column move

Update dragged card:

- `column_id`
- `position`

## If reindex happened

Persist all affected cards in the destination column.

Why:

- reindex changes multiple rows

## Persistence API Shape

Recommended app-layer functions:

```ts
async function updateCardPosition(cardId: string, position: number): Promise<void>;

async function moveCardToColumn(cardId: string, columnId: string, position: number): Promise<void>;

async function batchUpdateCardPositions(
  updates: Array<{ id: string; columnId?: string; position: number }>
): Promise<void>;
```

This matches the current architecture better than a database RPC-first design.

Per-drop single-row updates are acceptable in the common case.

Batch updates are only necessary when reindexing.

## Edge Case Matrix

These cases must be explicitly tested:

| Case | Expected Result |
| --- | --- |
| Drag within same column to higher index | reordered correctly |
| Drag within same column to lower index | reordered correctly |
| Drag to same exact place | no-op |
| Drag across columns to empty column | card becomes first item |
| Drag across columns to non-empty column | card inserted correctly |
| Drop over invalid area | no state change |
| Drop over column body | append or empty insert |
| Refresh after move | order preserved |
| Dense positions | reindex path works |
| Persistence failure | refetch restores consistency |

## `dnd-kit` Sensor Strategy

Recommended sensors:

- `PointerSensor`
- `TouchSensor`

Deferred:

- `KeyboardSensor`

## Touch activation constraint

Use a delay or distance threshold to reduce accidental drag on mobile.

Conceptually:

```ts
TouchSensor with activationConstraint:
- delay: small
- tolerance: small
```

or a pointer distance threshold.

Perfect mobile gesture design is not required. Reasonable usability is.

## Drag Overlay Spec

Use `DragOverlay` for cleaner UX.

Benefits:

- dragged item remains visible
- source layout does not collapse awkwardly
- interaction looks more polished

v1 expectation:

- same card style
- card title visible
- slightly elevated appearance

## UI Visual Feedback Rules

At minimum:

- active dragged card appears visually distinct
- destination column highlights subtly
- hovered card spacing remains readable
- empty column has an obvious drop affordance

Do not overdesign. Stability matters more.

## TypeScript Contracts for DnD

Recommended event-level types:

```ts
export interface CardDragData {
  type: "card";
  cardId: string;
  columnId: string;
}

export interface CardDropOnCardData {
  type: "card";
  cardId: string;
  columnId: string;
}

export interface CardDropOnColumnData {
  type: "column";
  columnId: string;
}

export type DropData = CardDropOnCardData | CardDropOnColumnData;
```

Type guards:

```ts
export function isCardDragData(value: unknown): value is CardDragData;
export function isDropOnCardData(value: unknown): value is CardDropOnCardData;
export function isDropOnColumnData(value: unknown): value is CardDropOnColumnData;
```

These make handlers safer and easier to review.

## Recommended Implementation Order

Do not implement full DnD in one pass.

1. render static board and cards
2. implement same-column reorder only
3. persist same-column reorder
4. implement cross-column move
5. persist cross-column move
6. handle empty-column drop
7. add reindex fallback
8. add error recovery and polish

This matches the current phased delivery plan.

## Reviewer-Facing Engineering Rationale

If asked why this design was chosen, the answer is:

> Drag-and-drop state and persistence were intentionally decoupled. The UI updates optimistically for responsiveness, while the backend persists only the final `column_id` and `position` on drop completion. Ordering is stored using numeric positions rather than array indices so that refreshes preserve state and inserts can usually be handled without rewriting an entire column. This keeps the implementation robust, scalable enough for the project scope, and easier to reason about under a 48-hour constraint.

That is the correct principal-level defense.

## Acceptance Criteria for the DnD System

This DnD implementation is acceptable only if all of the following are true:

- dragging a card within a column updates visible order correctly
- dragging a card to another column updates visible order correctly
- dropping into an empty column works
- refresh preserves the final order
- invalid drops are no-ops
- persistence failures do not leave the board permanently inconsistent
- implementation is modular, not one giant event handler
