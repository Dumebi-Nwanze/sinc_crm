import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Avatar, Badge } from "@/components/ui";
import type { DealDetail } from "@/features/deals/types";
import { PIPELINE_STAGES, STAGE_META, type DealStage } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface DealMetadataProps {
  deal: DealDetail;
}

export function DealMetadata({ deal }: DealMetadataProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 rounded-md border border-[var(--color-gray-200)] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-gray-500)]">
          {t("client")}
        </p>
        <Link
          to={`/clients/${deal.client.id}`}
          className="mt-1 block text-[13px] font-medium text-[var(--color-primary-800)] hover:underline"
        >
          {deal.client.fullName}
        </Link>
        <p className="text-[12px] text-[var(--color-gray-500)]">
          {deal.client.email}
        </p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-gray-500)]">
          {t("deal-owner")}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Avatar
            size="sm"
            name={deal.owner?.fullName ?? t("unassigned")}
          />
          <span className="text-[13px] text-[var(--color-gray-800)]">
            {deal.owner?.fullName ?? t("unassigned")}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-gray-500)]">
          {t("value")}
        </p>
        <p className="mt-1 text-[13px] font-medium text-[var(--color-gray-900)]">
          {deal.valueAmount != null
            ? formatCurrency(deal.valueAmount, deal.valueCurrency ?? "USD")
            : t("optional")}
        </p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-gray-500)]">
          {t("expected-intake")}
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-gray-800)]">
          {deal.expectedIntake ?? "—"}
        </p>
      </div>

      <div className="sm:col-span-2 lg:col-span-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-gray-500)]">
          {t("stage")}
        </p>
        <div className="mt-1">
          <Badge variant="stage" stage={deal.stage as DealStage} />
        </div>
      </div>

      {deal.stage === "lost" && deal.lostReason?.trim() && (
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-gray-500)]">
            {t("lost-reason")}
          </p>
          <p className="mt-1 text-[13px] text-[var(--color-gray-800)]">
            {deal.lostReason}
          </p>
        </div>
      )}
    </div>
  );
}

export function stageOptions(t: (key: string) => string) {
  return PIPELINE_STAGES.map((stage) => ({
    value: stage,
    label: t(STAGE_META[stage].labelKey),
  }));
}
