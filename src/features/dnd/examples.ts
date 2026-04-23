import { MIN_POSITION_GAP } from "@/features/boards/mappers";
import type { Board, Card, Column } from "@/features/boards/types";
import {
  calculateNewPosition,
  prepareCrossColumnMove,
  prepareSameColumnReorder,
} from "./utils";

function assertExample(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function createCard(
  id: string,
  columnId: string,
  position: number,
  title = id
): Card {
  return {
    id,
    columnId,
    title,
    description: "",
    position,
    createdAt: "2026-04-23T00:00:00.000Z",
    updatedAt: "2026-04-23T00:00:00.000Z",
  };
}

function createColumn(
  id: string,
  cards: Card[],
  position = 1000,
  title = id
): Column {
  return {
    id,
    boardId: "board-1",
    title,
    position,
    createdAt: "2026-04-23T00:00:00.000Z",
    updatedAt: "2026-04-23T00:00:00.000Z",
    cards,
  };
}

function createBoard(columns: Column[]): Board {
  return {
    id: "board-1",
    title: "TaskFlow Board",
    createdAt: "2026-04-23T00:00:00.000Z",
    updatedAt: "2026-04-23T00:00:00.000Z",
    columns,
  };
}

export function getDndUtilityUsageExamples() {
  const emptyDestination = calculateNewPosition({
    destinationCards: [],
    targetIndex: 0,
  });

  const insertAtTop = calculateNewPosition({
    destinationCards: [{ position: 1000 }, { position: 2000 }],
    targetIndex: 0,
  });

  const insertInMiddle = calculateNewPosition({
    destinationCards: [{ position: 1000 }, { position: 2000 }],
    targetIndex: 1,
  });

  const insertAtBottom = calculateNewPosition({
    destinationCards: [{ position: 1000 }, { position: 2000 }],
    targetIndex: 2,
  });

  const sameColumnBoard = createBoard([
    createColumn("column-a", [
      createCard("card-a", "column-a", 1000, "Card A"),
      createCard("card-b", "column-a", 2000, "Card B"),
      createCard("card-c", "column-a", 3000, "Card C"),
    ]),
  ]);

  const sameColumnReorder = prepareSameColumnReorder(
    sameColumnBoard.columns[0],
    "card-a",
    2
  );

  const crossColumnBoard = createBoard([
    createColumn("column-a", [
      createCard("card-a", "column-a", 1000, "Card A"),
      createCard("card-b", "column-a", 2000, "Card B"),
    ]),
    createColumn(
      "column-b",
      [
        createCard("card-c", "column-b", 1000, "Card C"),
        createCard("card-d", "column-b", 2000, "Card D"),
      ],
      2000
    ),
  ]);

  const crossColumnMove = prepareCrossColumnMove(
    crossColumnBoard,
    "card-a",
    "column-a",
    "column-b",
    1
  );

  const densePositions = calculateNewPosition({
    destinationCards: [
      { position: 1000 },
      { position: 1000 + MIN_POSITION_GAP },
    ],
    targetIndex: 1,
  });

  return {
    emptyDestination,
    insertAtTop,
    insertInMiddle,
    insertAtBottom,
    sameColumnReorder,
    crossColumnMove,
    densePositions,
  };
}

export function assertDndUtilityExamples() {
  const examples = getDndUtilityUsageExamples();

  assertExample(
    examples.emptyDestination.position === 1000 &&
      !examples.emptyDestination.needsReindex,
    "Empty destination should use the default first position."
  );
  assertExample(
    examples.insertAtTop.position === 500 &&
      !examples.insertAtTop.needsReindex,
    "Top insertion should halve the first position when safe."
  );
  assertExample(
    examples.insertInMiddle.position === 1500 &&
      !examples.insertInMiddle.needsReindex,
    "Middle insertion should use the midpoint."
  );
  assertExample(
    examples.insertAtBottom.position === 3000 &&
      !examples.insertAtBottom.needsReindex,
    "Bottom insertion should append with the default gap."
  );
  assertExample(
    examples.sameColumnReorder?.updatedCards.map((card) => card.id).join(",") ===
      "card-b,card-c,card-a",
    "Same-column reorder should prepare the moved card at the new slot."
  );
  assertExample(
    examples.crossColumnMove?.destinationCards
      .map((card) => `${card.id}:${card.columnId}:${card.position}`)
      .join(",") === "card-c:column-b:1000,card-a:column-b:1500,card-d:column-b:2000",
    "Cross-column move should prepare the destination order and position."
  );
  assertExample(
    examples.densePositions.needsReindex,
    "Dense adjacent positions should recommend reindexing."
  );

  return examples;
}
