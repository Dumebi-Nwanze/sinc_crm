import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  CONVERSATION_STATUS_META,
  STAGE_META,
  type ConversationStatus,
  type DealStage,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type BadgeVariant = "stage" | "status" | "count" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  stage?: DealStage;
  status?: ConversationStatus;
  count?: number;
  children?: ReactNode;
  labelKey?: string;
  className?: string;
}

export function Badge({
  variant = "neutral",
  stage,
  status,
  count,
  children,
  labelKey,
  className,
}: BadgeProps) {
  const { t } = useTranslation();

  if (variant === "count" && count !== undefined) {
    return (
      <span
        className={cn(
          "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary-800)] px-1 text-[10px] font-medium text-white",
          className,
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  let style: { color: string; bg: string } = {
    color: "var(--color-gray-600)",
    bg: "var(--color-gray-100)",
  };
  let label = children;

  if (variant === "stage" && stage) {
    const meta = STAGE_META[stage];
    style = { color: meta.color, bg: meta.bg };
    label = t(meta.labelKey);
  } else if (variant === "status" && status) {
    const meta = CONVERSATION_STATUS_META[status];
    style = { color: meta.color, bg: meta.bg };
    label = t(meta.labelKey);
  } else if (labelKey) {
    label = t(labelKey);
  }

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-[2px] px-2 text-[11px] font-medium uppercase tracking-wide",
        className,
      )}
      style={{ color: style.color, backgroundColor: style.bg }}
    >
      {label}
    </span>
  );
}
