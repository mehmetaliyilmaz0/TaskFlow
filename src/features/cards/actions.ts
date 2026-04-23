"use server";

import { revalidatePath } from "next/cache";
import { DEFAULT_POSITION_GAP, parsePosition } from "@/features/boards/mappers";
import {
  createBoardMutationError,
  createBoardMutationSuccess,
  getAuthenticatedSupabase,
  getTextValue,
  type BoardMutationState,
} from "@/features/boards/actions";

export async function createCardAction(
  _previousState: BoardMutationState,
  formData: FormData
): Promise<BoardMutationState> {
  const { supabase } = await getAuthenticatedSupabase();
  const boardId = getTextValue(formData, "boardId");
  const columnId = getTextValue(formData, "columnId");
  const title = getTextValue(formData, "title");

  if (!boardId) {
    return createBoardMutationError("Board context is missing.");
  }

  if (!columnId) {
    return createBoardMutationError("Column context is missing.");
  }

  if (!title) {
    return createBoardMutationError("Card title is required.");
  }

  const { data: lastCard, error: lastCardError } = await supabase
    .from("cards")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastCardError) {
    return createBoardMutationError("Failed to prepare the new card.");
  }

  const nextPosition = lastCard
    ? parsePosition(lastCard.position) + DEFAULT_POSITION_GAP
    : DEFAULT_POSITION_GAP;

  const { data: insertedCard, error } = await supabase
    .from("cards")
    .insert({
      column_id: columnId,
      title,
      description: "",
      position: String(nextPosition),
    })
    .select("id")
    .maybeSingle();

  if (error || !insertedCard) {
    return createBoardMutationError("Failed to create card. Please try again.");
  }

  revalidatePath(`/boards/${boardId}`);

  return createBoardMutationSuccess("Card created.");
}

export async function updateCardAction(
  _previousState: BoardMutationState,
  formData: FormData
): Promise<BoardMutationState> {
  const { supabase } = await getAuthenticatedSupabase();
  const boardId = getTextValue(formData, "boardId");
  const cardId = getTextValue(formData, "cardId");
  const title = getTextValue(formData, "title");
  const description = getTextValue(formData, "description");

  if (!boardId) {
    return createBoardMutationError("Board context is missing.");
  }

  if (!cardId) {
    return createBoardMutationError("Card context is missing.");
  }

  if (!title) {
    return createBoardMutationError("Card title is required.");
  }

  const { data: updatedCard, error } = await supabase
    .from("cards")
    .update({
      title,
      description,
    })
    .eq("id", cardId)
    .select("id")
    .maybeSingle();

  if (error || !updatedCard) {
    return createBoardMutationError(
      "Failed to save card changes. Please try again."
    );
  }

  revalidatePath(`/boards/${boardId}`);

  return createBoardMutationSuccess("Card updated.");
}

export type PersistCardOrderUpdate = {
  id: string;
  columnId?: string;
  position: number;
};

export type PersistCardOrderInput = {
  boardId: string;
  updates: PersistCardOrderUpdate[];
};

export async function persistCardOrderAction(
  input: PersistCardOrderInput
): Promise<void> {
  const { supabase } = await getAuthenticatedSupabase();

  if (!input.boardId) {
    throw new Error("Board context is missing.");
  }

  if (input.updates.length === 0) {
    return;
  }

  for (const update of input.updates) {
    const nextValues: {
      column_id?: string;
      position: string;
    } = {
      position: String(update.position),
    };

    if (update.columnId) {
      nextValues.column_id = update.columnId;
    }

    const { error } = await supabase
      .from("cards")
      .update(nextValues)
      .eq("id", update.id);

    if (error) {
      throw new Error("Failed to persist card order.");
    }
  }

  revalidatePath(`/boards/${input.boardId}`);
}
