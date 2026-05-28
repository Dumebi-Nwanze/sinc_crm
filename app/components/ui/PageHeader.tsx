import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  titleKey?: string;
  title?: string;
  subtitleKey?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  titleKey,
  title,
  subtitleKey,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const heading = title ?? (titleKey ? t(titleKey) : "");

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-gray-900)]">
          {heading}
        </h1>
        {subtitleKey && (
          <p className="mt-1 text-[13px] font-light text-[var(--color-gray-500)]">
            {t(subtitleKey)}
          </p>
        )}
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
