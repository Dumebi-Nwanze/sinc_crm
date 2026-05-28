import type { IconData } from "@lineiconshq/free-icons";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: IconData;
  labelKey: string;
  value: number | string;
  trend?: number;
  className?: string;
}

export function StatCard({
  icon,
  labelKey,
  value,
  trend,
  className,
}: StatCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "rounded-md border border-[var(--color-gray-200)] bg-white p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
          <Icon
            icon={icon}
            size={20}
            className="text-[var(--color-primary-500)]"
          />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "text-[12px] font-medium",
              trend >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]",
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-[28px] font-semibold text-[var(--color-gray-900)]">
        {value}
      </p>
      <p className="mt-1 text-[13px] text-[var(--color-gray-500)]">
        {t(labelKey)}
      </p>
    </div>
  );
}
