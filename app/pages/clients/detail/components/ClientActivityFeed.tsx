import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { EmptyState, LoadingState, SectionPanel } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { ClientActivityItem } from "@/features/clients/types";
import {
  CommentsOutlined,
  FilesOutlined,
  PencilOutlined,
} from "@/lib/icons";
import { formatStageChangeActivity } from "@/lib/stages";

interface ClientActivityFeedProps {
  activity: ClientActivityItem[] | undefined;
  isLoading?: boolean;
}

function activityIcon(type: ClientActivityItem["type"]) {
  switch (type) {
    case "message":
      return CommentsOutlined;
    case "note":
      return PencilOutlined;
    case "stage_change":
      return FilesOutlined;
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

export function ClientActivityFeed({ activity, isLoading }: ClientActivityFeedProps) {
  const { t } = useTranslation();

  return (
    <SectionPanel titleKey="client-activity">
      {isLoading ? (
        <LoadingState variant="inline" lines={4} className="p-4" />
      ) : !activity?.length ? (
        <EmptyState messageKey="no-activity" className="py-8" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {activity.map((item) => (
            <li key={item.id} className="flex gap-3 px-4 py-3">
              <Icon
                icon={activityIcon(item.type)}
                size={16}
                className="mt-0.5 shrink-0 text-[var(--color-gray-400)]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[var(--color-gray-800)] line-clamp-2">
                  {activityText(item, t)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--color-gray-500)]">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
