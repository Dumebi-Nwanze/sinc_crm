import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui";
import type { ConversationListItem } from "@/features/conversations/types";
import type { ConversationStatus } from "@/lib/constants";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ThreadListItemProps {
  thread: ConversationListItem;
  isActive?: boolean;
}

export function ThreadListItem({ thread, isActive }: ThreadListItemProps) {
  const { t } = useTranslation();
  const hasUnread = (thread.unreadCount ?? 0) > 0;

  return (
    <li>
      <Link
        to={`/conversations/${thread.id}`}
        className={cn(
          "relative flex flex-col gap-1.5 px-4 py-3 transition-colors",
          isActive
            ? "bg-[var(--color-primary-50)]"
            : "hover:bg-[var(--color-gray-50)]",
        )}
      >
        {hasUnread && (
          <span
            className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--color-primary-600)]"
            aria-label={t("unread-messages")}
          />
        )}
        <div className="flex items-start justify-between gap-2 pr-4">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-[13px] font-medium",
              hasUnread
                ? "text-[var(--color-gray-900)]"
                : "text-[var(--color-gray-800)]",
            )}
          >
            {thread.subject}
          </p>
          <Badge variant="status" status={thread.status as ConversationStatus} />
        </div>
        {thread.clientName && (
          <p className="truncate text-[11px] text-[var(--color-gray-500)]">
            {thread.clientName}
          </p>
        )}
        <p className="line-clamp-2 text-[12px] text-[var(--color-gray-500)]">
          {thread.lastMessageSnippet?.trim() || t("no-messages-yet")}
        </p>
        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-gray-500)]">
          <span className="truncate">
            {thread.assignedTo?.fullName ?? t("unassigned")}
          </span>
          <time className="shrink-0 font-mono text-[10px]">
            {formatRelativeTime(thread.lastMessageAt)}
          </time>
        </div>
      </Link>
    </li>
  );
}
