import { useDroppable } from "@dnd-kit/core";
import { PipelineColumn } from "@/components/ui";
import type { DealListItem } from "@/features/deals/types";
import type { DealStage } from "@/lib/constants";
import { DraggableDealCard } from "./DraggableDealCard";

interface PipelineStageColumnProps {
  stage: DealStage;
  deals: DealListItem[];
  isTerminal?: boolean;
  onDealClick: (dealId: string) => void;
}

export function PipelineStageColumn({
  stage,
  deals,
  isTerminal,
  onDealClick,
}: PipelineStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: "column", stage },
  });

  return (
    <PipelineColumn
      stage={stage}
      deals={deals}
      count={deals.length}
      isTerminal={isTerminal}
      droppable={{ setNodeRef, isOver }}
    >
      {deals.map((deal) => (
        <DraggableDealCard
          key={deal.id}
          deal={deal}
          onClick={() => onDealClick(deal.id)}
        />
      ))}
    </PipelineColumn>
  );
}
