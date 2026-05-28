import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SectionPanelProps {
  titleKey: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionPanel({
  titleKey,
  action,
  children,
  className,
}: SectionPanelProps) {
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-white",
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-[var(--color-gray-100)] px-4 py-3.5">
        <h2 className="text-[14px] font-semibold text-[var(--color-gray-900)]">
          {t(titleKey)}
        </h2>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}
