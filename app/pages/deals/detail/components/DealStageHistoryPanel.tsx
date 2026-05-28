import { useTranslation } from "react-i18next";
import { Badge, EmptyState, Icon, SectionPanel } from "@/components/ui";
import { ArrowRightOutlined } from "@/lib/icons";
import type { DealStageHistoryEntry } from "@/features/deals/types";
import { STAGE_META, type DealStage } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";

interface DealStageHistoryPanelProps {
  history: DealStageHistoryEntry[];
}

export function DealStageHistoryPanel({ history }: DealStageHistoryPanelProps) {
  const { t } = useTranslation();

  return (
    <SectionPanel titleKey="stage-history">
      {!history.length ? (
        <EmptyState messageKey="no-stage-history" className="py-8" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {history.map((entry) => (
            <li key={entry.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {entry.fromStage ? (
                  <>
                    <Badge variant="stage" stage={entry.fromStage as DealStage} />
                    <Icon
                      icon={ArrowRightOutlined}
                      size={14}
                      className="text-[var(--color-gray-400)]"
                    />
                    <Badge variant="stage" stage={entry.toStage as DealStage} />
                  </>
                ) : (
                  <span className="text-[13px] text-[var(--color-gray-700)]">
                    {t("stage-change-initial", {
                      stage: t(STAGE_META[entry.toStage].labelKey),
                    })}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[12px] text-[var(--color-gray-500)]">
                {entry.changedByName}
                {" · "}
                <time dateTime={entry.createdAt}>
                  {formatRelativeTime(entry.createdAt)}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
