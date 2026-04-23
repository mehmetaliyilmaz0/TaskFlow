"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Card, Column } from "@/features/boards/types";
import {
  initialBoardMutationState,
  type BoardMutationState,
} from "@/features/boards/mutation-state";
import type { CardDropOnColumnData } from "@/features/dnd/types";
import { SortableCardItem } from "./sortable-card-item";

export type BoardMutationAction = (
  state: BoardMutationState,
  formData: FormData
) => Promise<BoardMutationState>;

type SubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

type CreateCardFormProps = {
  boardId: string;
  columnId: string;
  createCardAction: BoardMutationAction;
};

type ColumnPanelProps = {
  boardId: string;
  column: Column;
  createCardAction: BoardMutationAction;
  dndDisabled?: boolean;
  onEditCard: (card: Card) => void;
};

export function InlineMessage({ state }: { state: BoardMutationState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {state.error}
      </p>
    );
  }

  if (state.successMessage) {
    return (
      <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {state.successMessage}
      </p>
    );
  }

  return null;
}

export function SubmitButton({
  idleLabel,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function CreateCardForm({
  boardId,
  columnId,
  createCardAction,
}: CreateCardFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createCardAction,
    initialBoardMutationState
  );

  useEffect(() => {
    if (!state.error && state.successMessage) {
      formRef.current?.reset();
    }
  }, [state.error, state.submittedAt, state.successMessage]);

  return (
    <div>
      <form ref={formRef} action={formAction} className="space-y-3">
        <input type="hidden" name="boardId" value={boardId} />
        <input type="hidden" name="columnId" value={columnId} />
        <input
          name="title"
          type="text"
          required
          maxLength={160}
          placeholder="Add a card"
          className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        />
        <SubmitButton idleLabel="Create card" pendingLabel="Creating card..." />
      </form>

      <InlineMessage state={state} />
    </div>
  );
}

function CardList({
  column,
  dndDisabled = false,
  onEditCard,
}: {
  column: Column;
  dndDisabled?: boolean;
  onEditCard: (card: Card) => void;
}) {
  if (column.cards.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
        No cards yet. Add the first card in this column.
      </div>
    );
  }

  return (
    <SortableContext
      items={column.cards.map((card) => card.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-3">
        {column.cards.map((card) => (
          <SortableCardItem
            key={card.id}
            card={card}
            disabled={dndDisabled}
            onEdit={onEditCard}
          />
        ))}
      </div>
    </SortableContext>
  );
}

export function ColumnPanel({
  boardId,
  column,
  createCardAction,
  dndDisabled = false,
  onEditCard,
}: ColumnPanelProps) {
  const dropTargetData: CardDropOnColumnData = {
    type: "column",
    columnId: column.id,
  };
  const { isOver, setNodeRef } = useDroppable({
    id: `column-drop-${column.id}`,
    data: dropTargetData,
    disabled: dndDisabled,
  });
  const dropHint = isOver
    ? column.cards.length === 0
      ? "Drop card here"
      : "Release to move to the end"
    : null;

  return (
    <article className="min-w-[320px] max-w-[360px] flex-1 rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Column
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {column.title}
          </h2>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {column.cards.length} {column.cards.length === 1 ? "card" : "cards"}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`relative mt-6 min-h-[108px] rounded-[24px] transition ${
          isOver
            ? "bg-slate-50/90 ring-2 ring-slate-200 ring-offset-2 ring-offset-white"
            : ""
        }`}
      >
        {dropHint ? (
          <p
            className={`pointer-events-none absolute z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ${
              column.cards.length === 0
                ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                : "bottom-3 right-3"
            }`}
          >
            {dropHint}
          </p>
        ) : null}
        <CardList
          column={column}
          dndDisabled={dndDisabled}
          onEditCard={onEditCard}
        />
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <CreateCardForm
          boardId={boardId}
          columnId={column.id}
          createCardAction={createCardAction}
        />
      </div>
    </article>
  );
}
