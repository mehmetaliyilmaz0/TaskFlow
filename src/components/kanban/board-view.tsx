"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import type { Board } from "@/features/boards/types";
import {
  initialBoardMutationState,
} from "@/features/boards/mutation-state";
import {
  isCardDragData,
  isDropOnCardData,
  isDropOnColumnData,
} from "@/features/dnd/types";
import {
  findCard,
  findColumn,
  prepareCrossColumnMove,
  prepareSameColumnReorder,
} from "@/features/dnd/utils";
import type { PersistCardOrderInput } from "@/features/cards/actions";
import { CardDetailDialog } from "./card-detail-dialog";
import {
  ColumnPanel,
  InlineMessage,
  SubmitButton,
  type BoardMutationAction,
} from "./column-panel";

type BoardViewProps = {
  board: Board;
  createColumnAction: BoardMutationAction;
  createCardAction: BoardMutationAction;
  persistCardOrderAction: (input: PersistCardOrderInput) => Promise<void>;
  updateCardAction: BoardMutationAction;
};

type CreateColumnFormProps = {
  boardId: string;
  createColumnAction: BoardMutationAction;
};

type ResolvedDropTarget = {
  columnId: string;
  targetIndex: number;
};

function CreateColumnForm({
  boardId,
  createColumnAction,
}: CreateColumnFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createColumnAction,
    initialBoardMutationState
  );

  useEffect(() => {
    if (!state.error && state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.error, state.submittedAt, state.successMessage]);

  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Columns
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
        Add workflow lanes to shape the board and keep card movement organized.
      </h2>

      <form
        ref={formRef}
        action={formAction}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input type="hidden" name="boardId" value={boardId} />
        <input
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="Column title"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
        <SubmitButton idleLabel="Create column" pendingLabel="Creating column..." />
      </form>

      <InlineMessage state={state} />
    </div>
  );
}

function buildBoardWithCardUpdates(
  board: Board,
  updatesByColumnId: Record<string, Board["columns"][number]["cards"]>
): Board {
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id in updatesByColumnId
        ? {
            ...column,
            cards: updatesByColumnId[column.id],
          }
        : column
    ),
  };
}

function resolveDropTarget(
  board: Board,
  overId: string,
  overData: unknown
): ResolvedDropTarget | null {
  if (isDropOnCardData(overData)) {
    const overCardLocation = findCard(board, overData.cardId);

    if (!overCardLocation) {
      return null;
    }

    return {
      columnId: overCardLocation.column.id,
      targetIndex: overCardLocation.cardIndex,
    };
  }

  if (isDropOnColumnData(overData)) {
    const overColumnLocation = findColumn(board, overData.columnId);

    if (!overColumnLocation) {
      return null;
    }

    return {
      columnId: overColumnLocation.column.id,
      targetIndex: overColumnLocation.column.cards.length,
    };
  }

  const fallbackCardLocation = findCard(board, overId);

  if (!fallbackCardLocation) {
    return null;
  }

  return {
    columnId: fallbackCardLocation.column.id,
    targetIndex: fallbackCardLocation.cardIndex,
  };
}

