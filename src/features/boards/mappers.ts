import type {
  Board,
  BoardRow,
  Card,
  CardRow,
  Column,
  ColumnRow,
} from "./types";

export const DEFAULT_POSITION_GAP = 1000;
export const MIN_POSITION_GAP = 0.000001;

export function parsePosition(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid position value: ${value}`);
  }

  return parsed;
}

export function mapCardRow(row: CardRow): Card {
  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    position: parsePosition(row.position),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapColumnRow(row: ColumnRow, cards: Card[] = []): Column {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    position: parsePosition(row.position),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cards,
  };
}

export function mapBoardRow(row: BoardRow, columns: Column[] = []): Board {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    columns,
  };
}

export function assembleBoardData(
  boardRow: BoardRow,
  columnRows: ColumnRow[],
  cardRows: CardRow[]
): Board {
  const cardsByColumnId = new Map<string, Card[]>();

  for (const cardRow of cardRows) {
    const card = mapCardRow(cardRow);
    const currentCards = cardsByColumnId.get(card.columnId) ?? [];

    currentCards.push(card);
    cardsByColumnId.set(card.columnId, currentCards);
  }

  for (const cards of cardsByColumnId.values()) {
    cards.sort((left, right) => left.position - right.position);
  }

  const columns = columnRows
    .map((columnRow) =>
      mapColumnRow(columnRow, cardsByColumnId.get(columnRow.id) ?? [])
    )
    .sort((left, right) => left.position - right.position);

  return mapBoardRow(boardRow, columns);
}
