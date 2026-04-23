import { notFound, redirect } from "next/navigation";
import { BoardView } from "@/components/kanban/board-view";
import { createColumnAction } from "@/features/boards/actions";
import { getBoardDetailForUser } from "@/features/boards/queries";
import {
  createCardAction,
  persistCardOrderAction,
  updateCardAction,
} from "@/features/cards/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BoardDetailPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

export default async function BoardDetailPage({
  params,
}: BoardDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { boardId } = await params;
  const board = await getBoardDetailForUser(boardId, user.id);

  if (!board) {
    notFound();
  }

  async function createColumnFormAction(
    previousState: Parameters<typeof createColumnAction>[0],
    formData: Parameters<typeof createColumnAction>[1]
  ) {
    "use server";

    return createColumnAction(previousState, formData);
  }

  async function createCardFormAction(
    previousState: Parameters<typeof createCardAction>[0],
    formData: Parameters<typeof createCardAction>[1]
  ) {
    "use server";

    return createCardAction(previousState, formData);
  }

  async function updateCardFormAction(
    previousState: Parameters<typeof updateCardAction>[0],
    formData: Parameters<typeof updateCardAction>[1]
  ) {
    "use server";

    return updateCardAction(previousState, formData);
  }

  async function persistCardOrderFormAction(
    input: Parameters<typeof persistCardOrderAction>[0]
  ) {
    "use server";

    return persistCardOrderAction(input);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6">
      <BoardView
        board={board}
        createColumnAction={createColumnFormAction}
        createCardAction={createCardFormAction}
        persistCardOrderAction={persistCardOrderFormAction}
        updateCardAction={updateCardFormAction}
      />
    </main>
  );
}