export function BoardView({
  board,
  createColumnAction,
  createCardAction,
  persistCardOrderAction,
  updateCardAction,
}: BoardViewProps) {
  const router = useRouter();
  const [dragError, setDragError] = useState<string | null>(null);
  const [isPersistingMove, setIsPersistingMove] = useState(false);
  const [optimisticBoard, setOptimisticBoard] = useState(board);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    })
  );

  useEffect(() => {
    setOptimisticBoard(board);
  }, [board]);

  const selectedCard = selectedCardId
    ? findCard(optimisticBoard, selectedCardId)?.card ?? null
    : null;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || isPersistingMove) {
      return;
    }

    const previousBoard = optimisticBoard;
    const activeData = active.data.current;
    const activeCardId = isCardDragData(activeData)
      ? activeData.cardId
      : String(active.id);
    const activeCardLocation = findCard(previousBoard, activeCardId);

    if (!activeCardLocation) {
      return;
    }

    const resolvedDropTarget = resolveDropTarget(
      previousBoard,
      String(over.id),
      over.data.current
    );

    if (!resolvedDropTarget) {
      return;
    }

    if (activeCardLocation.column.id === resolvedDropTarget.columnId) {
      const preparedReorder = prepareSameColumnReorder(
        activeCardLocation.column,
        activeCardLocation.card.id,
        resolvedDropTarget.targetIndex
      );

      if (!preparedReorder) {
        return;
      }

      const movedCard = preparedReorder.updatedCards.find(
        (card) => card.id === preparedReorder.movedCardId
      );

      if (!movedCard) {
        return;
      }

      const nextBoard = buildBoardWithCardUpdates(previousBoard, {
        [preparedReorder.columnId]: preparedReorder.updatedCards,
      });

      setDragError(null);
      setOptimisticBoard(nextBoard);
      setIsPersistingMove(true);

      try {
        await persistCardOrderAction({
          boardId: previousBoard.id,
          updates: preparedReorder.reindexed
            ? preparedReorder.updatedCards.map((card) => ({
                id: card.id,
                position: card.position,
              }))
            : [
                {
                  id: movedCard.id,
                  position: movedCard.position,
                },
              ],
        });
      } catch {
        setOptimisticBoard(previousBoard);
        setDragError(
          "Failed to save card order. The board was reloaded from the server."
        );
        router.refresh();
      } finally {
        setIsPersistingMove(false);
      }

      return;
    }

    const preparedMove = prepareCrossColumnMove(
      previousBoard,
      activeCardLocation.card.id,
      activeCardLocation.column.id,
      resolvedDropTarget.columnId,
      resolvedDropTarget.targetIndex
    );

    if (!preparedMove) {
      return;
    }

    const movedCard = preparedMove.destinationCards.find(
      (card) => card.id === preparedMove.movedCardId
    );

    if (!movedCard) {
      return;
    }

    const nextBoard = buildBoardWithCardUpdates(previousBoard, {
      [preparedMove.sourceColumnId]: preparedMove.sourceCards,
      [preparedMove.destinationColumnId]: preparedMove.destinationCards,
    });

    setDragError(null);
    setOptimisticBoard(nextBoard);
    setIsPersistingMove(true);

    try {
      await persistCardOrderAction({
        boardId: previousBoard.id,
        updates: preparedMove.reindexed
          ? preparedMove.destinationCards.map((card) => ({
              id: card.id,
              columnId: preparedMove.destinationColumnId,
              position: card.position,
            }))
          : [
              {
                id: movedCard.id,
                columnId: preparedMove.destinationColumnId,
                position: movedCard.position,
              },
            ],
      });
    } catch {
      setOptimisticBoard(previousBoard);
      setDragError(
        "Failed to save card order. The board was reloaded from the server."
      );
      router.refresh();
    } finally {
      setIsPersistingMove(false);
    }
  }

  return (
    <div className="w-full space-y-8">
      <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <Link
          href="/boards"
          className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4"
        >
          Back to boards
        </Link>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Board Detail
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          {board.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
          Columns and cards now load from Postgres in persisted position order.
          Same-column reorder and cross-column card movement are active in this
          phase, while persistence still happens only on drop completion.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Created {new Date(optimisticBoard.createdAt).toLocaleDateString("en-US")}
        </p>
      </section>

      <CreateColumnForm
        boardId={optimisticBoard.id}
        createColumnAction={createColumnAction}
      />

      {dragError ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {dragError}
        </p>
      ) : null}

      {optimisticBoard.columns.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm leading-7 text-slate-600">
          No columns yet. Create your first column to start building the board
          structure.
        </section>
      ) : (
        <DndContext
          id={`board-dnd-${board.id}`}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={() => {
            if (!isPersistingMove) {
              setDragError(null);
            }
          }}
          onDragCancel={() => undefined}
          sensors={sensors}
        >
          <section className="flex gap-6 overflow-x-auto pb-2">
            {optimisticBoard.columns.map((column) => (
              <ColumnPanel
                key={column.id}
                boardId={optimisticBoard.id}
                column={column}
                createCardAction={createCardAction}
                dndDisabled={isPersistingMove}
                onEditCard={(card) => setSelectedCardId(card.id)}
              />
            ))}
          </section>
        </DndContext>
      )}

      {selectedCard ? (
        <CardDetailDialog
          key={selectedCard.id}
          boardId={optimisticBoard.id}
          card={selectedCard}
          updateCardAction={updateCardAction}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCardId(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
