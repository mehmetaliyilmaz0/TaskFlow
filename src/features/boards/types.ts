export type UUID = string;
export type ISODateString = string;
export type Position = string;

export interface BoardRow {
  id: UUID;
  user_id: UUID;
  title: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ColumnRow {
  id: UUID;
  board_id: UUID;
  title: string;
  position: Position;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CardRow {
  id: UUID;
  column_id: UUID;
  title: string;
  description: string;
  position: Position;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateBoardInput {
  title: string;
}

export interface CreateColumnInput {
  boardId: UUID;
  title: string;
  position: Position;
}

export interface CreateCardInput {
  columnId: UUID;
  title: string;
  description?: string;
  position: Position;
}

export interface UpdateBoardInput {
  title?: string;
}

export interface UpdateColumnInput {
  title?: string;
  position?: Position;
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  columnId?: UUID;
  position?: Position;
}

export interface Card {
  id: UUID;
  columnId: UUID;
  title: string;
  description: string;
  position: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Column {
  id: UUID;
  boardId: UUID;
  title: string;
  position: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  cards: Card[];
}

export interface Board {
  id: UUID;
  title: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  columns: Column[];
}
