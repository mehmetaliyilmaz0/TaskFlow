"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Card } from "@/features/boards/types";
import {
  initialBoardMutationState,
  type BoardMutationState,
} from "@/features/boards/mutation-state";

type BoardMutationAction = (
  state: BoardMutationState,
  formData: FormData
) => Promise<BoardMutationState>;

type CardDetailDialogProps = {
  boardId: string;
  card: Card;
  updateCardAction: BoardMutationAction;
  onOpenChange: (open: boolean) => void;
};

function SaveCardButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

export function CardDetailDialog({
  boardId,
  card,
  updateCardAction,
  onOpenChange,
}: CardDetailDialogProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [state, formAction] = useActionState(
    updateCardAction,
    initialBoardMutationState
  );

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
  }, [card.description, card.id, card.title]);

  useEffect(() => {
    if (!state.error && state.successMessage) {
      onOpenChange(false);
    }
  }, [onOpenChange, state.error, state.submittedAt, state.successMessage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Card Details
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Edit title and description
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form action={formAction} className="mt-8 space-y-5">
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="cardId" value={card.id} />

          <div className="space-y-2">
            <label htmlFor="card-title" className="text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="card-title"
              name="title"
              type="text"
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="card-description"
              className="text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="card-description"
              name="description"
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="block w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              placeholder="Add card context, acceptance notes, or implementation details."
            />
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <SaveCardButton />
          </div>
        </form>
      </div>
    </div>
  );
}
