import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  headerKey: string;
  cell: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
  isLoading?: boolean;
  emptyMessageKey?: string;
  mobileCard?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  getRowClassName,
  isLoading = false,
  emptyMessageKey = "no-results",
  mobileCard,
  className,
}: DataTableProps<T>) {
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingState variant="table" className={className} />;
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-white",
          className,
        )}
      >
        <EmptyState messageKey={emptyMessageKey} />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "hidden overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-white md:block",
          className,
        )}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "h-10 px-4 text-left text-[12px] font-semibold uppercase tracking-wide text-[var(--color-gray-500)]",
                    col.className,
                  )}
                >
                  {t(col.headerKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-[var(--color-gray-100)] last:border-0",
                  onRowClick && "cursor-pointer hover:bg-[var(--color-gray-50)]",
                  getRowClassName?.(row),
                )}
              >
                {columns.map((col, idx) => (
                  <td
                    key={col.key}
                    className={cn(
                      "h-11 px-4 text-[13px] text-[var(--color-gray-800)]",
                      idx === 0 && "font-medium text-[var(--color-gray-900)]",
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {data.map((row) =>
          mobileCard ? (
            <div key={keyExtractor(row)}>{mobileCard(row)}</div>
          ) : (
            <button
              key={keyExtractor(row)}
              type="button"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className="rounded-md border border-[var(--color-gray-200)] bg-white p-4 text-left"
            >
              {columns
                .filter((c) => !c.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex justify-between gap-2 py-1">
                    <span className="text-[12px] text-[var(--color-gray-500)]">
                      {t(col.headerKey)}
                    </span>
                    <span className="text-[13px] text-[var(--color-gray-800)]">
                      {col.cell(row)}
                    </span>
                  </div>
                ))}
            </button>
          ),
        )}
      </div>
    </>
  );
}
