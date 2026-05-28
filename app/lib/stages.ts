import { STAGE_META, type DealStage } from "@/lib/constants";

export function formatStageChangeActivity(
  fromStage: DealStage | null,
  toStage: DealStage,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (!fromStage) {
    return t("stage-change-initial", {
      stage: t(STAGE_META[toStage].labelKey),
    });
  }

  return t("stage-change-from-to", {
    from: t(STAGE_META[fromStage].labelKey),
    to: t(STAGE_META[toStage].labelKey),
  });
}
