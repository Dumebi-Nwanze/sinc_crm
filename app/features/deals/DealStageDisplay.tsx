import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui";
import {
  CLIENT_STAGE_LABELS,
  STAGE_META,
  type AppRole,
  type DealStage,
} from "@/lib/constants";

interface DealStageDisplayProps {
  stage: DealStage;
  role: AppRole | null;
  className?: string;
}

/**
 * Renders internal stage badges for staff; plain-language labels for clients.
 */
export function DealStageDisplay({ stage, role, className }: DealStageDisplayProps) {
  const { t } = useTranslation();

  if (role === "client") {
    return (
      <span
        className={`text-[13px] font-medium text-[var(--color-gray-800)] ${className ?? ""}`}
      >
        {t(CLIENT_STAGE_LABELS[stage])}
      </span>
    );
  }

  return <Badge variant="stage" stage={stage} className={className} />;
}

export function getStageLabel(
  stage: DealStage,
  role: AppRole | null,
  t: (key: string) => string,
): string {
  if (role === "client") {
    return t(CLIENT_STAGE_LABELS[stage]);
  }
  return t(STAGE_META[stage].labelKey);
}
