import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_POSITION_GAP, parsePosition } from "./mappers";
import {
  createBoardMutationError,
  createBoardMutationSuccess,
  type BoardMutationState,
  type CreateBoardFormState,
} from "./mutation-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { BoardMutationState, CreateBoardFormState } from "./mutation-state";
export {
  createBoardMutationError,
  createBoardMutationSuccess,
  initialBoardMutationState,
} from "./mutation-state";

export function getTextValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function getAuthenticatedSupabase() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function createBoardAction(
  _previousState: CreateBoardFormState,
  formData: FormData
): Promise<CreateBoardFormState> {
  "use server";

  const { supabase, user } = await getAuthenticatedSupabase();

  const title = getTextValue(formData, "title");

  if (!title) {
    return {
      error: "Board title is required.",
    };
  }

  const { error } = await supabase.from("boards").insert({
    user_id: user.id,
    title,
  });

  if (error) {
    return {
      error: "Failed to create board. Please try again.",
    };
  }

  revalidatePath("/boards");
  redirect("/boards");
}

export async function createColumnAction(
  _previousState: BoardMutationState,
  formData: FormData
): Promise<BoardMutationState> {
  "use server";

  const { supabase } = await getAuthenticatedSupabase();
  const boardId = getTextValue(formData, "boardId");
  const title = getTextValue(formData, "title");

  if (!boardId) {
    return createBoardMutationError("Board context is missing.");
  }

  if (!title) {
    return createBoardMutationError("Column title is required.");
  }

  const { data: lastColumn, error: lastColumnError } = await supabase
    .from("columns")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastColumnError) {
    return createBoardMutationError("Failed to prepare the new column.");
  }

  const nextPosition = lastColumn
    ? parsePosition(lastColumn.position) + DEFAULT_POSITION_GAP
    : DEFAULT_POSITION_GAP;

  const { data: insertedColumn, error } = await supabase
    .from("columns")
    .insert({
      board_id: boardId,
      title,
      position: String(nextPosition),
    })
    .select("id")
    .maybeSingle();

  if (error || !insertedColumn) {
    return createBoardMutationError("Failed to create column. Please try again.");
  }

  revalidatePath(`/boards/${boardId}`);

  return createBoardMutationSuccess("Column created.");
}
