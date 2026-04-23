"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/features/boards/types";
import type { CardDragData } from "@/features/dnd/types";

type SortableCardItemProps = {
  card: Card;
  disabled?: boolean;
  onEdit: (card: Card) => void;
};

export function SortableCardItem({
  card,
  disabled = false,
  onEdit,
}: SortableCardItemProps) {
  const dragData: CardDragData = {
    type: "card",
    cardId: card.id,
    columnId: card.columnId,
  };

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: card.id,
    data: dragData,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-[20px] border border-slate-200/80 bg-white p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:shadow-[0_16px_50px_rgba(15,23,42,0.10)] ${
        isDragging ? "opacity-60 shadow-[0_20px_60px_rgba(15,23,42,0.12)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onEdit(card)}
          className="flex-1 text-left"
        >
          <p className="text-base font-semibold tracking-tight text-slate-950">
            {card.title}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {card.description || "No description yet. Click to edit card details."}
          </p>
        </button>

        <button
          type="button"
          aria-label={`Drag ${card.title}`}
          className="touch-none rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">::</span>
        </button>
      </div>
    </div>
  );
}
