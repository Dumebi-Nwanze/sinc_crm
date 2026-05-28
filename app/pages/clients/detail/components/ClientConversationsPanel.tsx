import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, EmptyState, LoadingState, SectionPanel } from "@/components/ui";
import type { ClientConversationSummary } from "@/features/clients/types";
import type { ConversationStatus } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";

interface ClientConversationsPanelProps {
  conversations: ClientConversationSummary[] | undefined;
  isLoading?: boolean;
}

export function ClientConversationsPanel({
  conversations,
  isLoading,
}: ClientConversationsPanelProps) {
  const { t } = useTranslation();

  return (
    <SectionPanel titleKey="conversations">
      {isLoading ? (
        <LoadingState variant="inline" lines={4} className="px-4 py-3" />
      ) : !conversations?.length ? (
        <EmptyState messageKey="no-conversations" className="py-8" />
      ) : (
        <ul className="divide-y divide-[var(--color-gray-100)]">
          {conversations.map((thread) => (
            <li key={thread.id}>
              <Link
                to={`/conversations/${thread.id}`}
                className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-[var(--color-gray-50)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--color-gray-900)]">
                    {thread.subject}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--color-gray-500)]">
                    {thread.assignedTo?.fullName ?? t("conversation-unassigned")}
                    {" · "}
                    {formatRelativeTime(thread.lastMessageAt)}
                  </p>
                </div>
                <Badge
                  variant="status"
                  status={thread.status as ConversationStatus}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
