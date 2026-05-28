import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import type { ConversationListItem } from "@/features/conversations/types";
import type { ConversationListFilterTab } from "@/features/conversations/types";
import type { AppRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ThreadListItem } from "./ThreadListItem";

interface ThreadQueueProps {
  threads: ConversationListItem[] | undefined;
  activeThreadId?: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  filterTab: ConversationListFilterTab;
  onFilterTabChange: (tab: ConversationListFilterTab) => void;
  role: AppRole | null;
}

function visibleTabs(role: AppRole | null): ConversationListFilterTab[] {
  if (role === "manager") return ["unassigned", "mine", "all"];
  if (role === "sales") return ["unassigned", "mine"];
  return [];
}

const TAB_LABEL_KEYS: Record<ConversationListFilterTab, string> = {
  unassigned: "unassigned",
  mine: "mine",
  all: "all",
};

export function ThreadQueue({
  threads,
  activeThreadId,
  isLoading,
  isError,
  onRetry,
  filterTab,
  onFilterTabChange,
  role,
}: ThreadQueueProps) {
  const { t } = useTranslation();
  const tabs = visibleTabs(role);

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-[var(--color-gray-200)] bg-white">
      {tabs.length > 0 && (
        <div
          className="flex shrink-0 border-b border-[var(--color-gray-200)]"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={filterTab === tab}
              onClick={() => onFilterTabChange(tab)}
              className={cn(
                "flex-1 px-3 py-2.5 text-[12px] font-medium transition-colors",
                filterTab === tab
                  ? "border-b-2 border-[var(--color-primary-800)] text-[var(--color-primary-800)]"
                  : "text-[var(--color-gray-500)] hover:text-[var(--color-gray-800)]",
              )}
            >
              {t(TAB_LABEL_KEYS[tab])}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingState variant="inline" lines={6} className="p-4" />
        ) : isError ? (
          <ErrorState
            messageKey="error-generic"
            onRetry={onRetry}
            className="py-8"
          />
        ) : !threads?.length ? (
          <EmptyState messageKey="no-conversations" className="py-10" />
        ) : (
          <ul className="divide-y divide-[var(--color-gray-100)]">
            {threads.map((thread) => (
              <ThreadListItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeThreadId}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
