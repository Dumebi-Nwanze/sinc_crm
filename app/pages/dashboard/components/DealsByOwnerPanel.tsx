import { Avatar, EmptyState, SectionPanel } from "@/components/ui";
import type { DashboardStats } from "@/features/dashboard/api";

interface DealsByOwnerPanelProps {
  dealsByOwner: DashboardStats["dealsByOwner"];
}

export function DealsByOwnerPanel({ dealsByOwner }: DealsByOwnerPanelProps) {
  return (
    <SectionPanel titleKey="deals-by-owner">
      {!dealsByOwner.length ? (
        <EmptyState messageKey="no-deals" className="py-8" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {dealsByOwner.map((row, index) => (
            <li
              key={row.ownerId}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="w-5 shrink-0 text-[12px] font-medium text-[var(--color-gray-400)]">
                {index + 1}
              </span>
              <Avatar name={row.ownerName} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-gray-800)]">
                {row.ownerName || "—"}
              </span>
              <span className="text-[13px] font-semibold text-[var(--color-gray-900)]">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
