import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import {
  filtersForTab,
  useConversation,
  useConversations,
  useCreateConversation,
  useSendMessage,
} from "@/features/conversations/api";
import { NewConversationDialog } from "@/features/conversations/NewConversationDialog";
import { useConversationListRealtime } from "@/features/conversations/useConversationListRealtime";
import { useThreadRealtime } from "@/features/conversations/useThreadRealtime";
import type { ConversationListFilterTab } from "@/features/conversations/types";
import { useAuth } from "@/features/auth/useAuth";
import type { AppRole } from "@/lib/constants";
import { MessageThread } from "./components/MessageThread";
import { ReplyComposer } from "./components/ReplyComposer";
import { ThreadQueue } from "./components/ThreadQueue";

function defaultFilterTab(role: AppRole | null): ConversationListFilterTab {
  if (role === "manager") return "all";
  if (role === "sales") return "unassigned";
  return "mine";
}

interface ConversationsInboxProps {
  activeThreadId?: string;
}

export function ConversationsInbox({ activeThreadId }: ConversationsInboxProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, profile } = useAuth();
  const [filterTab, setFilterTab] = useState<ConversationListFilterTab>(() =>
    defaultFilterTab(role),
  );
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  useEffect(() => {
    setFilterTab(defaultFilterTab(role));
  }, [role]);

  const listFilters = useMemo(
    () => (role === "client" ? {} : filtersForTab(filterTab)),
    [role, filterTab],
  );

  const {
    data: threads,
    isLoading: listLoading,
    isError: listError,
    refetch: refetchList,
  } = useConversations(listFilters);

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    refetch: refetchDetail,
  } = useConversation(activeThreadId);

  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  useConversationListRealtime();
  useThreadRealtime(activeThreadId);

  const threadStatus = detail?.thread.status;
  const composerDisabled = threadStatus === "closed";

  async function handleCreate(input: {
    subject: string;
    body: string;
    clientId?: string;
  }) {
    try {
      const result = await createConversation.mutateAsync(input);
      toast.success(t("conversation-created"));
      setNewDialogOpen(false);
      navigate(`/conversations/${result.id}`);
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  async function handleSend(body: string) {
    if (!activeThreadId) return;
    try {
      await sendMessage.mutateAsync({
        threadId: activeThreadId,
        body,
        senderName: profile?.fullName,
        senderType: role === "client" ? "client" : "team",
      });
    } catch (err) {
      toast.error(t(err instanceof Error ? err.message : "error-generic"));
    }
  }

  return (
    <>
      <PageHeader
        titleKey="nav-conversations"
        subtitleKey="conversations-subtitle"
        actions={
          role === "client" ? (
            <Button size="sm" onClick={() => setNewDialogOpen(true)}>
              {t("new-chat")}
            </Button>
          ) : undefined
        }
      />

      <div className="-mx-4 flex h-[calc(100vh-12rem)] min-h-[480px] flex-col overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-white md:-mx-0 md:h-[calc(100vh-11rem)] lg:flex-row">
        <aside className="flex h-[40%] min-h-0 shrink-0 flex-col lg:h-full lg:w-[min(100%,320px)] lg:max-w-[360px]">
          <ThreadQueue
            threads={threads}
            activeThreadId={activeThreadId}
            isLoading={listLoading}
            isError={listError}
            onRetry={() => void refetchList()}
            filterTab={filterTab}
            onFilterTabChange={setFilterTab}
            role={role}
          />
        </aside>

        <section className="flex min-h-0 flex-1 flex-col border-t border-[var(--color-gray-200)] lg:border-t-0">
          {!activeThreadId ? (
            <EmptyState
              messageKey="select-conversation"
              className="h-full justify-center"
            />
          ) : (
            <>
              <div className="min-h-0 flex-1">
                <MessageThread
                  threadId={activeThreadId}
                  data={detail}
                  isLoading={detailLoading}
                  isError={detailError}
                  onRetry={() => void refetchDetail()}
                />
              </div>
              <ReplyComposer
                disabled={composerDisabled}
                isPending={sendMessage.isPending}
                onSend={(body) => void handleSend(body)}
              />
            </>
          )}
        </section>
      </div>

      {role === "client" && (
        <NewConversationDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          onSubmit={(data) => void handleCreate(data)}
          isPending={createConversation.isPending}
        />
      )}
    </>
  );
}
