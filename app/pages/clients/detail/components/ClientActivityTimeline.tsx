import { useTranslation } from "react-i18next";
import { EmptyState, Icon, LoadingState, SectionPanel } from "@/components/ui";
import type { ClientActivityItem } from "@/features/clients/types";
import {
  CommentsOutlined,
  PencilOutlined,
  ReloadOutlined,
} from "@/lib/icons";
import { formatStageChangeActivity } from "@/lib/stages";
import { formatRelativeTime } from "@/lib/utils";

interface ClientActivityTimelineProps {
  activity: ClientActivityItem[] | undefined;
  isLoading?: boolean;
}

function activityIcon(type: ClientActivityItem["type"]) {
  switch (type) {
    case "stage_change":
      return ReloadOutlined;
    case "note":
      return PencilOutlined;
    case "message":
      return CommentsOutlined;
  }
}

function activityText(
  item: ClientActivityItem,
  t: (key: string, options?: Record<string, string>) => string,
) {
  if (item.type === "stage_change") {
    return formatStageChangeActivity(item.fromStage, item.toStage, t);
  }
  return item.text;
}

export function ClientActivityTimeline({
  activity,
  isLoading,
}: ClientActivityTimelineProps) {
  const { t } = useTranslation();

  return (
    <SectionPanel titleKey="client-activity">
      {isLoading ? (
        <LoadingState variant="inline" lines={5} className="px-4 py-3" />
      ) : !activity?.length ? (
        <EmptyState messageKey="no-activity" className="py-8" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 px-4 py-3"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--color-gray-100)]">
                <Icon
                  icon={activityIcon(item.type)}
                  size={14}
                  className="text-[var(--color-gray-600)]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[var(--color-gray-800)]">
                  {activityText(item, t)}
                </p>
                <p className="mt-1 text-[12px] text-[var(--color-gray-500)]">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
