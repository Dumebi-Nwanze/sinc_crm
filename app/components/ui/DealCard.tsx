import type { CSSProperties } from "react";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { DragAndDropOutlined } from "@/lib/icons";
import type { DealStage } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

export interface DealCardOwner {
  id: string;
  fullName: string;
}

export interface DealCardDragProps {
  setNodeRef?: (element: HTMLElement | null) => void;
  dragHandleListeners?: DraggableSyntheticListeners;
  dragHandleAttributes?: DraggableAttributes;
  transform?: Transform | null;
  isDragging?: boolean;
}

export interface DealCardProps {
  id: string;
  clientName: string;
  title: string;
  stage: DealStage;
  owner: DealCardOwner | null;
  valueAmount?: number;
  valueCurrency?: string;
  lostReason?: string | null;
  onClick?: () => void;
  drag?: DealCardDragProps;
  className?: string;
}

export function DealCard({
  id,
  clientName,
  title,
  stage,
  owner,
  valueAmount,
  valueCurrency,
  lostReason,
  onClick,
  drag,
  className,
}: DealCardProps) {
  const { t } = useTranslation();

  const style: CSSProperties | undefined = drag?.transform
    ? { transform: CSS.Translate.toString(drag.transform) }
    : undefined;

  const isInteractive = Boolean(onClick);

  return (
    <article
      ref={drag?.setNodeRef}
      style={style}
      data-deal-id={id}
      className={cn(
        "mb-2 rounded-md border border-[var(--color-gray-200)] bg-white p-3 shadow-sm transition-shadow duration-100",
        drag?.isDragging && "z-10 scale-[1.02] shadow-lg",
        isInteractive &&
          "cursor-pointer hover:border-[var(--color-gray-300)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <div className="flex items-start gap-2">
        {drag && (
          <button
            type="button"
            className={cn(
              "mt-0.5 flex shrink-0 touch-none items-center justify-center rounded p-1 text-[var(--color-gray-400)]",
              "hover:bg-[var(--color-gray-100)] hover:text-[var(--color-gray-600)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]",
              "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-0.5 hover:cursor-grab",
            )}
            aria-label={t("drag-deal")}
            onClick={(event) => event.stopPropagation()}
            {...drag.dragHandleAttributes}
            {...drag.dragHandleListeners}
          >
            <Icon icon={DragAndDropOutlined} size={14} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[var(--color-gray-900)]">
            {clientName}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-[var(--color-gray-500)]">
            {title}
          </p>

          <div className="mt-2">
            <Badge variant="stage" stage={stage} />
          </div>

          {stage === "lost" && lostReason?.trim() && (
            <p className="mt-2 line-clamp-2 text-[11px] text-[var(--color-gray-600)]">
              <span className="font-medium text-[var(--color-gray-700)]">
                {t("lost-reason")}:
              </span>{" "}
              {lostReason}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <Avatar
                size="sm"
                name={owner?.fullName ?? t("unassigned")}
                className="shrink-0"
              />
              <span className="truncate text-[12px] text-[var(--color-gray-600)]">
                {owner?.fullName ?? t("unassigned")}
              </span>
            </div>

            {valueAmount != null && (
              <Badge
                variant="neutral"
                className="shrink-0 normal-case tracking-normal"
              >
                {formatCurrency(valueAmount, valueCurrency ?? "USD")}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
