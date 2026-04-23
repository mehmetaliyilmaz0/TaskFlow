import type { Card, Column } from "@/features/boards/types";

export interface ColumnLocation {
  column: Column;
  columnIndex: number;
}

export interface CardLocation extends ColumnLocation {
  card: Card;
  cardIndex: number;
}

export interface PositionableItem {
  position: number;
}

export interface CalculateNewPositionParams {
  destinationCards: PositionableItem[];
  targetIndex: number;
}

export interface CalculateNewPositionResult {
  position: number;
  needsReindex: boolean;
}

export interface PreparedSameColumnReorder {
  columnId: string;
  movedCardId: string;
  sourceIndex: number;
  targetIndex: number;
  updatedCards: Card[];
  reindexed: boolean;
}

export interface PreparedCrossColumnMove {
  sourceColumnId: string;
  destinationColumnId: string;
  movedCardId: string;
  sourceIndex: number;
  targetIndex: number;
  sourceCards: Card[];
  destinationCards: Card[];
  reindexed: boolean;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCardDragData(value: unknown): value is CardDragData {
  return (
    isRecord(value) &&
    value.type === "card" &&
    typeof value.cardId === "string" &&
    typeof value.columnId === "string"
  );
}

export function isDropOnCardData(value: unknown): value is CardDropOnCardData {
  return (
    isRecord(value) &&
    value.type === "card" &&
    typeof value.cardId === "string" &&
    typeof value.columnId === "string"
  );
}

export function isDropOnColumnData(
  value: unknown
): value is CardDropOnColumnData {
  return (
    isRecord(value) &&
    value.type === "column" &&
    typeof value.columnId === "string"
  );
}
