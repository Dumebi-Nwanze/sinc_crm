import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, EmptyState, LoadingState, SectionPanel } from "@/components/ui";
import type { ClientDealSummary } from "@/features/clients/types";
import type { DealStage } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface ClientDealsPanelProps {
  deals: ClientDealSummary[] | undefined;
  isLoading?: boolean;
}

export function ClientDealsPanel({ deals, isLoading }: ClientDealsPanelProps) {
  const { t } = useTranslation();

  return (
    <SectionPanel titleKey="deals">
      {isLoading ? (
        <LoadingState variant="inline" lines={4} className="px-4 py-3" />
      ) : !deals?.length ? (
        <EmptyState messageKey="no-deals" className="py-8" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {deals.map((deal) => (
            <li key={deal.id}>
              <Link
                to={`/deals/${deal.id}`}
                className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-[var(--color-gray-50)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--color-gray-900)]">
                    {deal.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--color-gray-500)]">
                    {deal.owner?.fullName ?? t("unassigned")}
                    {deal.valueAmount != null && (
                      <>
                        {" · "}
                        {formatCurrency(
                          deal.valueAmount,
                          deal.valueCurrency ?? "USD",
                        )}
                      </>
                    )}
                  </p>
                </div>
                <Badge variant="stage" stage={deal.stage as DealStage} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
