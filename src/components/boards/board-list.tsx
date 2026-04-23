"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { BoardSummary } from "@/features/boards/queries";
import type { CreateBoardFormState } from "@/features/boards/actions";

type BoardListProps = {
  boards: BoardSummary[];
  createBoardAction: (
    state: CreateBoardFormState,
    formData: FormData
  ) => Promise<CreateBoardFormState>;
};

const initialCreateBoardState: CreateBoardFormState = {
  error: null,
};

function CreateBoardButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Creating board..." : "Create board"}
    </button>
  );
}

export function BoardList({ boards, createBoardAction }: BoardListProps) {
  const [state, formAction] = useActionState(
    createBoardAction,
    initialCreateBoardState
  );

  return (
    <div className="grid gap-8">
      <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Boards
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Create a board and validate persistence before moving to columns.
            </h2>
          </div>

          <div className="w-full sm:max-w-md">
            <form action={formAction} className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                name="title"
                type="text"
                required
                maxLength={120}
                placeholder="Board title"
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
              <CreateBoardButton />
            </form>

            {state.error ? (
              <p
                role="alert"
                className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {state.error}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {boards.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm leading-7 text-slate-600">
          No boards yet. Create your first board to unlock the protected app flow.
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="rounded-[24px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_70px_rgba(15,23,42,0.10)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Board
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                {board.title}
              </h3>
              <p className="mt-3 text-sm text-slate-500">
                Created {new Date(board.createdAt).toLocaleDateString("en-US")}
              </p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
