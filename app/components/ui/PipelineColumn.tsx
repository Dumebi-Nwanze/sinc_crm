import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { STAGE_META, type DealStage } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface PipelineColumnDeal {
  id: string;
}

export interface PipelineColumnDroppableProps {
  setNodeRef?: (element: HTMLElement | null) => void;
  isOver?: boolean;
}

export interface PipelineColumnProps {
  stage: DealStage;
  deals: PipelineColumnDeal[];
  count: number;
  isTerminal?: boolean;
  children: ReactNode;
  droppable?: PipelineColumnDroppableProps;
  className?: string;
}

export function PipelineColumn({
  stage,
  deals,
  count,
  isTerminal = false,
  children,
  droppable,
  className,
}: PipelineColumnProps) {
  const { t } = useTranslation();
  const meta = STAGE_META[stage];

  return (
    <section
      className={cn(
        "flex w-[320px] shrink-0 flex-col rounded-md bg-[var(--color-gray-50)] px-2 py-3",
        "min-h-[100px]",
        className,
      )}
      aria-label={t(meta.labelKey)}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-2 px-1 pb-2",
          isTerminal && "opacity-70",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon
            icon={meta.icon}
            size={14}
            className={cn(
              "shrink-0",
              isTerminal
                ? "text-[var(--color-gray-400)]"
                : "text-[var(--color-gray-500)]",
            )}
          />
          <h3
            className={cn(
              "truncate text-[13px] font-semibold",
              isTerminal
                ? "text-[var(--color-gray-400)]"
                : "text-[var(--color-gray-800)]",
            )}
          >
            {t(meta.labelKey)}
          </h3>
        </div>
        <Badge variant="count" count={count} />
      </header>

      <div
        ref={droppable?.setNodeRef}
        data-stage={stage}
        data-deal-count={deals.length}
        className={cn(
          "flex min-h-[100px] flex-1 flex-col overflow-y-auto rounded-sm px-1 pb-1",
          "transition-colors duration-150",
          droppable?.isOver &&
            "border border-dashed border-[var(--color-primary-300)] bg-[var(--color-primary-50)]",
        )}
      >
        {children}
      </div>
    </section>
  );
}
