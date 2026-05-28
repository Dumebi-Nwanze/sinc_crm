import { Badge, EmptyState, SectionPanel } from "@/components/ui";
import type { DashboardStats } from "@/features/dashboard/api";
import { PIPELINE_STAGES } from "@/lib/constants";

interface DealsByStagePanelProps {
  dealsByStage: DashboardStats["dealsByStage"];
}

export function DealsByStagePanel({ dealsByStage }: DealsByStagePanelProps) {
  const rows = PIPELINE_STAGES.map((stage) => {
    const match = dealsByStage.find((row) => row.stage === stage);
    return { stage, count: match?.count ?? 0 };
  }).filter((row) => row.count > 0);

  const totalDeals = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <SectionPanel titleKey="deals-by-stage">
      {totalDeals === 0 ? (
        <EmptyState messageKey="no-deals" className="py-6" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {rows.map((row) => (
            <li
              key={row.stage}
              className="flex items-center justify-between gap-3 px-4 py-2"
            >
              <Badge variant="stage" stage={row.stage} className="shrink-0" />
              <span className="text-[13px] font-medium tabular-nums text-[var(--color-gray-800)]">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
