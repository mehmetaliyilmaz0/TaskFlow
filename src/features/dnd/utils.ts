import {
  DEFAULT_POSITION_GAP,
  MIN_POSITION_GAP,
} from "@/features/boards/mappers";
import type { Board, Card, Column } from "@/features/boards/types";
import type {
  CalculateNewPositionParams,
  CalculateNewPositionResult,
  CardLocation,
  ColumnLocation,
  PreparedCrossColumnMove,
  PreparedSameColumnReorder,
} from "./types";

const POSITION_SCALE = 6;

function cloneCard(card: Card): Card {
  return { ...card };
}

function roundToPositionScale(value: number): number {
  return Number(value.toFixed(POSITION_SCALE));
}

function normalizeInsertionIndex(targetIndex: number, itemCount: number): number {
  const normalizedIndex = Number.isFinite(targetIndex)
    ? Math.trunc(targetIndex)
    : 0;

  return Math.max(0, Math.min(normalizedIndex, itemCount));
}

export function findColumn(board: Board, columnId: string): ColumnLocation | null {
  const columnIndex = board.columns.findIndex((column) => column.id === columnId);

  if (columnIndex === -1) {
    return null;
  }

  return {
    column: board.columns[columnIndex],
    columnIndex,
  };
}

export function findCard(board: Board, cardId: string): CardLocation | null {
  for (let columnIndex = 0; columnIndex < board.columns.length; columnIndex += 1) {
    const column = board.columns[columnIndex];
    const cardIndex = column.cards.findIndex((card) => card.id === cardId);

    if (cardIndex !== -1) {
      return {
        card: column.cards[cardIndex],
        column,
        columnIndex,
        cardIndex,
      };
    }
  }

  return null;
}

export function removeCardFromColumn(column: Column, cardId: string): Card[] {
  return column.cards
    .filter((card) => card.id !== cardId)
    .map((card) => cloneCard(card));
}

export function insertCardIntoColumn(
  cards: Card[],
  card: Card,
  targetIndex: number
): Card[] {
  const nextCards = cards.map((currentCard) => cloneCard(currentCard));
  const insertionIndex = normalizeInsertionIndex(targetIndex, nextCards.length);

  nextCards.splice(insertionIndex, 0, cloneCard(card));

  return nextCards;
}

export function calculateNewPosition({
  destinationCards,
  targetIndex,
}: CalculateNewPositionParams): CalculateNewPositionResult {
  const insertionIndex = normalizeInsertionIndex(targetIndex, destinationCards.length);

  if (destinationCards.length === 0) {
    return {
      position: DEFAULT_POSITION_GAP,
      needsReindex: false,
    };
  }

  if (insertionIndex === 0) {
    const next = destinationCards[0];
    const candidate = roundToPositionScale(next.position / 2);
    const gapToNext = Math.abs(next.position - candidate);

    return {
      position: candidate,
      needsReindex:
        candidate <= 0 ||
        gapToNext <= MIN_POSITION_GAP ||
        candidate >= roundToPositionScale(next.position),
    };
  }

  if (insertionIndex === destinationCards.length) {
    const previous = destinationCards[destinationCards.length - 1];

    return {
      position: roundToPositionScale(previous.position + DEFAULT_POSITION_GAP),
      needsReindex: false,
    };
  }

  const previous = destinationCards[insertionIndex - 1];
  const next = destinationCards[insertionIndex];
  const gap = Math.abs(next.position - previous.position);
  const midpoint = roundToPositionScale((previous.position + next.position) / 2);
  const roundedPrevious = roundToPositionScale(previous.position);
  const roundedNext = roundToPositionScale(next.position);

  return {
    position: midpoint,
    needsReindex:
      gap <= MIN_POSITION_GAP ||
      midpoint <= roundedPrevious ||
      midpoint >= roundedNext,
  };
}

export function reindexPositions(cards: Card[]): Card[] {
  return cards.map((card, index) => ({
    ...card,
    position: (index + 1) * DEFAULT_POSITION_GAP,
  }));
}

export function prepareSameColumnReorder(
  column: Column,
  activeCardId: string,
  targetIndex: number
): PreparedSameColumnReorder | null {
  const sourceIndex = column.cards.findIndex((card) => card.id === activeCardId);

  if (sourceIndex === -1) {
    return null;
  }

  const cardsWithoutMoved = removeCardFromColumn(column, activeCardId);
  const insertionIndex = normalizeInsertionIndex(targetIndex, cardsWithoutMoved.length);

  if (sourceIndex === insertionIndex) {
    return null;
  }

  const movedCard = cloneCard(column.cards[sourceIndex]);
  const { position, needsReindex } = calculateNewPosition({
    destinationCards: cardsWithoutMoved,
    targetIndex: insertionIndex,
  });

  const updatedCards = insertCardIntoColumn(
    cardsWithoutMoved,
    {
      ...movedCard,
      position,
    },
    insertionIndex
  );

  return {
    columnId: column.id,
    movedCardId: movedCard.id,
    sourceIndex,
    targetIndex: insertionIndex,
    updatedCards: needsReindex ? reindexPositions(updatedCards) : updatedCards,
    reindexed: needsReindex,
  };
}

export function prepareCrossColumnMove(
  board: Board,
  activeCardId: string,
  sourceColumnId: string,
  destinationColumnId: string,
  targetIndex: number
): PreparedCrossColumnMove | null {
  if (sourceColumnId === destinationColumnId) {
    return null;
  }

  const sourceColumnLocation = findColumn(board, sourceColumnId);
  const destinationColumnLocation = findColumn(board, destinationColumnId);

  if (!sourceColumnLocation || !destinationColumnLocation) {
    return null;
  }

  const sourceIndex = sourceColumnLocation.column.cards.findIndex(
    (card) => card.id === activeCardId
  );

  if (sourceIndex === -1) {
    return null;
  }

  const sourceCards = removeCardFromColumn(sourceColumnLocation.column, activeCardId);
  const movedCard = cloneCard(sourceColumnLocation.column.cards[sourceIndex]);
  const insertionIndex = normalizeInsertionIndex(
    targetIndex,
    destinationColumnLocation.column.cards.length
  );
  const { position, needsReindex } = calculateNewPosition({
    destinationCards: destinationColumnLocation.column.cards,
    targetIndex: insertionIndex,
  });
  const destinationCards = insertCardIntoColumn(
    destinationColumnLocation.column.cards,
    {
      ...movedCard,
      columnId: destinationColumnId,
      position,
    },
    insertionIndex
  );

  return {
    sourceColumnId,
    destinationColumnId,
    movedCardId: movedCard.id,
    sourceIndex,
    targetIndex: insertionIndex,
    sourceCards,
    destinationCards: needsReindex
      ? reindexPositions(destinationCards)
      : destinationCards,
    reindexed: needsReindex,
  };
}
