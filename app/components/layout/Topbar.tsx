import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { SearchOutlined } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface TopbarProps {
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  onSearchClick?: () => void;
  className?: string;
}

export function Topbar({
  breadcrumb,
  actions,
  onSearchClick,
  className,
}: TopbarProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-[var(--topbar-height)] items-center gap-4 border-b border-[var(--color-gray-200)] bg-white px-4 md:px-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1 lg:hidden">
        <span className="text-[15px] font-semibold text-[var(--color-primary-800)]">
          SINC CRM
        </span>
      </div>
      {breadcrumb && (
        <div className="hidden min-w-0 flex-1 text-[13px] text-[var(--color-gray-600)] lg:block">
          {breadcrumb}
        </div>
      )}

      <button
        type="button"
        onClick={onSearchClick}
        className="hidden h-9 w-[280px] items-center gap-2 rounded-md bg-[var(--color-gray-100)] px-3 text-left text-[13px] text-[var(--color-gray-500)] hover:bg-[var(--color-gray-200)] md:flex"
      >
        <Icon icon={SearchOutlined} size={16} />
        <span>{t("search-placeholder")}</span>
        <kbd className="ml-auto rounded border border-[var(--color-gray-200)] bg-white px-1.5 py-0.5 text-[10px] text-[var(--color-gray-400)]">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onSearchClick}
        className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-[var(--color-gray-100)] md:hidden"
        aria-label={t("search")}
      >
        <Icon icon={SearchOutlined} size={16} />
      </button>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
