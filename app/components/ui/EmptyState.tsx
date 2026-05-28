import type { IconData } from "@lineiconshq/free-icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: IconData;
  titleKey?: string;
  messageKey?: string;
  actionLabelKey?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  titleKey = "empty-title",
  messageKey = "no-results",
  actionLabelKey,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <Icon icon={icon} size={32} className="mb-3 text-[var(--color-gray-300)]" />
      )}
      <h3 className="text-[14px] font-semibold text-[var(--color-gray-700)]">
        {t(titleKey)}
      </h3>
      <p className="mt-1 max-w-[280px] text-[13px] text-[var(--color-gray-500)]">
        {t(messageKey)}
      </p>
      {children}
      {actionLabelKey && onAction && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onAction}>
          {t(actionLabelKey)}
        </Button>
      )}
    </div>
  );
}
