import { useDraggable } from "@dnd-kit/core";
import { DealCard } from "@/components/ui";
import type { DealListItem } from "@/features/deals/types";

interface DraggableDealCardProps {
  deal: DealListItem;
  onClick: () => void;
}

export function DraggableDealCard({ deal, onClick }: DraggableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: deal.id,
    data: { type: "deal", deal },
  });

  return (
    <DealCard
      id={deal.id}
      clientName={deal.clientName}
      title={deal.title}
      stage={deal.stage}
      owner={deal.owner}
      valueAmount={deal.valueAmount ?? undefined}
      valueCurrency={deal.valueCurrency ?? undefined}
      lostReason={deal.lostReason}
      onClick={onClick}
      drag={{
        setNodeRef,
        dragHandleListeners: listeners,
        dragHandleAttributes: attributes,
        transform,
        isDragging,
      }}
    />
  );
}
