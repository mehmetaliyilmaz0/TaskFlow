import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assembleBoardData } from "./mappers";
import type { Board, BoardRow, CardRow, ColumnRow } from "./types";

type BoardSummaryRow = Pick<
  BoardRow,
  "id" | "title" | "created_at" | "updated_at"
>;

export type BoardSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

function mapBoardSummary(row: BoardSummaryRow): BoardSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBoardsForUser(userId: string): Promise<BoardSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("boards")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load boards.");
  }

  return (data ?? []).map(mapBoardSummary);
}

export async function getBoardForUser(
  boardId: string,
  userId: string
): Promise<BoardSummary | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("boards")
    .select("id, title, created_at, updated_at")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load the requested board.");
  }

  return data ? mapBoardSummary(data) : null;
}

export async function getBoardDetailForUser(
  boardId: string,
  userId: string
): Promise<Board | null> {
  const supabase = await createSupabaseServerClient();
  const { data: boardRow, error: boardError } = await supabase
    .from("boards")
    .select("id, user_id, title, created_at, updated_at")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (boardError) {
    throw new Error("Failed to load the requested board.");
  }

  if (!boardRow) {
    return null;
  }

  const { data: columnRows, error: columnError } = await supabase
    .from("columns")
    .select("id, board_id, title, position, created_at, updated_at")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (columnError) {
    throw new Error("Failed to load board columns.");
  }

  const columnIds = (columnRows ?? []).map((column) => column.id);
  let cardRows: CardRow[] = [];

  if (columnIds.length > 0) {
    const { data, error: cardError } = await supabase
      .from("cards")
      .select("id, column_id, title, description, position, created_at, updated_at")
      .in("column_id", columnIds)
      .order("column_id", { ascending: true })
      .order("position", { ascending: true });

    if (cardError) {
      throw new Error("Failed to load board cards.");
    }

    cardRows = data ?? [];
  }

  return assembleBoardData(
    boardRow as BoardRow,
    (columnRows ?? []) as ColumnRow[],
    cardRows
  );
}
